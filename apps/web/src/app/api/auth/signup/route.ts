import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createEmailVerification, sendVerificationEmail } from '@/lib/email-verification';
import { createSupabaseAuthClient, getSupabaseEmailRedirectUrl, normalizeSupabaseAuthError } from '@/lib/supabase-auth';
import { cleanString, emailRegex } from '@/lib/supabase-rest';

export const runtime = 'nodejs';

type SignupPayload = {
  fullName?: unknown;
  email?: unknown;
  phoneWhatsapp?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let payload: SignupPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  }

  const fullName = cleanString(payload.fullName);
  const email = cleanString(payload.email).toLowerCase();
  const phoneWhatsapp = cleanString(payload.phoneWhatsapp);
  const password = cleanString(payload.password);

  if (fullName.length < 3) {
    return NextResponse.json({ message: 'Informe seu nome completo.' }, { status: 400 });
  }

  if (!emailRegex.test(email)) {
    return NextResponse.json({ message: 'Informe um e-mail válido.' }, { status: 400 });
  }

  if (phoneWhatsapp.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ message: 'Informe um WhatsApp válido com DDD.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: 'A senha precisa ter pelo menos 8 caracteres.' }, { status: 400 });
  }

  const existing = await query('select id from app_users where email = $1 limit 1', [email]);

  if (existing.rowCount) {
    return NextResponse.json({ message: 'Este e-mail já possui cadastro. Use a área de login.' }, { status: 409 });
  }

  const supabase = createSupabaseAuthClient();

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getSupabaseEmailRedirectUrl(request),
        data: {
          full_name: fullName,
          phone_whatsapp: phoneWhatsapp,
          portal: 'patient',
        },
      },
    });

    if (error) {
      const normalizedError = normalizeSupabaseAuthError(error.message);
      return NextResponse.json({ message: normalizedError.message }, { status: normalizedError.status });
    }

    await query(
      `
        insert into app_users (email, password_hash, role, full_name, phone_whatsapp, email_verified_at, supabase_user_id)
        values ($1, null, 'patient', $2, $3, null, $4)
        on conflict (email) do update set
          updated_at = now(),
          full_name = excluded.full_name,
          phone_whatsapp = excluded.phone_whatsapp,
          supabase_user_id = coalesce(app_users.supabase_user_id, excluded.supabase_user_id)
      `,
      [email, fullName, phoneWhatsapp, data.user?.id ?? null],
    );

    return NextResponse.json({
      ok: true,
      emailSent: true,
      message: 'Cadastro criado. Enviamos um link de confirmação para seu e-mail. Confirme para liberar o portal.',
    });
  }

  const createdUser = await query<{ id: string }>(
    `
      insert into app_users (email, password_hash, role, full_name, phone_whatsapp, email_verified_at)
      values ($1, crypt($2, gen_salt('bf')), 'patient', $3, $4, null)
      returning id
    `,
    [email, password, fullName, phoneWhatsapp],
  );

  const verification = await createEmailVerification(createdUser.rows[0].id, email, request);
  const emailResult = await sendVerificationEmail({
    to: email,
    fullName,
    verifyUrl: verification.verifyUrl,
  });

  return NextResponse.json({
    ok: true,
    emailSent: emailResult.sent,
    verifyUrl: emailResult.sent ? undefined : verification.verifyUrl,
    message: emailResult.sent
      ? 'Cadastro criado. Enviamos um link de confirmação para seu e-mail. Confirme para liberar o portal.'
      : 'Cadastro criado. O envio de e-mail ainda não está configurado; use o link de teste abaixo para confirmar o cadastro.',
  });
}
