import { NextResponse } from 'next/server';
import { cleanString, emailRegex, getSupabaseConfig } from '@/lib/supabase-rest';

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

  let supabaseUrl: string;
  let anonKey: string;

  try {
    ({ supabaseUrl, anonKey } = getSupabaseConfig());
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Supabase não configurado.' }, { status: 503 });
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      data: {
        full_name: fullName,
        phone_whatsapp: phoneWhatsapp,
        role: 'patient',
      },
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json({ message: body?.msg ?? body?.message ?? 'Não foi possível criar seu acesso.' }, { status: response.status });
  }

  return NextResponse.json({
    ok: true,
    message: body?.session
      ? 'Cadastro criado. Você já pode solicitar sua consulta.'
      : 'Cadastro criado. Confirme seu e-mail para liberar o acesso.',
  });
}
