import { NextResponse } from 'next/server';
import { sessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/portal', request.url), 303);
  response.cookies.set({
    name: sessionCookie.name,
    value: '',
    path: '/',
    maxAge: 0,
  });
  return response;
}
