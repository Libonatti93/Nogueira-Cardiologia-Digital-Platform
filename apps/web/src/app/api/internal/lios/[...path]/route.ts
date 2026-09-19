import { authorize } from '@/lib/api-access';
import { audit } from '@/lib/audit';
import { liosPermission } from '@/lib/lios-policy';

export const runtime = 'nodejs';
type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: Context) {
  const path = (await context.params).path.join('/');
  const permission = liosPermission(path, request.method);
  if (!permission) return Response.json({ message: 'Rota indisponível.' }, { status: 404 });
  const access = await authorize(request, permission);
  if (access.response) return access.response;
  const token = process.env.LIOS_OPERATOR_TOKEN;
  if (!token) return Response.json({ message: 'LIOS aguarda configuração.' }, { status: 503 });
  const write = request.method === 'POST';
  let body: string | undefined;
  if (write) {
    body = await request.text();
    if (body.length > 50000) return Response.json({ message: 'Conteúdo excede o limite.' }, { status: 413 });
    try { JSON.parse(body); } catch { return Response.json({ message: 'JSON inválido.' }, { status: 400 }); }
    await audit({ actor: access.user!.id, action: 'lios.request', entity: 'lios', key: path }, request);
  }
  try {
    const base = process.env.LIOS_INTERNAL_URL || 'http://127.0.0.1:8081';
    const url = new URL(`/api/v1/${path}`, base);
    const params = new URL(request.url).searchParams;
    for (const key of ['rag_type', 'application_id']) {
      const value = params.get(key);
      if (value) url.searchParams.set(key, value.slice(0, 100));
    }
    const upstream = await fetch(url, { method: request.method, headers: {
      'X-Operator-Token': token, 'Content-Type': 'application/json',
    }, body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20000) });
    const data = await upstream.json();
    if (write) await audit({ actor: access.user!.id, action: 'lios.mutation', entity: 'lios', key: path,
      result: upstream.ok ? 'success' : 'failure', after: upstream.ok ? { id: data.id, status: data.status } : undefined }, request);
    if (!upstream.ok) return Response.json({ message: typeof data.detail === 'string' ? data.detail : 'Verifique os campos informados.' }, { status: upstream.status });
    return Response.json(data, { status: upstream.status, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    if (write) await audit({ actor: access.user!.id, action: 'lios.mutation', entity: 'lios', key: path, result: 'failure' }, request);
    return Response.json({ message: 'LIOS indisponível. Tente novamente em instantes.' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
