import { NextResponse } from 'next/server';
import { createSessionToken, sessionCookie } from '@/lib/auth';
import { query } from '@/lib/db';
import { cleanString, emailRegex } from '@/lib/supabase-rest';

export const runtime = 'nodejs';

type LoginPayload = {
  email?: unknown;
  password?: unknown;
  portal?: unknown;
};

export async function POST(request: Request) {
  let payload: LoginPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  }

  const email = cleanString(payload.email).toLowerCase();
  const password = cleanString(payload.password);
  const portal = cleanString(payload.portal);

  if (!emailRegex.test(email)) {
    return NextResponse.json({ message: 'Informe um e-mail válido.' }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ message: 'Informe sua senha.' }, { status: 400 });
  }

  const result = await query<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    email_verified_at: Date | null;
  }>(
    `
      update app_users
      set last_login_at = now()
      where email = $1
        and is_active = true
        and password_hash = crypt($2, password_hash)
      returning id, email, full_name, role, email_verified_at
    `,
    [email, password],
  );

  const user = result.rows[0];

  if (!user) {
    return NextResponse.json({ message: 'E-mail ou senha inválidos.' }, { status: 401 });
  }

  const role = user.role;
  const isAdminPortal = portal === 'admin';
  const canAccessAdmin = ['admin', 'doctor', 'medico', 'médico'].includes(role);

  if (!isAdminPortal && role === 'patient' && !user.email_verified_at) {
    return NextResponse.json(
      {
        code: 'email_not_verified',
        message: 'Confirme seu e-mail antes de entrar no portal. Se não recebeu, solicite um novo link.',
      },
      { status: 403 },
    );
  }

  if (isAdminPortal && !canAccessAdmin) {
    return NextResponse.json({ message: 'Este acesso é exclusivo para médicos e administradores.' }, { status: 403 });
  }

  const response = NextResponse.json({
    ok: true,
    portal: isAdminPortal ? 'admin' : 'patient',
    redirectTo: isAdminPortal ? '/interno/dashboard' : '/portal/paciente',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role,
    },
  });

  response.cookies.set({
    name: sessionCookie.name,
    value: createSessionToken({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role,
    }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionCookie.maxAge,
  });

  return response;
}
