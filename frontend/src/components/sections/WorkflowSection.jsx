export default function WorkflowSection({ steps }) {
  return (
    <section className="section workflow-section">
      <div className="section-heading">
        <h2>From posting text to actionable signal map</h2>
        <p>Fast enough for day-to-day triage, structured enough for policy and governance reviews.</p>
      </div>
      <div className="workflow-grid">
        {steps.map((step) => (
          <article className="workflow-step" key={step.id}>
            <p className="workflow-index">{step.id}</p>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
