import crypto from 'node:crypto';

export function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseIsoDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function calculateAgeFromDob(dob, referenceDate = new Date()) {
  const birthDate = parseIsoDateOnly(dob);

  if (!birthDate) {
    return null;
  }

  const reference = new Date(referenceDate);
  let age = reference.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasHadBirthdayThisYear =
    reference.getUTCMonth() > birthDate.getUTCMonth() ||
    (reference.getUTCMonth() === birthDate.getUTCMonth() &&
      reference.getUTCDate() >= birthDate.getUTCDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function isMinorFromDob(dob, referenceDate = new Date()) {
  const age = calculateAgeFromDob(dob, referenceDate);
  return typeof age === 'number' ? age < 18 : false;
}

export function formatDateLong(value) {
  const date =
    value instanceof Date
      ? value
      : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? parseIsoDateOnly(value)
        : new Date(value);

  if (!date || Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function createSubmissionId() {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomUUID().split('-')[0];
  return `GGH-${dateStamp}-${suffix}`;
}

export function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function stableStringify(value) {
  return JSON.stringify(sortRecursively(value));
}

function sortRecursively(value) {
  if (Array.isArray(value)) {
    return value.map(sortRecursively);
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortRecursively(value[key]);
        return accumulator;
      }, {});
  }

  return value;
}

export function dataUrlToBuffer(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
    return null;
  }

  const base64 = dataUrl.slice('data:image/png;base64,'.length);
  return Buffer.from(base64, 'base64');
}

export function sanitizeStoragePath(pathname) {
  const normalized = String(pathname ?? '').replace(/\\/g, '/').replace(/^\/+/, '');

  if (
    !normalized ||
    normalized.includes('..') ||
    /[^a-zA-Z0-9/_\-.]/.test(normalized)
  ) {
    throw new Error('Invalid storage pathname.');
  }

  return normalized;
}

export function truncateMiddle(value, visible = 10) {
  const text = String(value ?? '');
  if (text.length <= visible * 2) {
    return text;
  }

  return `${text.slice(0, visible)}…${text.slice(-visible)}`;
}
