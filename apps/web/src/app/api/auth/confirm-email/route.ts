import { NextResponse } from 'next/server';
import { transaction } from '@/lib/db';
import { getPublicBaseUrl, hashVerificationToken } from '@/lib/email-verification';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();
  const redirectUrl = new URL('/portal', getPublicBaseUrl(request));

  if (!token) {
    redirectUrl.searchParams.set('verified', 'invalid');
    return NextResponse.redirect(redirectUrl);
  }

  const tokenHash = hashVerificationToken(token);

  const confirmed = await transaction(async (client) => {
    const tokenResult = await client.query<{ id: string; user_id: string }>(
      `
        select id, user_id
        from email_verification_tokens
        where token_hash = $1
          and consumed_at is null
          and expires_at > now()
        limit 1
      `,
      [tokenHash],
    );

    const verification = tokenResult.rows[0];

    if (!verification) {
      return false;
    }

    await client.query(
      `
        update app_users
        set email_verified_at = coalesce(email_verified_at, now()),
            updated_at = now()
        where id = $1
      `,
      [verification.user_id],
    );

    await client.query(
      `
        update email_verification_tokens
        set consumed_at = now()
        where id = $1
      `,
      [verification.id],
    );

    return true;
  });

  redirectUrl.searchParams.set('verified', confirmed ? '1' : 'invalid');
  return NextResponse.redirect(redirectUrl);
}
