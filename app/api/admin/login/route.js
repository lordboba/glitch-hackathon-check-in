import { NextResponse } from 'next/server';
import {
  createAdminSessionCookieValue,
  getAdminCookieOptions,
  isAdminConfigured,
  verifyAdminPassword,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isAdminConfigured()) {
    return NextResponse.redirect(new URL('/admin?error=not-configured', request.url));
  }

  const formData = await request.formData();
  const password = String(formData.get('password') || '');

  if (!verifyAdminPassword(password)) {
    return NextResponse.redirect(new URL('/admin?error=bad-password', request.url));
  }

  const response = NextResponse.redirect(new URL('/admin', request.url));
  response.cookies.set(getAdminCookieOptions(createAdminSessionCookieValue()));
  return response;
}
