import PDFDocument from 'pdfkit';
import { EVENT } from './event-config.js';
import { dataUrlToBuffer, formatDateLong, formatDateTime } from './utils.js';

const COLORS = {
  ink: '#0f172a',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#cbd5e1',
  panel: '#f8fafc',
  accent: '#4f46e5',
  accentSoft: '#eef2ff',
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
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(20).text(title, pageBounds.left, doc.y, {
    width: pageBounds.width,
  });
  doc.moveDown(0.2);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(11).text(subtitle, {
    width: pageBounds.width,
  });
  doc.moveDown(0.6);
  const lineY = doc.y;
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(pageBounds.left, lineY)
    .lineTo(pageBounds.right, lineY)
    .stroke();
  doc.moveDown(0.8);
}

function drawInfoCard(doc, title, rows) {
  ensureSpace(doc, 100);
  const pageBounds = bounds(doc);
  const x = pageBounds.left;
  const y = doc.y;
  const width = pageBounds.width;
  const padding = 14;
  const labelWidth = 150;
  const valueWidth = width - padding * 2 - labelWidth - 2;

  doc.font('Helvetica-Bold').fontSize(11);
  const titleHeight = doc.heightOfString(title, { width: width - padding * 2 });

  const rowHeights = rows.map((row) => {
    doc.font('Helvetica-Bold').fontSize(9);
    const labelHeight = doc.heightOfString(row.label, { width: labelWidth });
    doc.font('Helvetica').fontSize(10);
    const valueHeight = doc.heightOfString(row.value, {
      width: valueWidth,
      lineGap: 2,
    });
    return Math.max(labelHeight, valueHeight, 14);
  });

  const height =
    padding * 2 +
    titleHeight +
    10 +
    rowHeights.reduce((sum, rowHeight) => sum + rowHeight + 6, 0) -
    6;

  doc.save();
  doc.roundedRect(x, y, width, height, 10).fillAndStroke(COLORS.panel, COLORS.border);
  doc.restore();

  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(11).text(title, x + padding, y + padding, {
    width: width - padding * 2,
  });
  let cursorY = y + padding + titleHeight + 10;

  rows.forEach((row, index) => {
    doc.fillColor(COLORS.muted).font('Helvetica-Bold').fontSize(9).text(row.label, x + padding, cursorY, {
      width: labelWidth,
    });
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(10).text(row.value, x + padding + labelWidth + 2, cursorY, {
      width: valueWidth,
      lineGap: 2,
    });
    cursorY += rowHeights[index] + 6;
  });

  doc.y = y + height + 18;
}

function drawEventBox(doc, waiver) {
  if (!waiver.eventBox) {
    return;
  }

  ensureSpace(doc, 90);
  const pageBounds = bounds(doc);
  const x = pageBounds.left;
  const y = doc.y;
  const width = pageBounds.width;
  const padding = 14;
  const height = 92;

  doc.save();
  doc.roundedRect(x, y, width, height, 10).fillAndStroke(COLORS.accentSoft, '#c7d2fe');
  doc.restore();

  doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(11).text('Event details', x + padding, y + padding);
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(10).text('Student organization / club', x + padding, y + 34);
  doc.fillColor(COLORS.text).font('Helvetica').text(waiver.eventBox.organization, x + 190, y + 34);

  doc.fillColor(COLORS.text).font('Helvetica-Bold').text('Activity description', x + padding, y + 52);
  doc.fillColor(COLORS.text).font('Helvetica').text(waiver.eventBox.activityLines.join('\n'), x + 190, y + 52, {
    width: width - 204,
  });

  doc.y = y + height + 18;
}

function drawParagraph(doc, text) {
  const pageBounds = bounds(doc);
  doc.fillColor(COLORS.text).font('Helvetica').fontSize(11).text(text, pageBounds.left, doc.y, {
    width: pageBounds.width,
    lineGap: 3,
    align: 'left',
  });
  doc.moveDown(0.55);
}

function drawWaiverSections(doc, waiver) {
  if (waiver.guardianNote) {
    ensureSpace(doc, 40);
    const pageBounds = bounds(doc);
    doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(10).text(waiver.guardianNote, pageBounds.left, doc.y, {
      width: pageBounds.width,
      lineGap: 2,
    });
    doc.moveDown(0.8);
  }

  for (const section of waiver.sections) {
    ensureSpace(doc, 60);
    const pageBounds = bounds(doc);
    doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(13).text(section.heading, pageBounds.left, doc.y, {
      width: pageBounds.width,
    });
    doc.moveDown(0.3);

    for (const paragraph of section.paragraphs) {
      drawParagraph(doc, paragraph);
    }
  }
}

