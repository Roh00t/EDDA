export default function LoadingCard() {
  return (
    <section className="report" aria-live="polite">
      <div className="card loading-card" aria-busy="true">
        <div className="spinner" aria-hidden="true" />
        <p className="loading-text">Analyzing posting...</p>
        <p className="loading-subtext">Cross-referencing posting text, entity resolution, and source retrieval.</p>
      </div>
    </section>
  );
}
