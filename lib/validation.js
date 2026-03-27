import {
  calculateAgeFromDob,
  isMinorFromDob,
  normalizeText,
  parseIsoDateOnly,
} from './utils.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isTruthy(value) {
  return value === true || value === 'true' || value === 'on' || value === 1;
}

function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value ?? '').trim());
}

function isValidSignature(value) {
  return (
    typeof value === 'string' &&
    value.startsWith('data:image/png;base64,') &&
    value.length > 60
  );
}

export function validateSubmissionPayload(raw, options = {}) {
  const referenceDate = options.referenceDate || new Date();
  const errors = {};

  const participant = {
    fullName: normalizeText(raw?.participantName ?? raw?.participant?.fullName),
    email: normalizeText(raw?.participantEmail ?? raw?.participant?.email).toLowerCase(),
    dob: normalizeText(raw?.participantDob ?? raw?.participant?.dob),
  };

  const guardian = {
    fullName: normalizeText(raw?.guardianName ?? raw?.guardian?.fullName),
    email: normalizeText(raw?.guardianEmail ?? raw?.guardian?.email).toLowerCase(),
    relationship: normalizeText(
      raw?.guardianRelationship ?? raw?.guardian?.relationship,
    ),
  };

  const consents = {
    liability: isTruthy(raw?.acceptLiability ?? raw?.consents?.liability),
    media: isTruthy(raw?.acceptMedia ?? raw?.consents?.media),
    electronic: isTruthy(raw?.acceptElectronic ?? raw?.consents?.electronic),
  };

  const signatures = {
    participant: raw?.participantSignature ?? raw?.signatures?.participant,
    guardian: raw?.guardianSignature ?? raw?.signatures?.guardian,
  };

  if (participant.fullName.length < 2) {
    errors.participantName = 'Enter the participant’s full legal name.';
  }

  if (!isValidEmail(participant.email)) {
    errors.participantEmail = 'Enter a valid participant email address.';
  }

  const parsedDob = parseIsoDateOnly(participant.dob);
  if (!parsedDob) {
    errors.participantDob = 'Enter a valid date of birth.';
  } else {
    const age = calculateAgeFromDob(participant.dob, referenceDate);
    if (typeof age !== 'number' || age < 0 || age > 120) {
      errors.participantDob = 'Enter a realistic date of birth.';
    }
  }

  const isMinor = participant.dob ? isMinorFromDob(participant.dob, referenceDate) : false;

  if (!consents.liability) {
    errors.acceptLiability = 'You must agree to the liability waiver.';
  }

  if (!consents.media) {
    errors.acceptMedia = 'You must agree to the media waiver.';
  }

  if (!consents.electronic) {
    errors.acceptElectronic = 'You must agree to use an electronic signature.';
  }

  if (!isValidSignature(signatures.participant)) {
    errors.participantSignature = 'Participant signature is required.';
  }

  if (isMinor) {
    if (guardian.fullName.length < 2) {
      errors.guardianName = 'Parent or guardian full name is required for minors.';
    }

    if (!guardian.relationship) {
      errors.guardianRelationship =
        'Parent or guardian relationship is required for minors.';
    }

    if (!isValidEmail(guardian.email)) {
      errors.guardianEmail =
        'A valid parent or guardian email address is required for minors.';
    }

    if (!isValidSignature(signatures.guardian)) {
      errors.guardianSignature =
        'Parent or guardian signature is required for minors.';
    }
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid
      ? {
          participant,
          participantAgeAtSigning: calculateAgeFromDob(participant.dob, referenceDate),
          isMinor,
          guardian: isMinor ? guardian : null,
          consents,
          signatures: {
            participant: signatures.participant,
            guardian: isMinor ? signatures.guardian : null,
          },
        }
      : null,
  };
}
