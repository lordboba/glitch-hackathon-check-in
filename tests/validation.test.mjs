import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAgeFromDob, isMinorFromDob } from '../lib/utils.js';
import { validateSubmissionPayload } from '../lib/validation.js';

const adultPayload = {
  participantName: 'Ada Lovelace',
  participantEmail: 'ada@example.com',
  participantDob: '2000-12-10',
  acceptLiability: true,
  acceptMedia: true,
  acceptElectronic: true,
  participantSignature:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5+yXcAAAAASUVORK5CYII=',
};

const minorPayload = {
  ...adultPayload,
  participantDob: '2010-06-12',
  guardianName: 'Grace Hopper',
  guardianEmail: 'grace@example.com',
  guardianRelationship: 'Parent',
  guardianSignature:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5+yXcAAAAASUVORK5CYII=',
};

test('calculateAgeFromDob handles birthday boundaries', () => {
  const oneDayBeforeBirthday = new Date(Date.UTC(2028, 5, 11));
  const birthday = new Date(Date.UTC(2028, 5, 12));

  assert.equal(calculateAgeFromDob('2010-06-12', oneDayBeforeBirthday), 17);
  assert.equal(calculateAgeFromDob('2010-06-12', birthday), 18);
  assert.equal(isMinorFromDob('2010-06-12', birthday), false);
});

test('adult submission is valid without guardian information', () => {
  const result = validateSubmissionPayload(adultPayload, {
    referenceDate: new Date(Date.UTC(2028, 5, 11)),
  });

  assert.equal(result.valid, true);
  assert.equal(result.data.isMinor, false);
  assert.equal(result.data.guardian, null);
});

test('minor submission requires guardian fields', () => {
  const result = validateSubmissionPayload(
    {
      ...adultPayload,
      participantDob: '2012-03-01',
    },
    {
      referenceDate: new Date(Date.UTC(2028, 3, 1)),
    },
  );

  assert.equal(result.valid, false);
  assert.ok(result.errors.guardianName);
  assert.ok(result.errors.guardianEmail);
  assert.ok(result.errors.guardianRelationship);
  assert.ok(result.errors.guardianSignature);
});

test('minor submission becomes valid with guardian details', () => {
  const result = validateSubmissionPayload(minorPayload, {
    referenceDate: new Date(Date.UTC(2028, 3, 1)),
  });

  assert.equal(result.valid, true);
  assert.equal(result.data.isMinor, true);
  assert.equal(result.data.guardian.fullName, 'Grace Hopper');
});
