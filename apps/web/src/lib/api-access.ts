import { getSessionUser } from '@/lib/auth';
import { hasPermission, isSameOrigin } from '@/lib/access-policy';
import { audit } from '@/lib/audit';

export async function authorize(request: Request, permission: string) {
  const user = await getSessionUser();
  if (!user || !hasPermission(user, permission)) {
    if (user) await audit({ actor: user.id, action: 'access.denied', result: 'denied', metadata: { permission } }, request);
    return { response: Response.json({ message: 'Acesso não autorizado.' }, { status: user ? 403 : 401 }) };
  }
  if (!['GET', 'HEAD'].includes(request.method) && !isSameOrigin(request)) {
    await audit({ actor: user.id, action: 'access.origin_denied', result: 'denied' }, request);
    return { response: Response.json({ message: 'Origem inválida.' }, { status: 403 }) };
  }
  return { user };
}
