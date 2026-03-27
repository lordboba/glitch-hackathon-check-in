import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdminSessionCookieValue,
  isAdminConfigured,
  verifyAdminPassword,
  verifyAdminSessionValue,
} from '../lib/auth.js';

const ORIGINAL_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ORIGINAL_SESSION_SECRET = process.env.SESSION_SECRET;

function restoreEnv() {
  if (ORIGINAL_ADMIN_PASSWORD === undefined) {
    delete process.env.ADMIN_PASSWORD;
  } else {
    process.env.ADMIN_PASSWORD = ORIGINAL_ADMIN_PASSWORD;
  }

  if (ORIGINAL_SESSION_SECRET === undefined) {
    delete process.env.SESSION_SECRET;
  } else {
    process.env.SESSION_SECRET = ORIGINAL_SESSION_SECRET;
  }
}

test.afterEach(() => {
  restoreEnv();
});

test('admin auth requires server-side environment variables', () => {
  delete process.env.ADMIN_PASSWORD;
  delete process.env.SESSION_SECRET;

  assert.equal(isAdminConfigured(), false);
  assert.equal(verifyAdminPassword('anything'), false);
  assert.equal(verifyAdminSessionValue('123.sig'), false);
});

test('admin password is verified against server-side env state', () => {
  process.env.ADMIN_PASSWORD = 'correct horse battery staple';
  process.env.SESSION_SECRET = 'super-secret-session-key';

  assert.equal(isAdminConfigured(), true);
  assert.equal(verifyAdminPassword('correct horse battery staple'), true);
  assert.equal(verifyAdminPassword('wrong password'), false);
});

test('admin session cookies are signed and expire server-side', () => {
  process.env.ADMIN_PASSWORD = 'correct horse battery staple';
  process.env.SESSION_SECRET = 'super-secret-session-key';

  const cookieValue = createAdminSessionCookieValue();
  const [expiresAt] = cookieValue.split('.');
  const expiredCookieValue = `1.${cookieValue.split('.')[1]}`;
  const tamperedCookieValue = `${expiresAt}.tampered`;

  assert.equal(verifyAdminSessionValue(cookieValue), true);
  assert.equal(verifyAdminSessionValue(expiredCookieValue), false);
  assert.equal(verifyAdminSessionValue(tamperedCookieValue), false);
});
