import path from 'node:path';
import { NextResponse } from 'next/server';
import { getAdminCookieName, verifyAdminSessionValue } from '@/lib/auth';
import { readPrivateFile } from '@/lib/storage';
import { sanitizeStoragePath } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = request.cookies.get(getAdminCookieName())?.value;
  if (!verifyAdminSessionValue(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const pathname = url.searchParams.get('pathname');

  if (!pathname) {
    return NextResponse.json({ error: 'Missing pathname' }, { status: 400 });
  }

  let safePathname = '';
  try {
    safePathname = sanitizeStoragePath(pathname);
  } catch {
    return NextResponse.json({ error: 'Invalid pathname' }, { status: 400 });
  }

  const file = await readPrivateFile(safePathname);
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const headers = new Headers({
    'Content-Type': file.contentType,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-cache',
  });

  const filename = path.basename(safePathname);
  headers.set(
    'Content-Disposition',
    safePathname.endsWith('.pdf')
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`,
  );

  return new NextResponse(file.buffer, { status: 200, headers });
}
