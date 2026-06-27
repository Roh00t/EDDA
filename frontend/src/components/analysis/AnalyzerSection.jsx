import { Button, EyebrowPill } from "performative-ui";

import LoadingCard from "./LoadingCard.jsx";
import ReportView from "./ReportView.jsx";
import StatusText from "./StatusText.jsx";

export default function AnalyzerSection({
  jdText,
  onJdTextChange,
  onAnalyze,
  onPreview,
  status,
  reportState,
  isAnalyzing,
}) {
  function handleKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onAnalyze();
    }
  }

  return (
    <section id="analysis-workbench" className="section analyzer-shell">
      <div className="section-heading">
        <EyebrowPill>Interactive workbench</EyebrowPill>
        <h2>Run a full employer due-diligence report</h2>
        <p>Paste the raw posting body for best results. EDDA preserves evidence and caveats in every report.</p>
      </div>

      <section className="input-section card">
        <label htmlFor="jd-text">Paste job description</label>
        <p className="input-hint">Tip: remove cookie banners, footers, and duplicated page chrome before analysis.</p>
        <textarea
          id="jd-text"
          rows="11"
          placeholder="Paste the job posting here..."
          value={jdText}
          onChange={(event) => onJdTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="actions">
          <Button variant="shimmer" onClick={onAnalyze} disabled={isAnalyzing} loading={isAnalyzing}>
            Analyze live posting
          </Button>
          <Button variant="ghost" onClick={onPreview}>
            Preview layout (sample data)
          </Button>
          <StatusText status={status} />
        </div>
      </section>

      {reportState.loading ? <LoadingCard /> : null}
      {!reportState.loading && reportState.report ? <ReportView report={reportState.report} source={reportState.source} /> : null}
    </section>
  );
}
