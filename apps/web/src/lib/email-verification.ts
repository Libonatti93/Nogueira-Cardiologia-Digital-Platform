import { createHash, randomBytes } from 'crypto';
import { query } from '@/lib/db';

const verificationTtlHours = 24;

export function hashVerificationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function getPublicBaseUrl(request?: Request) {
  if (request) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';

    if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
      return `${forwardedProto.split(',')[0]}://${forwardedHost.split(',')[0]}`;
    }
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
    return configured.replace(/\/$/, '');
  }

  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  return 'https://www.nogueiracardiologia.com.br';
}

export async function createEmailVerification(userId: string, email: string, request?: Request) {
  await query(
    `
      update email_verification_tokens
      set consumed_at = now()
      where user_id = $1
        and purpose = 'signup'
        and consumed_at is null
    `,
    [userId],
  );

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashVerificationToken(token);

  await query(
    `
      insert into email_verification_tokens (user_id, token_hash, sent_to_email, expires_at)
      values ($1, $2, $3, now() + ($4::text || ' hours')::interval)
    `,
    [userId, tokenHash, email, String(verificationTtlHours)],
  );

  const verifyUrl = `${getPublicBaseUrl(request)}/api/auth/confirm-email?token=${encodeURIComponent(token)}`;

  return {
    verifyUrl,
    expiresInHours: verificationTtlHours,
  };
}

export async function sendVerificationEmail({
  to,
  fullName,
  verifyUrl,
}: {
  to: string;
  fullName: string;
  verifyUrl: string;
}) {
  const from = process.env.EMAIL_FROM ?? 'Nogueira Cardiologia <no-reply@nogueiracardiologia.com.br>';
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(`[email-verification] Link de confirmacao para ${to}: ${verifyUrl}`);
    return { sent: false, provider: 'console' as const };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Confirme seu cadastro na Nogueira Cardiologia',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:620px">
          <h1 style="color:#0F3760;font-size:24px">Confirme seu e-mail</h1>
          <p>Olá, ${escapeHtml(fullName)}.</p>
          <p>Recebemos seu cadastro no portal da Nogueira Cardiologia. Para liberar seu acesso, confirme que este e-mail pertence a você.</p>
          <p>
            <a href="${verifyUrl}" style="display:inline-block;background:#14508B;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">
              Confirmar cadastro
            </a>
          </p>
          <p>Se o botão não abrir, copie e cole este link no navegador:</p>
          <p style="word-break:break-all;color:#14508B">${verifyUrl}</p>
          <p>Este link expira em 24 horas.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error(`[email-verification] Falha ao enviar e-mail para ${to}: ${response.status} ${details}`);
    return { sent: false, provider: 'resend' as const };
  }

  return { sent: true, provider: 'resend' as const };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
