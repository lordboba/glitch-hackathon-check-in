import Link from 'next/link';
import { EVENT } from '@/lib/event-config';
import { getResolvedWaivers } from '@/lib/waivers';

export default function HomePage() {
  const waivers = getResolvedWaivers({ isMinor: false });

  return (
    <main className="page-shell stack-xl">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Glitch Gemini Hackathon</p>
          <h1>{EVENT.appName}</h1>
          <p className="hero-text">
            A DocuSign-like signing flow for your event waivers. Participants can review the
            liability waiver and media release online, sign electronically, and create a
            stored PDF packet for administrators.
          </p>
          <div className="button-row">
            <Link className="button button-primary" href="/sign">
              Start signing
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
          <p className="hero-note">
            Parent and guardian fields stay optional until a participant date of birth shows
            the signer is under 18.
          </p>
        </div>
      </section>

      <section className="feature-grid">
        <article className="card">
          <p className="eyebrow">Participant workflow</p>
          <h2>Simple signer experience</h2>
          <p className="section-copy">
            One page for participant details, guardian logic for minors, document review,
            acknowledgements, and signature capture.
          </p>
        </article>

        <article className="card">
          <p className="eyebrow">Storage</p>
          <h2>Signed packets persist as files</h2>
          <p className="section-copy">
            Each completed submission creates a packet PDF and a JSON record so you can keep
            a file-based archive of signed waivers.
          </p>
        </article>

        <article className="card">
          <p className="eyebrow">Administration</p>
          <h2>Password-protected admin portal</h2>
          <p className="section-copy">
            Review submissions, see who signed, and download the packet PDF or JSON record
            from the admin dashboard.
          </p>
        </article>
      </section>
    </main>
  );
}
