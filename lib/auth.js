import crypto from 'node:crypto';

const ADMIN_COOKIE_NAME = 'gg-admin-session';
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || '';
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || '';
}

function hmacHex(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('hex');
}

function timingSafeHexEqual(left, right) {
  const leftBuffer = Buffer.from(String(left ?? ''), 'utf8');
  const rightBuffer = Buffer.from(String(right ?? ''), 'utf8');

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function getAdminCookieName() {
  return ADMIN_COOKIE_NAME;
}

export function isAdminConfigured() {
  return Boolean(getAdminPassword() && getSessionSecret());
}

export function getAdminConfigIssues() {
  const issues = [];

  if (!getAdminPassword()) {
    issues.push('ADMIN_PASSWORD is missing.');
  }

  if (!getSessionSecret()) {
    issues.push('SESSION_SECRET is missing.');
  }

  return issues;
}

export function verifyAdminPassword(candidate) {
  if (!isAdminConfigured()) {
    return false;
  }

  const expected = crypto
    .createHash('sha256')
    .update(getAdminPassword())
    .digest('hex');
  const received = crypto
    .createHash('sha256')
    .update(String(candidate ?? ''))
    .digest('hex');

  return timingSafeHexEqual(expected, received);
}

export function createAdminSessionCookieValue() {
  if (!isAdminConfigured()) {
    throw new Error('Admin session is not configured.');
  }

  const expiresAt = String(Date.now() + ONE_WEEK_SECONDS * 1000);
  const signature = hmacHex(expiresAt);
  return `${expiresAt}.${signature}`;
}

export function verifyAdminSessionValue(cookieValue) {
  if (!isAdminConfigured() || typeof cookieValue !== 'string') {
    return false;
  }

  const [expiresAt, signature] = cookieValue.split('.');

  if (!expiresAt || !signature) {
    return false;
  }

  if (Number.isNaN(Number(expiresAt)) || Number(expiresAt) < Date.now()) {
    return false;
  }

  return timingSafeHexEqual(hmacHex(expiresAt), signature);
}

export function getAdminCookieOptions(value) {
  return {
    name: ADMIN_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_WEEK_SECONDS,
  };
}
