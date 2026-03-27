import { EVENT } from './event-config.js';
import { buildPacketPdf } from './pdf.js';
import { getReceiptRecipients, sendSignedPacketReceipt } from './receipt-email.js';
import {
  ensurePersistentStorageReady,
  listPrivateFiles,
  readPrivateFile,
  savePrivateFile,
} from './storage.js';
import { createSubmissionId, sha256Hex, stableStringify } from './utils.js';
import { getResolvedWaivers } from './waivers.js';

export async function persistSubmission({ data, audit }) {
  ensurePersistentStorageReady();

  const submissionId = createSubmissionId();
  const signedAt = new Date().toISOString();
  const waivers = getResolvedWaivers({ isMinor: data.isMinor });

  const baseRecord = {
    submissionId,
    packetVersion: EVENT.packetVersion,
    signedAt,
    participant: data.participant,
    participantAgeAtSigning: data.participantAgeAtSigning,
    isMinor: data.isMinor,
    guardian: data.isMinor ? data.guardian : null,
    consents: data.consents,
    signatureHashes: {
      participant: sha256Hex(data.signatures.participant),
      guardian: data.signatures.guardian ? sha256Hex(data.signatures.guardian) : null,
    },
    event: EVENT,
    waivers,
    audit: {
      ipAddress: audit.ipAddress || null,
      userAgent: audit.userAgent || null,
      referer: audit.referer || null,
      host: audit.host || null,
    },
  };

  const digest = sha256Hex(stableStringify(baseRecord));
  const snapshot = {
    ...baseRecord,
    digest,
  };

  const packetPdf = await buildPacketPdf({
    submissionId,
    signedAt,
    digest,
    snapshot,
    signatures: data.signatures,
  });

  const packetPathname = `packets/${submissionId}.pdf`;
  const recordPathname = `submissions/${submissionId}.json`;

  await savePrivateFile(packetPathname, packetPdf, 'application/pdf');

  const finalRecord = {
    ...snapshot,
    assets: {
      packetPdf: packetPathname,
      recordJson: recordPathname,
    },
  };

  await savePrivateFile(
    recordPathname,
    JSON.stringify(finalRecord, null, 2),
    'application/json',
  );

  let receiptEmail = null;
  try {
    receiptEmail = await sendSignedPacketReceipt({
      record: finalRecord,
      packetPdf,
    });
  } catch (error) {
    receiptEmail = {
      status: 'failed',
      recipients: getReceiptRecipients(finalRecord),
      reason:
        error instanceof Error
          ? error.message
          : 'Receipt email delivery failed.',
      sentAt: null,
    };
  }

  const storedRecord = {
    ...finalRecord,
    notifications: {
      receiptEmail,
    },
  };

  await savePrivateFile(
    recordPathname,
    JSON.stringify(storedRecord, null, 2),
    'application/json',
  );

  return {
    submissionId,
    record: storedRecord,
    receiptEmail,
  };
}

export async function listSubmissionRecords() {
  ensurePersistentStorageReady();

  const files = (await listPrivateFiles('submissions/')).filter((file) =>
    file.pathname.endsWith('.json'),
  );

  const records = [];

  for (const file of files) {
    const storedFile = await readPrivateFile(file.pathname);
    if (!storedFile) {
      continue;
    }

    try {
      records.push(JSON.parse(storedFile.buffer.toString('utf8')));
    } catch {
      // Ignore malformed records so one bad file does not break admin access.
    }
  }

  return records.sort(
    (left, right) => new Date(right.signedAt).getTime() - new Date(left.signedAt).getTime(),
  );
}

export function summarizeSubmissionRecords(records) {
  const total = records.length;
  const minors = records.filter((record) => record.isMinor).length;
  const adults = total - minors;
  const latestSignedAt = records[0]?.signedAt || null;

  return {
    total,
    minors,
    adults,
    latestSignedAt,
  };
}
