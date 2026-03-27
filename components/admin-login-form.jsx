export default function AdminLoginForm({ error }) {
  return (
    <section className="card narrow-card">
      <p className="eyebrow">Admin access</p>
      <h2>Sign in to view submissions</h2>
      <p className="section-copy">
        Use the shared admin password to list and download signed packet PDFs and JSON
        records.
      </p>

      {error ? <div className="banner banner-error">{error}</div> : null}

      <form action="/api/admin/login" method="post" className="stack-sm">
        <div className="field-group">
          <label htmlFor="password">Admin password</label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <button className="button button-primary" type="submit">
          Open admin portal
        </button>
      </form>
    </section>
  );
}
