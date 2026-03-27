import Link from 'next/link';
import WaiverForm from '@/components/waiver-form';
import { EVENT } from '@/lib/event-config';

export default function SignPage() {
  return (
    <main className="page-shell stack-xl">
      <section className="page-header">
        <div>
          <p className="eyebrow">Electronic signing</p>
          <h1>{EVENT.eventName}</h1>
          <p className="hero-text narrow-text">
            Complete the waiver packet below. The liability waiver and media release are both
            included, and guardian fields only become required when the participant is under
            18.
          </p>
        </div>
        <Link className="text-link" href="/">
          Back to home
        </Link>
      </section>

      <WaiverForm />
    </main>
  );
}
