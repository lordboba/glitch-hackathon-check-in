'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import SignaturePad from '@/components/signature-pad';
import WaiverCard from '@/components/waiver-card';
import { EVENT } from '@/lib/event-config';
import { isMinorFromDob } from '@/lib/utils';
import { validateSubmissionPayload } from '@/lib/validation';
import { getResolvedWaivers, getWaiverChecklist } from '@/lib/waivers';

const INITIAL_FORM = {
  participantName: '',
  participantEmail: '',
  participantDob: '',
  guardianName: '',
  guardianEmail: '',
  guardianRelationship: '',
  acceptLiability: false,
  acceptMedia: false,
  acceptElectronic: false,
  participantSignature: '',
  guardianSignature: '',
};

function ErrorText({ error }) {
  return error ? <p className="field-error">{error}</p> : null;
}

export default function WaiverForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isMinor = useMemo(
    () => isMinorFromDob(form.participantDob),
    [form.participantDob],
  );
  const waivers = useMemo(() => getResolvedWaivers({ isMinor }), [isMinor]);
  const checklist = useMemo(() => getWaiverChecklist(), []);

  useEffect(() => {
    if (!isMinor) {
      setForm((current) => ({
        ...current,
        guardianName: '',
        guardianEmail: '',
        guardianRelationship: '',
        guardianSignature: '',
      }));

      setErrors((current) => {
        const next = { ...current };
        delete next.guardianName;
        delete next.guardianEmail;
        delete next.guardianRelationship;
        delete next.guardianSignature;
        return next;
      });
    }
  }, [isMinor]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitError('');
  };

  const scrollToField = (fieldName) => {
    if (typeof window === 'undefined') {
      return;
    }

    const element = document.getElementById(fieldName);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof element.focus === 'function') {
        element.focus({ preventScroll: true });
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');

    const validation = validateSubmissionPayload(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      scrollToField(Object.keys(validation.errors)[0]);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        if (payload?.errors) {
          setErrors(payload.errors);
          scrollToField(Object.keys(payload.errors)[0]);
        }

        throw new Error(
          payload?.message || 'We could not create the signed waiver packet.',
        );
      }

      window.location.assign(`/success/${payload.submissionId}`);
      return;
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'We could not create the signed waiver packet.',
      );
      setSubmitting(false);
    }
  };

  return (
    <form className="content-grid" onSubmit={handleSubmit}>
      <div className="stack-lg">
        <section className="card">
          <div className="section-header-row">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Participant details</h2>
            </div>
            <span className={`status-pill ${isMinor ? 'status-pill-warning' : ''}`}>
              {form.participantDob
                ? isMinor
                  ? 'Minor — guardian required'
                  : 'Adult — guardian not required'
                : 'Enter date of birth to determine minor status'}
            </span>
          </div>

          <div className="form-two-column">
            <div className="field-group">
              <label htmlFor="participantName">Participant full legal name</label>
              <input
                className={`input ${errors.participantName ? 'input-error' : ''}`}
                id="participantName"
                type="text"
                autoComplete="name"
                value={form.participantName}
                onChange={(event) => updateField('participantName', event.target.value)}
                required
              />
              <ErrorText error={errors.participantName} />
            </div>

            <div className="field-group">
              <label htmlFor="participantEmail">Participant email</label>
              <input
                className={`input ${errors.participantEmail ? 'input-error' : ''}`}
                id="participantEmail"
                type="email"
                autoComplete="email"
                value={form.participantEmail}
                onChange={(event) => updateField('participantEmail', event.target.value)}
                required
              />
              <ErrorText error={errors.participantEmail} />
            </div>

            <div className="field-group compact-field">
              <label htmlFor="participantDob">Date of birth</label>
              <input
                className={`input ${errors.participantDob ? 'input-error' : ''}`}
                id="participantDob"
                type="date"
                value={form.participantDob}
                onChange={(event) => updateField('participantDob', event.target.value)}
                required
              />
              <ErrorText error={errors.participantDob} />
            </div>
          </div>
        </section>

        {isMinor ? (
          <section className="card card-attention">
            <div className="section-header-row">
              <div>
                <p className="eyebrow">Step 1A</p>
                <h2>Parent or guardian details</h2>
              </div>
              <span className="status-pill status-pill-warning">Required for minors</span>
            </div>

            <p className="section-copy">
              Because the participant is under 18, the parent or legal guardian must review
              the packet and sign as well.
            </p>

            <div className="form-two-column">
              <div className="field-group">
                <label htmlFor="guardianName">Parent or guardian full name</label>
                <input
                  className={`input ${errors.guardianName ? 'input-error' : ''}`}
                  id="guardianName"
                  type="text"
                  autoComplete="name"
                  value={form.guardianName}
                  onChange={(event) => updateField('guardianName', event.target.value)}
                  required={isMinor}
                />
                <ErrorText error={errors.guardianName} />
              </div>

              <div className="field-group">
                <label htmlFor="guardianEmail">Parent or guardian email</label>
                <input
                  className={`input ${errors.guardianEmail ? 'input-error' : ''}`}
                  id="guardianEmail"
                  type="email"
                  autoComplete="email"
                  value={form.guardianEmail}
                  onChange={(event) => updateField('guardianEmail', event.target.value)}
                  required={isMinor}
                />
                <ErrorText error={errors.guardianEmail} />
              </div>

              <div className="field-group compact-field">
                <label htmlFor="guardianRelationship">Relationship to participant</label>
                <input
                  className={`input ${errors.guardianRelationship ? 'input-error' : ''}`}
                  id="guardianRelationship"
                  type="text"
                  value={form.guardianRelationship}
                  onChange={(event) =>
                    updateField('guardianRelationship', event.target.value)
                  }
                  placeholder="Parent, legal guardian, etc."
                  required={isMinor}
                />
                <ErrorText error={errors.guardianRelationship} />
              </div>
            </div>
          </section>
        ) : null}

        <section className="card">
          <div className="section-header-row">
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>Review the waiver packet</h2>
            </div>
          </div>

          <p className="section-copy">
            Read both documents below. On submit, the application generates a signed PDF
            packet that combines these waivers for {EVENT.eventName}.
          </p>

          <div className="stack-md">
            {waivers.map((waiver) => (
              <WaiverCard key={waiver.id} waiver={waiver} />
            ))}
          </div>
        </section>

        <section className="card">
          <div className="section-header-row">
            <div>
              <p className="eyebrow">Step 3</p>
              <h2>Acknowledge and sign</h2>
            </div>
          </div>

          <div className="stack-md">
            <div className="checkbox-stack">
              {checklist.map((item) => (
                <label className="checkbox-row" key={item.field}>
                  <input
                    id={item.field}
                    type="checkbox"
                    checked={form[item.field]}
                    onChange={(event) => updateField(item.field, event.target.checked)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
              <ErrorText
                error={
                  errors.acceptLiability || errors.acceptMedia || errors.acceptElectronic
                }
              />
            </div>

            <div className="signature-grid">
              <SignaturePad
                id="participantSignature"
                label="Participant signature"
                value={form.participantSignature}
                onChange={(value) => updateField('participantSignature', value)}
                error={errors.participantSignature}
                helperText="The participant must sign here."
              />

              {isMinor ? (
                <SignaturePad
                  id="guardianSignature"
                  label="Parent or guardian signature"
                  value={form.guardianSignature}
                  onChange={(value) => updateField('guardianSignature', value)}
                  error={errors.guardianSignature}
                  helperText="Required because the participant is under 18."
                />
              ) : null}
            </div>
          </div>
        </section>

        {submitError ? <div className="banner banner-error">{submitError}</div> : null}

        <div className="submit-row">
          <div>
            <p className="submit-note">
              Submitting will create a signed PDF packet and a matching JSON record for the
              event administrators.
            </p>
          </div>
          <button className="button button-primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating signed packet…' : 'Submit signed waiver packet'}
          </button>
        </div>
      </div>

      <aside className="stack-md">
        <section className="card sticky-card">
          <p className="eyebrow">Event summary</p>
          <h3>{EVENT.eventName}</h3>
          <dl className="summary-list">
            <div>
              <dt>Organization</dt>
              <dd>{EVENT.organizationName}</dd>
            </div>
            <div>
              <dt>Dates</dt>
              <dd>{EVENT.dateLabel}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{EVENT.location}</dd>
            </div>
            <div>
              <dt>Campus</dt>
              <dd>{EVENT.campus}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <p className="eyebrow">What gets created</p>
          <h3>Stored files per submission</h3>
          <div className="stack-sm">
            <div className="info-chip">Signed packet PDF</div>
            <div className="info-chip">Submission JSON record</div>
            <div className="info-chip">Audit metadata snapshot</div>
          </div>
        </section>

        <section className="card">
          <p className="eyebrow">Source material</p>
          <h3>Original university waiver</h3>
          <p className="section-copy">
            The liability waiver in this packet was adapted from the uploaded UC student
            organization waiver.
          </p>
          <Link className="text-link" href="/source-uc-liability-waiver.pdf" target="_blank">
            Open the original PDF
          </Link>
        </section>
      </aside>
    </form>
  );
}