function drawSignaturePanel(doc, title, person, signatureBuffer, metaLines) {
  ensureSpace(doc, 128);
  const pageBounds = bounds(doc);
  const x = pageBounds.left;
  const y = doc.y;
  const width = pageBounds.width;
  const height = 114;
  const padding = 14;

  doc.save();
  doc.roundedRect(x, y, width, height, 10).fillAndStroke(COLORS.panel, COLORS.border);
  doc.restore();

  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(11).text(title, x + padding, y + padding);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(person.fullName, x + padding, y + padding + 18);

  if (signatureBuffer) {
    try {
      doc.image(signatureBuffer, x + padding, y + 42, {
        fit: [214, 34],
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
    .moveTo(x + padding, y + 80)
    .lineTo(x + padding + 220, y + 80)
    .stroke();

  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text('Electronic signature', x + padding, y + 84);

  let metaY = y + 18;
  metaLines.forEach((line) => {
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(10).text(line, x + 264, metaY, {
      width: width - 278,
      lineGap: 2,
    });
    metaY += 16;
  });

  doc.y = y + height + 14;
}

function drawSignatureSummary(doc, snapshot, signatures, signedAt) {
  ensureSpace(doc, 60);
  const pageBounds = bounds(doc);
  doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(13).text('Signature summary', pageBounds.left, doc.y, {
    width: pageBounds.width,
  });
  doc.moveDown(0.4);

  const participantMeta = [
    `Participant: ${snapshot.participant.fullName}`,
    `Email: ${snapshot.participant.email}`,
    `Date of birth: ${formatDateLong(snapshot.participant.dob)}`,
    `Signed at: ${formatDateTime(signedAt)}`,
  ];

  drawSignaturePanel(
    doc,
    'Participant signature',
    snapshot.participant,
    dataUrlToBuffer(signatures.participant),
    participantMeta,
  );

  if (snapshot.isMinor && snapshot.guardian) {
    const guardianMeta = [
      `Guardian: ${snapshot.guardian.fullName}`,
      `Relationship: ${snapshot.guardian.relationship}`,
      `Email: ${snapshot.guardian.email}`,
      `Signed at: ${formatDateTime(signedAt)}`,
    ];

    drawSignaturePanel(
      doc,
      'Parent / legal guardian signature',
      snapshot.guardian,
      dataUrlToBuffer(signatures.guardian),
      guardianMeta,
    );
  }
}

function truncate(text, maxLength = 120) {
  const value = String(text ?? '').trim();
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function drawCoverPage(doc, { submissionId, signedAt, digest, snapshot }) {
  drawPageHeading(doc, EVENT.appName, EVENT.eventName);

  const eventRows = [
    { label: 'Organization', value: EVENT.organizationName },
    { label: 'Event', value: EVENT.eventName },
    { label: 'Dates', value: EVENT.dateLabel },
    { label: 'Location', value: EVENT.location },
    { label: 'Campus', value: EVENT.campus },
    { label: 'Packet version', value: EVENT.packetVersion },
  ];
  drawInfoCard(doc, 'Event snapshot', eventRows);

  const participantRows = [
    { label: 'Participant', value: snapshot.participant.fullName },
    { label: 'Email', value: snapshot.participant.email },
    { label: 'Date of birth', value: formatDateLong(snapshot.participant.dob) },
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
          ? `${snapshot.guardian.fullName} — ${snapshot.guardian.relationship}`
          : 'Not required',
    },
  ];
  drawInfoCard(doc, 'Signer snapshot', participantRows);

  const includedFormsRows = snapshot.waivers.map((waiver, index) => ({
    label: `Form ${index + 1}`,
    value: `${waiver.title} — ${waiver.subtitle}`,
  }));
  drawInfoCard(doc, 'Included documents', includedFormsRows);

  const auditRows = [
    { label: 'Reference', value: submissionId },
    { label: 'Signed at', value: formatDateTime(signedAt) },
    { label: 'Digest', value: digest },
    { label: 'IP address', value: snapshot.audit.ipAddress || 'Not captured' },
    { label: 'Host', value: snapshot.audit.host || 'Not captured' },
    { label: 'User agent', value: truncate(snapshot.audit.userAgent || 'Not captured', 86) },
  ];
  drawInfoCard(doc, 'Audit trail', auditRows);

  const pageBounds = bounds(doc);
  ensureSpace(doc, 80);
  doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(10).text(
    'This packet was electronically assembled after all required checkboxes and signature fields were completed. Retain this PDF together with the JSON record stored by the application.',
    pageBounds.left,
    doc.y,
    {
      width: pageBounds.width,
      lineGap: 3,
    },
  );
}

function drawWaiverPage(doc, waiver, { snapshot, signatures, signedAt }) {
  drawPageHeading(doc, waiver.title, waiver.subtitle);

  if (waiver.summary) {
    const pageBounds = bounds(doc);
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10.5).text(waiver.summary, pageBounds.left, doc.y, {
      width: pageBounds.width,
      lineGap: 2,
    });
    doc.moveDown(0.8);
  }

  drawEventBox(doc, waiver);
  drawWaiverSections(doc, waiver);
  drawSignatureSummary(doc, snapshot, signatures, signedAt);

  if (waiver.sourceFooter) {
    const pageBounds = bounds(doc);
    ensureSpace(doc, 24);
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9).text(waiver.sourceFooter, pageBounds.left, doc.y, {
      width: pageBounds.width,
    });
  }
}

function drawFooters(doc, { submissionId, digest }) {
  const pageRange = doc.bufferedPageRange();

  for (let pageIndex = 0; pageIndex < pageRange.count; pageIndex += 1) {
    doc.switchToPage(pageIndex);
    const pageBounds = bounds(doc);
    const footerY = doc.page.height - doc.page.margins.bottom + 14;
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(
      `Reference: ${submissionId}`,
      pageBounds.left,
      footerY,
      { width: 180 },
    );
    doc.text(`Digest: ${digest.slice(0, 16)}…`, pageBounds.left + 186, footerY, { width: 170 });
    doc.text(`Page ${pageIndex + 1} of ${pageRange.count}`, pageBounds.right - 90, footerY, {
      width: 90,
      align: 'right',
    });
  }
}

export async function buildPacketPdf({ submissionId, signedAt, digest, snapshot, signatures }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: 54,
        bottom: 54,
        left: 54,
        right: 54,
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
      drawCoverPage(doc, { submissionId, signedAt, digest, snapshot });

      for (const waiver of snapshot.waivers) {
        doc.addPage();
        drawWaiverPage(doc, waiver, { snapshot, signatures, signedAt });
      }

      drawFooters(doc, { submissionId, digest });
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
