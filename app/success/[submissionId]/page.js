import Link from 'next/link';
import { EVENT } from '@/lib/event-config';

function getReceiptMessage(status) {
  if (status === 'sent') {
    return 'A confirmation email with the signed PDF has been sent to the signer email on file.';
  }

  if (status === 'failed') {
    return 'The waiver was saved, but the confirmation email could not be delivered. Contact the organizers if you need a copy.';
  }

  if (status === 'skipped') {
    return 'The waiver was saved. This deployment is not configured to email receipt copies automatically.';
  }

  return 'The waiver was saved successfully.';
}

export default async function SuccessPage({ params, searchParams }) {
  const { submissionId } = await params;
  const resolvedSearchParams = await searchParams;
  const receiptStatus = resolvedSearchParams?.receipt;

  return (
    <main className="page-shell stack-xl">
      <section className="card success-card narrow-card">
        <p className="eyebrow">Submission complete</p>
        <h1>Signed waiver packet created</h1>
        <p className="hero-text narrow-text">
          Thank you. Your {EVENT.eventName} waiver packet has been saved.
        </p>
        <p className="section-copy narrow-text">{getReceiptMessage(receiptStatus)}</p>

        <div className="reference-box">
          <span className="reference-label">Reference number</span>
          <strong>{submissionId}</strong>
        </div>

        <div className="button-row">
          <Link className="button button-primary" href="/sign">
            Create another packet
          </Link>
          <Link className="button button-secondary" href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
