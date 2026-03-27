import test from 'node:test';
import assert from 'node:assert/strict';
import { getReceiptRecipients } from '../lib/receipt-email.js';

test('getReceiptRecipients deduplicates and normalizes signer emails', () => {
  const recipients = getReceiptRecipients({
    participant: {
      email: 'Ada@Example.com ',
    },
    guardian: {
      email: ' ada@example.com',
    },
  });

  assert.deepEqual(recipients, ['ada@example.com']);
});

test('getReceiptRecipients includes guardian email for minor packets', () => {
  const recipients = getReceiptRecipients({
    participant: {
      email: 'ada@example.com',
    },
    guardian: {
      email: 'grace@example.com',
    },
  });

  assert.deepEqual(recipients, ['ada@example.com', 'grace@example.com']);
});
