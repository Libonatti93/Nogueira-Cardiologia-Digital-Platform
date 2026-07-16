import { NextResponse } from 'next/server';

type LeadPayload = {
  fullName?: unknown;
  email?: unknown;
  phoneWhatsapp?: unknown;
  postSlug?: unknown;
  postTitle?: unknown;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asCleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  let payload: LeadPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  }

  const fullName = asCleanString(payload.fullName);
  const email = asCleanString(payload.email).toLowerCase();
  const phoneWhatsapp = asCleanString(payload.phoneWhatsapp);
  const postSlug = asCleanString(payload.postSlug);
  const postTitle = asCleanString(payload.postTitle);

  if (fullName.length < 3) {
    return NextResponse.json({ message: 'Informe seu nome completo.' }, { status: 400 });
  }

  if (!emailRegex.test(email)) {
    return NextResponse.json({ message: 'Informe um e-mail válido.' }, { status: 400 });
  }

  if (phoneWhatsapp.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ message: 'Informe um WhatsApp válido com DDD.' }, { status: 400 });
  }

  if (!postSlug || !postTitle) {
    return NextResponse.json({ message: 'Conteúdo educativo inválido.' }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { message: 'Banco de leads ainda não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 },
    );
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/educativo_leads`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      full_name: fullName,
      email,
      phone_whatsapp: phoneWhatsapp,
      post_slug: postSlug,
      post_title: postTitle,
      source: 'educativo',
      user_agent: request.headers.get('user-agent'),
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ message: 'Não foi possível salvar seu acesso agora.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
