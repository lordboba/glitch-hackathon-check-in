import Link from 'next/link';
import { EVENT } from '@/lib/event-config';

export default async function SuccessPage({ params }) {
  const { submissionId } = await params;

  return (
    <main className="page-shell stack-xl">
      <section className="card success-card narrow-card">
        <p className="eyebrow">Submission complete</p>
        <h1>Signed waiver packet created</h1>
        <p className="hero-text narrow-text">
          Thank you. Your {EVENT.eventName} waiver packet has been saved.
        </p>

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
