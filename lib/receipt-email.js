import { Resend } from 'resend';
import { EVENT } from './event-config.js';
import { formatDateTime } from './utils.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getReceiptRecipients(record) {
  const emails = [record?.participant?.email, record?.guardian?.email]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(emails)];
}

function isReceiptEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY && process.env.WAIVER_RECEIPT_FROM_EMAIL,
  );
}

function buildReceiptSubject(record) {
  return `${EVENT.eventName} signed waiver receipt`;
}

function buildReceiptText(record) {
  return [
    `Your signed waiver packet for ${EVENT.eventName} is attached to this email.`,
    '',
    `Reference: ${record.submissionId}`,
    `Participant: ${record.participant.fullName}`,
    `Signed at: ${formatDateTime(record.signedAt)}`,
    '',
    'Keep this PDF for your records. If you have questions, reply to this message or contact the event organizers.',
  ].join('\n');
}

function buildReceiptHtml(record) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <p>Your signed waiver packet for <strong>${escapeHtml(EVENT.eventName)}</strong> is attached to this email.</p>
      <p>
        <strong>Reference:</strong> ${escapeHtml(record.submissionId)}<br />
        <strong>Participant:</strong> ${escapeHtml(record.participant.fullName)}<br />
        <strong>Signed at:</strong> ${escapeHtml(formatDateTime(record.signedAt))}
      </p>
      <p>Keep this PDF for your records. If you have questions, reply to this message or contact the event organizers.</p>
    </div>
  `;
}

export async function sendSignedPacketReceipt({ record, packetPdf }) {
  const recipients = getReceiptRecipients(record);

  if (!recipients.length) {
    return {
      status: 'skipped',
      recipients: [],
      reason: 'No receipt recipients were available.',
      sentAt: null,
    };
  }

  if (!isReceiptEmailConfigured()) {
    return {
      status: 'skipped',
      recipients,
      reason: 'Receipt email delivery is not configured.',
      sentAt: null,
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const payload = {
    from: process.env.WAIVER_RECEIPT_FROM_EMAIL,
    to: recipients,
    subject: buildReceiptSubject(record),
    text: buildReceiptText(record),
    html: buildReceiptHtml(record),
    attachments: [
      {
        filename: `${record.submissionId}.pdf`,
        content: packetPdf.toString('base64'),
      },
    ],
  };

  if (process.env.WAIVER_RECEIPT_REPLY_TO_EMAIL) {
    payload.replyTo = process.env.WAIVER_RECEIPT_REPLY_TO_EMAIL;
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(error.message || 'Receipt email delivery failed.');
  }

  return {
    status: 'sent',
    recipients,
    provider: 'resend',
    messageId: data?.id || null,
    sentAt: new Date().toISOString(),
  };
}
