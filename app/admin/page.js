import Link from 'next/link';
import { cookies } from 'next/headers';
import AdminLoginForm from '@/components/admin-login-form';
import {
  getAdminConfigIssues,
  getAdminCookieName,
  isAdminConfigured,
  verifyAdminSessionValue,
} from '@/lib/auth';
import { EVENT } from '@/lib/event-config';
import { getStorageMode, getStorageWarning } from '@/lib/storage';
import {
  listSubmissionRecords,
  summarizeSubmissionRecords,
} from '@/lib/submission-store';
import { formatDateTime, truncateMiddle } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'bad-password':
      return 'That password was not correct.';
    case 'not-configured':
      return 'Admin access is not configured yet.';
    default:
      return '';
  }
}

export default async function AdminPage({ searchParams }) {
  const query = await searchParams;
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getAdminCookieName())?.value;
  const isAuthenticated = verifyAdminSessionValue(sessionValue);
  const storageWarning = getStorageWarning();
  const storageMode = getStorageMode();

  if (!isAdminConfigured()) {
    return (
      <main className="page-shell stack-xl">
        <section className="page-header">
          <div>
            <p className="eyebrow">Admin portal</p>
            <h1>{EVENT.eventName}</h1>
          </div>
          <Link className="text-link" href="/">
            Back to home
          </Link>
        </section>

        <section className="card narrow-card">
          <p className="eyebrow">Configuration required</p>
          <h2>Admin access is not ready yet</h2>
          <p className="section-copy">
            Add the required environment variables before using the admin portal.
          </p>
          <div className="stack-sm">
            {getAdminConfigIssues().map((issue) => (
              <div className="banner banner-error" key={issue}>
                {issue}
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="page-shell stack-xl">
        <section className="page-header">
          <div>
            <p className="eyebrow">Admin portal</p>
            <h1>{EVENT.eventName}</h1>
          </div>
          <Link className="text-link" href="/">
            Back to home
          </Link>
        </section>

        {storageWarning ? <div className="banner banner-warning">{storageWarning}</div> : null}

        <AdminLoginForm error={getErrorMessage(query?.error)} />
      </main>
    );
  }

  let records = [];
  let loadError = '';

  try {
    records = await listSubmissionRecords();
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Could not load submissions.';
  }

  const stats = summarizeSubmissionRecords(records);

  return (
    <main className="page-shell stack-xl">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1>Signed waiver submissions</h1>
          <p className="hero-text narrow-text">
            Review and download signed packet files for {EVENT.eventName}.
          </p>
        </div>

        <form action="/api/admin/logout" method="post">
          <button className="button button-secondary" type="submit">
            Log out
          </button>
        </form>
      </section>

      {storageWarning ? <div className="banner banner-warning">{storageWarning}</div> : null}
      {loadError ? <div className="banner banner-error">{loadError}</div> : null}

      <section className="stat-grid">
        <article className="stat-card">
          <span>Total submissions</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card">
          <span>Adult participants</span>
          <strong>{stats.adults}</strong>
        </article>
        <article className="stat-card">
          <span>Minor participants</span>
          <strong>{stats.minors}</strong>
        </article>
        <article className="stat-card">
          <span>Storage mode</span>
          <strong>{storageMode === 'blob' ? 'Private Blob' : 'Local dev'}</strong>
          <small>{stats.latestSignedAt ? `Latest: ${formatDateTime(stats.latestSignedAt)}` : 'No submissions yet'}</small>
        </article>
      </section>

      <section className="card">
        <div className="section-header-row">
          <div>
            <p className="eyebrow">Archive</p>
            <h2>Submission records</h2>
          </div>
        </div>

        {records.length === 0 ? (
          <p className="section-copy">No signed submissions have been stored yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="submission-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Status</th>
                  <th>Signed at</th>
                  <th>Reference</th>
                  <th>Files</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.submissionId}>
                    <td>
                      <div className="table-primary">{record.participant.fullName}</div>
                      <div className="table-secondary">{record.participant.email}</div>
                      {record.isMinor && record.guardian ? (
                        <div className="table-tertiary">
                          Guardian: {record.guardian.fullName} ({record.guardian.relationship})
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`status-pill ${record.isMinor ? 'status-pill-warning' : ''}`}>
                        {record.isMinor ? 'Minor' : 'Adult'}
                      </span>
                    </td>
                    <td>{formatDateTime(record.signedAt)}</td>
                    <td>
                      <span title={record.submissionId}>{truncateMiddle(record.submissionId, 8)}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <a
                          className="text-link"
                          href={`/api/admin/file?pathname=${encodeURIComponent(record.assets.packetPdf)}`}
                          target="_blank"
                        >
                          PDF
                        </a>
                        <a
                          className="text-link"
                          href={`/api/admin/file?pathname=${encodeURIComponent(record.assets.recordJson)}`}
                          target="_blank"
                        >
                          JSON
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
