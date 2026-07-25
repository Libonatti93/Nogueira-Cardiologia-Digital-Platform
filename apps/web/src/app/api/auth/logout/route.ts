import { NextResponse } from 'next/server';
import { sessionCookie } from '@/lib/auth';
import { getPublicBaseUrl } from '@/lib/email-verification';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/portal?logout=1', getPublicBaseUrl(request)), 303);
  response.cookies.set({
    name: sessionCookie.name,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
