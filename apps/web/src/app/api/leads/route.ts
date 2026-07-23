import { NextResponse } from 'next/server';
import { transaction } from '@/lib/db';
import { verifyTurnstileToken } from '@/lib/turnstile';

type LeadPayload = {
  fullName?: unknown;
  email?: unknown;
  phoneWhatsapp?: unknown;
  postSlug?: unknown;
  postTitle?: unknown;
  accessMode?: unknown;
  'cf-turnstile-response'?: unknown;
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
  const phoneDigits = phoneWhatsapp.replace(/\D/g, '');
  const postSlug = asCleanString(payload.postSlug);
  const postTitle = asCleanString(payload.postTitle);
  const accessMode = asCleanString(payload.accessMode) || 'form';

  if (accessMode !== 'cached') {
    const turnstile = await verifyTurnstileToken(request, payload['cf-turnstile-response'], 'educativo-lead');
    if (!turnstile.ok) {
      return NextResponse.json({ message: turnstile.message }, { status: 403 });
    }
  }

  if (fullName.length < 3) {
    return NextResponse.json({ message: 'Informe seu nome completo.' }, { status: 400 });
  }

  if (!emailRegex.test(email)) {
    return NextResponse.json({ message: 'Informe um e-mail válido.' }, { status: 400 });
  }

  if (phoneDigits.length < 10) {
    return NextResponse.json({ message: 'Informe um WhatsApp válido com DDD.' }, { status: 400 });
  }

  if (!postSlug || !postTitle) {
    return NextResponse.json({ message: 'Conteúdo educativo inválido.' }, { status: 400 });
  }

  try {
    await transaction(async (client) => {
      await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [`educativo:${email}:${phoneDigits}`]);

      const existingLead = await client.query<{ id: string }>(
        `
          select id
          from leads
          where lower(email::text) = lower($1)
             or regexp_replace(coalesce(phone_whatsapp, ''), '\\D', '', 'g') = $2
          order by
            case when source = 'educativo' then 0 else 1 end,
            created_at desc
          limit 1
        `,
        [email, phoneDigits],
      );

      let leadId = existingLead.rows[0]?.id;
      let createdLead = false;

      if (leadId) {
        await client.query(
          `
            update leads
            set
              updated_at = now(),
              full_name = case when length(coalesce(full_name, '')) < length($2) then $2 else full_name end,
              email = coalesce(email, $3),
              phone_whatsapp = coalesce(nullif(phone_whatsapp, ''), $4)
            where id = $1
          `,
          [leadId, fullName, email, phoneDigits],
        );
      } else {
        const leadResult = await client.query<{ id: string }>(
          `
            insert into leads (
              full_name,
              email,
              phone_whatsapp,
              source,
              source_detail,
              stage,
              notes
            )
            values ($1, $2, $3, 'educativo', $4, 'new', $5)
            returning id
          `,
          [fullName, email, phoneDigits, postSlug, `Conteúdo educativo acessado: ${postTitle}`],
        );
        leadId = leadResult.rows[0].id;
        createdLead = true;
      }

      const existingEducationalLead = await client.query<{ id: string }>(
        `
          select id
          from educativo_leads
          where lower(email::text) = lower($1)
            and post_slug = $2
          limit 1
        `,
        [email, postSlug],
      );
      const isNewEducationalInterest = !existingEducationalLead.rows[0];

      if (!isNewEducationalInterest) {
        await client.query(
          `
            update educativo_leads
            set
              full_name = $2,
              phone_whatsapp = $3,
              post_title = $4,
              user_agent = $5,
              lead_id = coalesce(lead_id, $6)
            where id = $1
          `,
          [existingEducationalLead.rows[0].id, fullName, phoneDigits, postTitle, request.headers.get('user-agent'), leadId],
        );
      } else {
        if (!createdLead) {
          await client.query(
            `
              update leads
              set
                updated_at = now(),
                notes = concat_ws(E'\n', nullif(notes, ''), $2::text)
              where id = $1
            `,
            [leadId, `Novo interesse educativo: ${postTitle}`],
          );
        }

        await client.query(
          `
            insert into educativo_leads (
              full_name,
              email,
              phone_whatsapp,
              post_slug,
              post_title,
              source,
              user_agent,
              lead_id,
              notes
            )
            values ($1, $2, $3, $4, $5, 'educativo', $6, $7, $8)
          `,
          [fullName, email, phoneDigits, postSlug, postTitle, request.headers.get('user-agent'), leadId, `Acesso registrado via ${accessMode}.`],
        );
      }

      if (isNewEducationalInterest) {
        await client.query(
          `
            insert into lead_events (lead_id, event_type, new_stage, note, metadata)
            values ($1, 'educativo_content_unlocked', 'new', 'Lead liberou conteúdo educativo no site.', $2::jsonb)
          `,
          [leadId, JSON.stringify({ postSlug, postTitle, accessMode })],
        );
      }
    });
  } catch (error) {
    console.error('Failed to save educational lead', error);
    return NextResponse.json({ message: 'Não foi possível salvar seu acesso agora.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
