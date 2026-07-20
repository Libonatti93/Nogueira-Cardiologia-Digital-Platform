import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
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
      expiresAt: Date.now() + sessionMaxAgeSeconds * 1000,
    }),
  ).toString('base64url');
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;

  const [payload, signature] = token.split('.');

  if (!payload || !signature) return null;

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

    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      fullName: parsed.fullName,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export async function requireInternalUser() {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!user || !['admin', 'doctor', 'medico', 'médico'].includes(user.role)) {
    redirect('/interno');
  }

  return user;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(sessionCookieName)?.value);
}

export async function requirePatientUser() {
  const user = await getSessionUser();

  if (!user || user.role !== 'patient') {
    redirect('/portal');
  }

  if (!(await isVerifiedPatient(user.id))) {
    redirect('/portal?confirm=1');
  }

  return user;
}

export async function getVerifiedPatientUser() {
  const user = await getSessionUser();

  if (!user || user.role !== 'patient') {
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
