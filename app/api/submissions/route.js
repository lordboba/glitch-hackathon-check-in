import { NextResponse } from 'next/server';
import { persistSubmission } from '@/lib/submission-store';
import { validateSubmissionPayload } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getClientIpAddress(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }

  return request.headers.get('x-real-ip') || null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = validateSubmissionPayload(body);

    if (!validation.valid) {
      return NextResponse.json(
        {
          ok: false,
          errors: validation.errors,
          message: 'Please correct the highlighted fields and try again.',
        },
        { status: 400 },
      );
    }

    const result = await persistSubmission({
      data: validation.data,
      audit: {
        ipAddress: getClientIpAddress(request),
        userAgent: request.headers.get('user-agent') || null,
        referer: request.headers.get('referer') || null,
        host: request.headers.get('host') || null,
      },
    });

    return NextResponse.json({
      ok: true,
      submissionId: result.submissionId,
      receiptEmail: result.receiptEmail,
    });
  } catch (error) {
    console.error('Submission error', error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'The waiver packet could not be created.',
      },
      { status: 500 },
    );
  }
}
