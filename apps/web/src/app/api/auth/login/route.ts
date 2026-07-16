import { NextResponse } from 'next/server';
import { cleanString, emailRegex, getSupabaseConfig } from '@/lib/supabase-rest';

type LoginPayload = {
  email?: unknown;
  password?: unknown;
  portal?: unknown;
};

type SupabaseUser = {
  email?: string;
  user_metadata?: {
    role?: string;
    full_name?: string;
  };
};

type SupabaseLoginResponse = {
  access_token?: string;
  user?: SupabaseUser;
  msg?: string;
  message?: string;
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

  let supabaseUrl: string;
  let anonKey: string;

  try {
    ({ supabaseUrl, anonKey } = getSupabaseConfig());
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Supabase não configurado.' }, { status: 503 });
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const body = (await response.json().catch(() => null)) as SupabaseLoginResponse | null;

  if (!response.ok || !body?.access_token) {
    return NextResponse.json({ message: body?.msg ?? body?.message ?? 'E-mail ou senha inválidos.' }, { status: response.status || 401 });
  }

  const role = body.user?.user_metadata?.role ?? 'patient';
  const isAdminPortal = portal === 'admin';
  const canAccessAdmin = ['admin', 'doctor', 'medico', 'médico'].includes(role);

  if (isAdminPortal && !canAccessAdmin) {
    return NextResponse.json({ message: 'Este acesso é exclusivo para médicos e administradores.' }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    portal: isAdminPortal ? 'admin' : 'patient',
    user: {
      email: body.user?.email,
      fullName: body.user?.user_metadata?.full_name,
      role,
    },
    accessToken: body.access_token,
  });
}
