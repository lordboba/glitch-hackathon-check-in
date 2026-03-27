import PDFDocument from 'pdfkit';
import { EVENT } from './event-config.js';
import { dataUrlToBuffer, formatDateLong, formatDateTime } from './utils.js';

const COLORS = {
  ink: '#0f172a',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#cbd5e1',
  panel: '#f8fafc',
};

function bounds(doc) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const top = doc.page.margins.top;
  const bottom = doc.page.height - doc.page.margins.bottom;
  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
  };
}

function ensureSpace(doc, minimumHeight = 72) {
  const pageBounds = bounds(doc);
  if (doc.y + minimumHeight > pageBounds.bottom) {
    doc.addPage();
  }
}

function drawPageHeading(doc, title, subtitle) {
  const pageBounds = bounds(doc);
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(18).text(title, pageBounds.left, doc.y, {
    width: pageBounds.width,
  });
  doc.moveDown(0.2);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10.5).text(subtitle, {
    width: pageBounds.width,
  });
  doc.moveDown(0.45);

  const lineY = doc.y;
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(pageBounds.left, lineY)
    .lineTo(pageBounds.right, lineY)
    .stroke();
  doc.moveDown(0.65);
}

function drawInfoCard(doc, title, rows) {
  ensureSpace(doc, 100);
  const pageBounds = bounds(doc);
  const x = pageBounds.left;
  const y = doc.y;
  const width = pageBounds.width;
  const padding = 12;
  const labelWidth = 132;
  const valueWidth = width - padding * 2 - labelWidth - 6;

  doc.font('Helvetica-Bold').fontSize(10.5);
  const titleHeight = doc.heightOfString(title, { width: width - padding * 2 });

  const rowHeights = rows.map((row) => {
    doc.font('Helvetica-Bold').fontSize(8.5);
    const labelHeight = doc.heightOfString(row.label, { width: labelWidth });
    doc.font('Helvetica').fontSize(9.25);
    const valueHeight = doc.heightOfString(row.value, {
      width: valueWidth,
      lineGap: 1,
    });
    return Math.max(labelHeight, valueHeight, 12);
  });

  const height =
    padding * 2 +
    titleHeight +
    8 +
    rowHeights.reduce((sum, rowHeight) => sum + rowHeight + 4, 0) -
    4;

  doc.save();
  doc.roundedRect(x, y, width, height, 10).fillAndStroke(COLORS.panel, COLORS.border);
  doc.restore();

  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10.5).text(title, x + padding, y + padding, {
    width: width - padding * 2,
  });

  let cursorY = y + padding + titleHeight + 8;
  rows.forEach((row, index) => {
    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(8.5).text(row.label, x + padding, cursorY, {
      width: labelWidth,
    });
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(9.25).text(row.value, x + padding + labelWidth + 6, cursorY, {
      width: valueWidth,
      lineGap: 1,
    });
    cursorY += rowHeights[index] + 4;
  });

  doc.y = y + height + 12;
}

function drawCompactIntro(doc) {
  const pageBounds = bounds(doc);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9.25).text(
    'This packet condenses the signed waiver set into short-form acknowledgements plus the captured signatures. The JSON submission record retains the full waiver text and audit snapshot.',
    pageBounds.left,
    doc.y,
    {
      width: pageBounds.width,
      lineGap: 2,
    },
  );
  doc.moveDown(0.75);
}

function drawSignaturePanel(doc, title, person, signatureBuffer, metaLines) {
  ensureSpace(doc, 110);
  const pageBounds = bounds(doc);
  const x = pageBounds.left;
  const y = doc.y;
  const width = pageBounds.width;
  const height = 94;
  const padding = 12;

  doc.save();
  doc.roundedRect(x, y, width, height, 10).fillAndStroke(COLORS.panel, COLORS.border);
  doc.restore();

  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(10.5).text(title, x + padding, y + padding);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.75).text(person.fullName, x + padding, y + padding + 16);

  if (signatureBuffer) {
    try {
      doc.image(signatureBuffer, x + padding, y + 34, {
        fit: [190, 24],
        align: 'left',
        valign: 'center',
      });
    } catch {
      // Ignore invalid image data and continue with the text record.
    }
  }

  doc
    .strokeColor('#94a3b8')
    .lineWidth(1)
    .moveTo(x + padding, y + 64)
    .lineTo(x + padding + 196, y + 64)
    .stroke();

  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text('Electronic signature', x + padding, y + 67);

  let metaY = y + 16;
  metaLines.forEach((line) => {
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(9.25).text(line, x + 232, metaY, {
      width: width - 244,
      lineGap: 1,
    });
    metaY += 14;
  });

  doc.y = y + height + 10;
}

function drawSignatureSummary(doc, snapshot, signatures, signedAt) {
  ensureSpace(doc, 48);
  const pageBounds = bounds(doc);
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(12).text('Electronic signatures', pageBounds.left, doc.y, {
    width: pageBounds.width,
  });
  doc.moveDown(0.3);

  drawSignaturePanel(
    doc,
    'Participant signature',
    snapshot.participant,
    dataUrlToBuffer(signatures.participant),
    [
      `Email: ${snapshot.participant.email}`,
      `Date of birth: ${formatDateLong(snapshot.participant.dob)}`,
      `Signed at: ${formatDateTime(signedAt)}`,
    ],
  );

  if (snapshot.isMinor && snapshot.guardian) {
    drawSignaturePanel(
      doc,
      'Parent / legal guardian signature',
      snapshot.guardian,
      dataUrlToBuffer(signatures.guardian),
      [
        `Relationship: ${snapshot.guardian.relationship}`,
        `Email: ${snapshot.guardian.email}`,
        `Signed at: ${formatDateTime(signedAt)}`,
      ],
    );
  }
}

