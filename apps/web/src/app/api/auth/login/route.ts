import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSessionToken, loadSessionUser, sessionCookie } from '@/lib/auth';
import { isSameOrigin } from '@/lib/access-policy';
import { audit } from '@/lib/audit';
import { query } from '@/lib/db';
import { createSupabaseAuthClient, normalizeSupabaseAuthError } from '@/lib/supabase-auth';
import { cleanString, emailRegex } from '@/lib/supabase-rest';
import { verifyTurnstileToken } from '@/lib/turnstile';

export const runtime = 'nodejs';
type Identity = { id: string; email: string; role: string; is_active: boolean;
  email_verified_at: Date | null; supabase_user_id: string | null; local_password: boolean };

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: 'Origem inválida.' }, { status: 403 });
  let payload;
  try { payload = await request.json(); } catch { return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 }); }
  const email = cleanString(payload?.email).toLowerCase();
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const internal = payload?.portal === 'admin';
  if (!emailRegex.test(email) || email.length > 254 || !password || password.length > 512) {
    return NextResponse.json({ message: 'Informe e-mail e senha válidos.' }, { status: 400 });
  }
  const ip = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ?? 'unknown';
  await query('delete from auth_rate_limits where expires_at < now()');
  for (const key of [`email:${email}`, `ip:${ip}`]) {
    const hash = createHash('sha256').update(key).digest('hex');
    const limit = await query<{ attempts: number }>(`insert into auth_rate_limits values ($1,1,now()+interval '15 minutes')
      on conflict (key) do update set attempts = case when auth_rate_limits.expires_at < now() then 1 else auth_rate_limits.attempts+1 end,
      expires_at = case when auth_rate_limits.expires_at < now() then now()+interval '15 minutes' else auth_rate_limits.expires_at end
      returning attempts`, [hash]);
    if (limit.rows[0].attempts > (key.startsWith('email:') ? 15 : 100)) {
      await audit({ action: 'auth.login', result: 'denied', metadata: { code: 'rate_limited' } }, request);
      return NextResponse.json({ message: 'Muitas tentativas. Aguarde 15 minutos.' }, { status: 429 });
    }
  }
  if (!internal) {
    const check = await verifyTurnstileToken(request, payload['cf-turnstile-response'], 'patient-login');
    if (!check.ok) return NextResponse.json({ message: check.message }, { status: 403 });
  }
  let identity = (await query<Identity>(`select id, email, role, is_active, email_verified_at,
    supabase_user_id, password_hash is not null as local_password from app_users where email=$1`, [email])).rows[0];
  const deny = async () => {
    await audit({ actor: identity?.id, action: 'auth.login', result: 'denied' }, request);
    return NextResponse.json({ message: 'E-mail ou senha inválidos, ou acesso indisponível.' }, { status: 401 });
  };
  if (identity && !identity.is_active) return deny();
  const supabase = createSupabaseAuthClient();
  const useSupabase = Boolean(supabase && (!internal || !identity?.local_password));
  if (useSupabase && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error && (error.name === 'AuthRetryableFetchError' || error.status === 0 || (error.status ?? 0) >= 500)) {
      await audit({ actor: identity?.id, action: 'auth.login', result: 'failure',
        metadata: { provider: 'supabase', code: 'provider_unavailable' } }, request);
      return NextResponse.json({ code: 'auth_unavailable',
        message: 'O serviço de autenticação está temporariamente indisponível. Tente novamente mais tarde.' }, { status: 503 });
    }
    if (error && !internal) {
      const normalized = normalizeSupabaseAuthError(error.message);
      if (normalized.code === 'email_not_verified') {
        await audit({ actor: identity?.id, action: 'auth.login', result: 'denied' }, request);
        return NextResponse.json(normalized, { status: normalized.status });
      }
    }
    if (error || !data.user || data.user.email?.toLowerCase() !== email) return deny();
    if (!data.user.email_confirmed_at && !data.user.confirmed_at) return deny();
    if (identity?.supabase_user_id && identity.supabase_user_id !== data.user.id) return deny();
    if (internal && (!identity || identity.supabase_user_id !== data.user.id)) return deny();
    if (!identity) {
      const metadata = data.user.user_metadata ?? {};
      const name = typeof metadata.full_name === 'string' ? metadata.full_name.slice(0, 160) : 'Paciente Nogueira';
      const phone = typeof metadata.phone_whatsapp === 'string' ? metadata.phone_whatsapp.slice(0, 40) : null;
      identity = (await query<Identity>(`insert into app_users (email,full_name,role,email_verified_at,supabase_user_id,phone_whatsapp)
        values ($1,$2,'patient',now(),$3,$4) returning id,email,role,is_active,email_verified_at,supabase_user_id`,
      [email, name, data.user.id, phone])).rows[0];
    } else {
      await query(`update app_users set email_verified_at=coalesce(email_verified_at,now()),
        supabase_user_id=coalesce(supabase_user_id,$2) where id=$1`, [identity.id, data.user.id]);
    }
  } else {
    if (!identity) return deny();
    const valid = await query(`select id from app_users where id=$1 and is_active=true and password_hash=crypt($2,password_hash)`, [identity.id, password]);
    if (!valid.rowCount) return deny();
    if (!internal && identity.role === 'patient' && !identity.email_verified_at) {
      await audit({ actor: identity.id, action: 'auth.login', result: 'denied' }, request);
      return NextResponse.json({ code: 'email_not_verified', message: 'Confirme seu e-mail antes de entrar no portal.' }, { status: 403 });
    }
  }
  const user = await loadSessionUser(identity.id);
  if (!user || (internal && !user.permissions?.length)) return deny();
  if (!internal && user.role !== 'patient') return deny();
  await query('update app_users set last_login_at=now() where id=$1', [user.id]);
  await audit({ actor: user.id, action: 'auth.login', metadata: { provider: useSupabase ? 'supabase' : 'local' } }, request);
  const internalLanding = user.permissions?.includes('internal.access') ? '/acesso/dashboard'
    : user.permissions?.includes('lios.read') ? '/acesso/lios' : '/acesso/governanca';
  const response = NextResponse.json({ ok: true, portal: internal ? 'admin' : 'patient',
    redirectTo: internal ? internalLanding : '/portal/paciente', user });
  response.cookies.set({ name: sessionCookie.name,
    value: createSessionToken({ id: user.id, email: user.email, fullName: user.fullName, role: user.role, sessionVersion: user.sessionVersion }),
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: sessionCookie.maxAge });
  return response;
}
