import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/access-policy';

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  sessionVersion?: number;
  roles?: string[];
  permissions?: string[];
  audience?: 'internal' | 'patient';
  mustChangePassword?: boolean;
};

const sessionCookieName = 'nogueira_session';
const sessionMaxAgeSeconds = 60 * 60 * 8;

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.DATABASE_URL;

  if (!secret) {
    throw new Error('AUTH_SECRET or DATABASE_URL must be configured for sessions.');
  }

  return secret;
}

function signPayload(payload: string) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function createSessionToken(user: SessionUser) {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      audience: user.audience ?? 'internal',
      expiresAt: Date.now() + sessionMaxAgeSeconds * 1000,
    }),
  ).toString('base64url');
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;

  const [payload, signature, extra] = token.split('.');

  if (!payload || !signature || extra) return null;

  const expectedSignature = signPayload(payload);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionUser & {
      expiresAt?: number;
    };

    if (typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Date.now()
      || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(parsed.id)) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      fullName: parsed.fullName,
      role: parsed.role,
      sessionVersion: parsed.sessionVersion ?? 0,
      audience: parsed.audience,
    };
  } catch {
    return null;
  }
}

export async function requireInternalUser(permission = 'internal.access') {
  const user = await getSessionUser();

  if (!user || user.audience !== 'internal' || !hasPermission(user, 'panel.access')) {
    redirect('/acesso');
  }
  if (user.mustChangePassword) redirect('/alterar-senha');
  if (!hasPermission(user, permission)) redirect('/sem-acesso');

  return user;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = verifySessionToken(cookieStore.get(sessionCookieName)?.value);
  if (!token) return null;
  const user = await loadSessionUser(token.id);
  return user && user.sessionVersion === token.sessionVersion ? { ...user, audience: token.audience } : null;
}

export async function loadSessionUser(id: string): Promise<SessionUser | null> {
  const result = await query<{ id: string; email: string; full_name: string; role: string;
    session_version: number; must_change_password: boolean; roles: string[]; permissions: string[] }>(`
    select u.id, u.email, u.full_name, u.role, u.session_version,u.must_change_password,
      coalesce(array_agg(distinct ur.role_id) filter (where ur.role_id is not null), '{}') roles,
      coalesce(array_agg(distinct rp.permission_id) filter (where rp.permission_id is not null), '{}') permissions
    from app_users u left join user_roles ur on ur.user_id = u.id
    left join role_permissions rp on rp.role_id = ur.role_id
    where u.id = $1 and u.is_active = true group by u.id`, [id]);
  const row = result.rows[0];
  return row ? { id: row.id, email: row.email, fullName: row.full_name, role: row.role,
    sessionVersion: row.session_version, mustChangePassword: row.must_change_password, roles: row.roles, permissions: row.permissions } : null;
}

export function canAccessInternalArea(user: Pick<SessionUser, 'permissions'>) {
  return hasPermission(user, 'internal.access');
}

export async function requirePatientUser() {
  const user = await getSessionUser();

  if (!user || user.role !== 'patient' || user.audience === 'internal') {
    redirect('/portal');
  }

  if (!(await isVerifiedPatient(user.id))) {
    redirect('/portal?confirm=1');
  }

  return user;
}

export async function getVerifiedPatientUser() {
  const user = await getSessionUser();

  if (!user || user.role !== 'patient' || user.audience === 'internal') {
    return null;
  }

  if (!(await isVerifiedPatient(user.id))) {
    return null;
  }

  return user;
}

async function isVerifiedPatient(userId: string) {
  const result = await query<{ email_verified_at: Date | null; is_active: boolean }>(
    'select email_verified_at, is_active from app_users where id = $1 limit 1',
    [userId],
  );
  const currentUser = result.rows[0];

  return Boolean(currentUser?.is_active && currentUser.email_verified_at);
}

export const sessionCookie = {
  name: sessionCookieName,
  maxAge: sessionMaxAgeSeconds,
};
