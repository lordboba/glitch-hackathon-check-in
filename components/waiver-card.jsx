export default function WaiverCard({ waiver }) {
  return (
    <section className="waiver-card">
      <div className="waiver-card-header">
        <div>
          <p className="eyebrow">Included form</p>
          <h3>{waiver.title}</h3>
          <p className="waiver-subtitle">{waiver.subtitle}</p>
        </div>
      </div>

      {waiver.summary ? <p className="waiver-summary">{waiver.summary}</p> : null}

      {waiver.eventBox ? (
        <div className="waiver-event-box">
          <div>
            <span className="waiver-meta-label">Student organization / club</span>
            <strong>{waiver.eventBox.organization}</strong>
          </div>
          <div>
            <span className="waiver-meta-label">Activity description</span>
            <div className="waiver-activity-lines">
              {waiver.eventBox.activityLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {waiver.guardianNote ? <p className="waiver-note">{waiver.guardianNote}</p> : null}

      <div className="waiver-sections">
        {waiver.sections.map((section) => (
          <div className="waiver-section" key={`${waiver.id}-${section.heading}`}>
            <h4>{section.heading}</h4>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
