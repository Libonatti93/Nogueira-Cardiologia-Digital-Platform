import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createEmailVerification, sendVerificationEmail } from '@/lib/email-verification';
import { createSupabaseAuthClient, getSupabaseEmailRedirectUrl, normalizeSupabaseAuthError } from '@/lib/supabase-auth';
import { cleanString, emailRegex } from '@/lib/supabase-rest';

export const runtime = 'nodejs';

type ResendPayload = {
  email?: unknown;
};

export async function POST(request: Request) {
  let payload: ResendPayload;

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

  if (supabase) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getSupabaseEmailRedirectUrl(request),
      },
    });

    if (error) {
      const normalizedError = normalizeSupabaseAuthError(error.message);
      return NextResponse.json({ message: normalizedError.message }, { status: normalizedError.status });
    }

    return NextResponse.json({
      ok: true,
      emailSent: true,
      message: 'Se este e-mail tiver um cadastro pendente, enviaremos um novo link de confirmação.',
    });
  }

  const result = await query<{
    id: string;
    full_name: string;
    email: string;
    role: string;
    email_verified_at: Date | null;
  }>(
    `
      select id, full_name, email, role::text, email_verified_at
      from app_users
      where email = $1
        and is_active = true
      limit 1
    `,
    [email],
  );

  const user = result.rows[0];

  if (!user || user.role !== 'patient') {
    return NextResponse.json({
      ok: true,
      message: 'Se este e-mail tiver um cadastro pendente, enviaremos um novo link de confirmação.',
    });
  }

  if (user.email_verified_at) {
    return NextResponse.json({
      ok: true,
      message: 'Este e-mail já está confirmado. Você já pode entrar no portal.',
    });
  }

  const verification = await createEmailVerification(user.id, user.email, request);
  const emailResult = await sendVerificationEmail({
    to: user.email,
    fullName: user.full_name,
    verifyUrl: verification.verifyUrl,
  });

  return NextResponse.json({
    ok: true,
    emailSent: emailResult.sent,
    verifyUrl: emailResult.sent ? undefined : verification.verifyUrl,
    message: emailResult.sent
      ? 'Enviamos um novo link de confirmação para seu e-mail.'
      : 'O envio de e-mail ainda não está configurado; use o link de teste abaixo para confirmar o cadastro.',
  });
}
