import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { query, transaction } from '@/lib/db';
import { getPostBySlug } from '@/data/blog-posts';
import { getPublishedEducativoPostBySlug } from '@/lib/educativo-posts';
import { isSameOrigin } from '@/lib/access-policy';
import { getEducationalAccess, issueEducationalAccess, educationalCookie, educationalMaxAge } from '@/lib/educativo-access';
import { readLimitedJson } from '@/lib/educativo-policy';
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
  if (!isSameOrigin(request)) return NextResponse.json({ message: 'Origem inválida.' }, { status: 403 });
  let payload: LeadPayload;

  try {
    payload = await readLimitedJson(request, 8000);
  } catch {
    return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  }

  const access = await getEducationalAccess();
  const fullName = access?.full_name || asCleanString(payload.fullName).slice(0, 180);
  const email = access?.email || asCleanString(payload.email).toLowerCase().slice(0, 254);
  const phoneWhatsapp = access?.phone_whatsapp || asCleanString(payload.phoneWhatsapp).slice(0, 30);
  const phoneDigits = phoneWhatsapp.replace(/\D/g, '');
  const postSlug = asCleanString(payload.postSlug);
  const post = getPostBySlug(postSlug) || (await getPublishedEducativoPostBySlug(postSlug));
  if (!post) return NextResponse.json({ message: 'Conteúdo indisponível.' }, { status: 404 });
  const postTitle = post.title;
  const accessMode = access ? 'session' : 'form';

  if (!access) {
    const ip = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'unknown';
    const key = createHash('sha256').update('educativo-ip:' + ip).digest('hex');
    const rate = (await query<{attempts:number}>(`insert into auth_rate_limits values($1,1,now()+interval '15 minutes')
      on conflict(key) do update set attempts=case when auth_rate_limits.expires_at<now() then 1 else auth_rate_limits.attempts+1 end,
      expires_at=case when auth_rate_limits.expires_at<now() then now()+interval '15 minutes' else auth_rate_limits.expires_at end returning attempts`, [key])).rows[0];
    if (rate.attempts > 40) return NextResponse.json({ message: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
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

  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return NextResponse.json({ message: 'Informe um WhatsApp válido com DDD.' }, { status: 400 });
  }

  if (!postSlug || !postTitle) {
    return NextResponse.json({ message: 'Conteúdo educativo inválido.' }, { status: 400 });
  }

  let token: string | undefined;
  try {
    token = await transaction(async (client) => {
      await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [`educativo:${email}`]);

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
      const registration = (await client.query('select id from educativo_leads where lower(email::text)=lower($1) and post_slug=$2 limit 1', [email, postSlug])).rows[0];
      return access ? undefined : issueEducationalAccess(client, registration.id);
    });
  } catch {
    console.error('educativo_registration_failed');
    return NextResponse.json({ message: 'Não foi possível salvar seu acesso agora.' }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  if (token) response.cookies.set(educationalCookie, token, { httpOnly: true, secure: new URL(request.headers.get('origin') || request.url).protocol === 'https:', sameSite: 'lax', path: '/', maxAge: educationalMaxAge });
  return response;
}
