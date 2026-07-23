import { NextResponse } from 'next/server';
import { createSessionToken, sessionCookie } from '@/lib/auth';
import { query } from '@/lib/db';
import { createSupabaseAuthClient, normalizeSupabaseAuthError } from '@/lib/supabase-auth';
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

  const isAdminPortal = portal === 'admin';
  const supabase = createSupabaseAuthClient();

  if (!isAdminPortal && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      const normalizedError = normalizeSupabaseAuthError(error?.message ?? 'Invalid login credentials');
      return NextResponse.json(
        {
          code: normalizedError.code,
          message: normalizedError.message,
        },
        { status: normalizedError.status },
      );
    }

    if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
      return NextResponse.json(
        {
          code: 'email_not_verified',
          message: 'Confirme seu e-mail antes de entrar no portal. Se não recebeu, solicite um novo link.',
        },
        { status: 403 },
      );
    }

    const metadata = data.user.user_metadata ?? {};
    const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : 'Paciente Nogueira';
    const phoneWhatsapp = typeof metadata.phone_whatsapp === 'string' ? metadata.phone_whatsapp : null;

    const existingUser = await query<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      is_active: boolean;
    }>(
      `
        select id, email, full_name, role::text, is_active
        from app_users
        where email = $1
        limit 1
      `,
      [email],
    );

    if (existingUser.rows[0] && !existingUser.rows[0].is_active) {
      return NextResponse.json({ message: 'Este cadastro está inativo. Fale com a secretaria.' }, { status: 403 });
    }

    if (existingUser.rows[0] && existingUser.rows[0].role !== 'patient') {
      return NextResponse.json({ message: 'Use a entrada interna para acessar este cadastro.' }, { status: 403 });
    }

    const syncedUser = existingUser.rows[0]
      ? await query<{
          id: string;
          email: string;
          full_name: string;
          role: string;
        }>(
          `
            update app_users
            set last_login_at = now(),
                updated_at = now(),
                email_verified_at = coalesce(email_verified_at, now()),
                supabase_user_id = coalesce(supabase_user_id, $2)
            where id = $1
            returning id, email, full_name, role
          `,
          [existingUser.rows[0].id, data.user.id],
        )
      : await query<{
          id: string;
          email: string;
          full_name: string;
          role: string;
        }>(
          `
            insert into app_users (
              email,
              password_hash,
              role,
              full_name,
              phone_whatsapp,
              is_active,
              email_verified_at,
              supabase_user_id,
              last_login_at
            )
            values ($1, null, 'patient', $2, $3, true, now(), $4, now())
            returning id, email, full_name, role
          `,
          [email, fullName, phoneWhatsapp, data.user.id],
        );

    return createLoginResponse({
      id: syncedUser.rows[0].id,
      email: syncedUser.rows[0].email,
      full_name: syncedUser.rows[0].full_name,
      role: syncedUser.rows[0].role,
    });
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

  return createLoginResponse(user, isAdminPortal);
}

function createLoginResponse(
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  },
  isAdminPortal = false,
) {
  const response = NextResponse.json({
    ok: true,
    portal: isAdminPortal ? 'admin' : 'patient',
    redirectTo: isAdminPortal ? '/acesso/dashboard' : '/portal/paciente',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
  });

  response.cookies.set({
    name: sessionCookie.name,
    value: createSessionToken({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionCookie.maxAge,
  });

  return response;
}
