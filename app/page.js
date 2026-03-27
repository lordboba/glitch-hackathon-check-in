import Link from 'next/link';
import { EVENT } from '@/lib/event-config';
import { getResolvedWaivers } from '@/lib/waivers';

export default function HomePage() {
  const waivers = getResolvedWaivers({ isMinor: false });

  return (
    <main className="page-shell stack-xl">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">{EVENT.eventName}</p>
          <h1>Electronic Waiver Packet</h1>
          <p className="hero-text narrow-text">
            Review and sign the liability waiver and media release online.
            A signed PDF packet is generated and stored for event administrators.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/sign">
              Sign waiver packet
            </Link>
            <Link className="button button-secondary" href="/admin">
              Admin portal
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <p className="eyebrow">Included forms</p>
          <div className="stack-sm">
            {waivers.map((waiver) => (
              <div className="mini-card" key={waiver.id}>
                <strong>{waiver.title}</strong>
                <span>{waiver.subtitle}</span>
              </div>
            ))}
          </div>
          <p className="hero-note" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Guardian fields appear automatically when the participant is under 18.
          </p>
        </div>
      </section>
    </main>
  );
}
