import { NextResponse } from 'next/server';
import { getSessionUser, sessionCookie } from '@/lib/auth';
import { isSameOrigin } from '@/lib/access-policy';
import { audit } from '@/lib/audit';
import { query } from '@/lib/db';
import { getPublicBaseUrl } from '@/lib/email-verification';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: 'Origem inválida.' }, { status: 403 });
  const user = await getSessionUser();
  if (user) {
    await query('update app_users set session_version=session_version+1 where id=$1', [user.id]);
    await audit({ actor: user.id, action: 'auth.logout' }, request);
  }
  const target = user?.audience === 'internal' ? new URL('/acesso?logout=1', request.headers.get('origin')!)
    : new URL('/portal?logout=1', getPublicBaseUrl(request));
  const response = NextResponse.redirect(target, 303);
  response.cookies.set({
    name: sessionCookie.name,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
