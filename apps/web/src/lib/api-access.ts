import { getSessionUser } from '@/lib/auth';
import { hasPermission, isSameOrigin } from '@/lib/access-policy';
import { audit } from '@/lib/audit';

export async function authorize(request: Request, permission: string) {
  const user = await getSessionUser();
  if (!user || user.audience !== 'internal' || !hasPermission(user, 'panel.access') || !hasPermission(user, permission)) {
    if (user) await audit({ actor: user.id, action: 'access.denied', result: 'denied', metadata: { permission } }, request);
    return { response: Response.json({ message: 'Acesso não autorizado.' }, { status: user ? 403 : 401 }) };
  }
  if (user.mustChangePassword) {
    return { response: Response.json({ message: 'Altere a senha temporária antes de continuar.', code: 'password_change_required' }, { status: 403 }) };
  }
  if (!['GET', 'HEAD'].includes(request.method) && !isSameOrigin(request)) {
    await audit({ actor: user.id, action: 'access.origin_denied', result: 'denied' }, request);
    return { response: Response.json({ message: 'Origem inválida.' }, { status: 403 }) };
  }
  return { user };
}