function buildPacketSummaryRows({ submissionId, signedAt, digest, snapshot }) {
  return [
    { label: 'Reference', value: submissionId },
    { label: 'Event', value: `${EVENT.eventName} (${EVENT.dateLabel})` },
    { label: 'Participant', value: `${snapshot.participant.fullName} - ${snapshot.participant.email}` },
    {
      label: 'Status',
      value: snapshot.isMinor
        ? `Minor (age ${snapshot.participantAgeAtSigning})`
        : `Adult (age ${snapshot.participantAgeAtSigning})`,
    },
    {
      label: 'Guardian',
      value:
        snapshot.isMinor && snapshot.guardian
          ? `${snapshot.guardian.fullName} - ${snapshot.guardian.relationship} - ${snapshot.guardian.email}`
          : 'Not required',
    },
    { label: 'Signed at', value: formatDateTime(signedAt) },
    { label: 'IP address', value: snapshot.audit.ipAddress || 'Not captured' },
    { label: 'Digest', value: `${digest.slice(0, 24)}…` },
  ];
}

function summarizeParagraphs(paragraphs, maxLength = 180) {
  const value = paragraphs.join(' ').replace(/\s+/g, ' ').trim();
  if (value.length <= maxLength) {
    return value;
  }

  const sentence = value.match(/^(.+?[.!?])(\s|$)/);
  if (sentence && sentence[1].length <= maxLength) {
    return sentence[1];
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildWaiverSummaryLines(waiver) {
  const lines = [];

  if (waiver.summary) {
    lines.push(`Overview: ${waiver.summary}`);
  }

  if (waiver.eventBox) {
    lines.push(
      `Event details: ${waiver.eventBox.organization}; ${waiver.eventBox.activityLines.join('; ')}`,
    );
  }

  if (waiver.guardianNote) {
    lines.push(`Guardian note: ${waiver.guardianNote}`);
  }

  waiver.sections.forEach((section) => {
    lines.push(`${section.heading}: ${summarizeParagraphs(section.paragraphs)}`);
  });

  if (waiver.sourceFooter) {
    lines.push(`Source reference: ${waiver.sourceFooter}`);
  }

  return lines;
}

function drawWaiverSummary(doc, waiver) {
  ensureSpace(doc, 170);
  const pageBounds = bounds(doc);

  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(11.5).text(waiver.title, pageBounds.left, doc.y, {
    width: pageBounds.width,
  });
  doc.moveDown(0.15);

  if (waiver.subtitle) {
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9.25).text(waiver.subtitle, pageBounds.left, doc.y, {
      width: pageBounds.width,
    });
    doc.moveDown(0.35);
  }

  buildWaiverSummaryLines(waiver).forEach((line) => {
    ensureSpace(doc, 22);
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(9.5).text(`- ${line}`, pageBounds.left + 8, doc.y, {
      width: pageBounds.width - 8,
      lineGap: 1,
    });
    doc.moveDown(0.2);
  });

  doc.moveDown(0.4);
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(pageBounds.left, doc.y)
    .lineTo(pageBounds.right, doc.y)
    .stroke();
  doc.moveDown(0.55);
}

function drawFooters(doc, { submissionId, digest }) {
  const pageRange = doc.bufferedPageRange();

  for (let pageIndex = 0; pageIndex < pageRange.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    const pageBounds = bounds(doc);
    const footerY = doc.page.height - doc.page.margins.bottom - 12;
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7.5).text(
      `Reference: ${submissionId}`,
      pageBounds.left,
      footerY,
      { width: 170 },
    );
    doc.text(`Digest: ${digest.slice(0, 16)}…`, pageBounds.left + 176, footerY, { width: 148 });
    doc.text(`Page ${pageIndex + 1} of ${pageRange.count}`, pageBounds.right - 82, footerY, {
      width: 82,
      align: 'right',
    });
  }
}

export async function buildPacketPdf({ submissionId, signedAt, digest, snapshot, signatures }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: 40,
        bottom: 40,
        left: 40,
        right: 40,
      },
      bufferPages: true,
      info: {
        Title: `${EVENT.eventName} waiver packet — ${snapshot.participant.fullName}`,
        Author: EVENT.organizationName,
        Subject: `${EVENT.eventName} signed waivers`,
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      drawPageHeading(
        doc,
        EVENT.appName,
        `${EVENT.eventName} - ${snapshot.participant.fullName}`,
      );
      drawInfoCard(doc, 'Packet summary', buildPacketSummaryRows({ submissionId, signedAt, digest, snapshot }));
      drawCompactIntro(doc);
      snapshot.waivers.forEach((waiver) => {
        drawWaiverSummary(doc, waiver);
      });
      doc.addPage();
      drawPageHeading(doc, 'Signer acknowledgment', `Reference ${submissionId}`);
      drawSignatureSummary(doc, snapshot, signatures, signedAt);
      drawFooters(doc, { submissionId, digest });
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
