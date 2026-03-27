import { NextResponse } from 'next/server';
import { getAdminCookieName } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const response = NextResponse.redirect(new URL('/admin', request.url));
  response.cookies.set({
    name: getAdminCookieName(),
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
