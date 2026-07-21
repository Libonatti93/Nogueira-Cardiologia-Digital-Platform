import { NextResponse } from 'next/server';
import {
  createSupabaseAuthClient,
  getSupabasePasswordResetRedirectUrl,
  normalizeSupabaseAuthError,
} from '@/lib/supabase-auth';
import { cleanString, emailRegex } from '@/lib/supabase-rest';

export const runtime = 'nodejs';

type ForgotPasswordPayload = {
  email?: unknown;
};

export async function POST(request: Request) {
  let payload: ForgotPasswordPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  }

  const email = cleanString(payload.email).toLowerCase();

  if (!emailRegex.test(email)) {
    return NextResponse.json({ message: 'Informe um e-mail válido.' }, { status: 400 });
  }

  const supabase = createSupabaseAuthClient();

  if (!supabase) {
    return NextResponse.json(
      { message: 'A recuperação de senha por e-mail ainda não está configurada.' },
      { status: 503 },
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getSupabasePasswordResetRedirectUrl(request),
  });

  if (error) {
    const normalizedError = normalizeSupabaseAuthError(error.message);
    return NextResponse.json({ message: normalizedError.message }, { status: normalizedError.status });
  }

  return NextResponse.json({
    ok: true,
    message: 'Se este e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.',
  });
}
