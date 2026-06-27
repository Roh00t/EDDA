import Badge from "../shared/Badge.jsx";
import { formatCompStated, formatLabel, RISK_BAND_CLASS, SEVERITY_CLASS, validateReport } from "../../lib/report-utils.js";

function SourceBanner({ source }) {
  const isLive = source === "live";
  return (
    <p className={`source-banner ${isLive ? "source-live" : "source-preview"}`} role="status">
      {isLive ? "Live analysis" : "Preview layout (mock report)"}
    </p>
  );
}

function OverallHeader({ overall }) {
  const bandClass = RISK_BAND_CLASS[overall.risk_band] ?? "risk-elevated";
  return (
    <header className="overall-header card">
      <div className="overall-top">
        <p className="overall-label">Signal summary</p>
        <span className={`risk-band ${bandClass}`}>{formatLabel(overall.risk_band)}</span>
      </div>
      <p className="caveat">{overall.caveat}</p>
    </header>
  );
}

function EntityBanner({ entity }) {
  if (entity.mode === "employer_unverifiable") {
    return (
      <div className="entity-banner entity-unverifiable">
        <p className="entity-title">Employer unverifiable</p>
        <p className="entity-detail">Web employer signals were not run. This report is based on posting text only.</p>
        <Badge provenance="no_data_found" />
      </div>
    );
  }

  const confidencePct = Math.round((entity.confidence ?? 0) * 100);
  return (
    <div className="entity-banner entity-verified">
      <p className="entity-title">{entity.canonical_name || "Unknown employer"}</p>
      <p className="entity-detail">
        Resolved employer · {confidencePct}% confidence
        {entity.domain ? ` · ${entity.domain}` : ""}
      </p>
      <Badge provenance="verified_source" />
    </div>
  );
}

function TrustLedger({ ledger }) {
  return (
    <section className="card ledger-card">
      <h2>Trust ledger</h2>
      <p className="section-intro">Every claim is tagged by how it was sourced.</p>
      <ul className="ledger-counts">
        <li>
          <Badge provenance="verified_source" />
          <span className="ledger-num">{ledger.verified}</span>
        </li>
        <li>
          <Badge provenance="inferred_from_posting" />
          <span className="ledger-num">{ledger.inferred}</span>
        </li>
        <li>
          <Badge provenance="no_data_found" />
          <span className="ledger-num">{ledger.no_data}</span>
        </li>
      </ul>
    </section>
  );
}

function PostingCard({ posting }) {
  const requirements = posting.requirements ?? [];
  return (
    <section className="card">
      <h2>Posting</h2>
      <dl className="posting-grid">
        <div>
          <dt>Employer</dt>
          <dd>{posting.employer_name}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{posting.role}</dd>
        </div>
        <div>
          <dt>Comp stated</dt>
          <dd>{formatCompStated(posting.comp_stated)}</dd>
        </div>
      </dl>
      {requirements.length > 0 ? (
        <>
          <p className="requirements-label">Requirements</p>
          <ul className="requirements-list">
            {requirements.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function PostingSignals({ flags }) {
  if (!flags.length) {
    return (
      <section className="card">
        <h2>Posting signals</h2>
        <div className="empty-state">
          <Badge provenance="no_data_found" />
          <p>No posting signals surfaced in this job description.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Posting signals</h2>
      <p className="section-intro">Patterns in the job description text. Expand a row to inspect the cited evidence quote.</p>
      <div className="ledger-list">
        {flags.map((flag, index) => (
          <details className="ledger-item flag-item" defaultOpen={index === 0} key={`${flag.type}-${flag.evidence_quote}-${index}`}>
            <summary>
              <span className="item-title">{formatLabel(flag.type)}</span>
              <span className={`severity ${SEVERITY_CLASS[flag.severity] ?? "severity-medium"}`}>{formatLabel(flag.severity)}</span>
              <Badge provenance={flag.provenance} />
            </summary>
            <div className="item-body">
              <p>{flag.explanation}</p>
              <blockquote className="evidence-quote">
                <span className="quote-label">From the posting</span>
                {flag.evidence_quote}
              </blockquote>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function EmployerSignals({ signals, entity }) {
  if (entity.mode === "employer_unverifiable") {
    return (
      <section className="card">
        <h2>Employer signals</h2>
        <div className="empty-state">
          <Badge provenance="no_data_found" />
          <p>Employer could not be verified, so no web signals were collected.</p>
        </div>
      </section>
    );
  }

  if (!signals.length) {
    return (
      <section className="card">
        <h2>Employer signals</h2>
        <div className="empty-state">
          <Badge provenance="no_data_found" />
          <p>No employer signals found for this company.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Employer signals</h2>
      <p className="section-intro">Grounded claims from retrieved web sources. Expand a row for excerpt and source URL.</p>
      <div className="ledger-list">
        {signals.map((signal, index) => (
          <details className="ledger-item signal-item" key={`${signal.type}-${signal.source_url}-${index}`}>
            <summary>
              <span className="item-title">{formatLabel(signal.type)}</span>
              <Badge provenance={signal.provenance} />
            </summary>
            <div className="item-body">
              <p>{signal.claim}</p>
              <blockquote className="evidence-quote">
                <span className="quote-label">Source excerpt</span>
                {signal.quote}
              </blockquote>
              <a className="source-link" href={signal.source_url} target="_blank" rel="noopener noreferrer">
                View source
              </a>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function ReportView({ report, source }) {
  const validated = validateReport(report);
  return (
    <section className="report" data-source={source} aria-live="polite">
      <SourceBanner source={source} />
      <OverallHeader overall={validated.overall} />
      <EntityBanner entity={validated.entity} />
      <TrustLedger ledger={validated.ledger} />
      <PostingCard posting={validated.posting} />
      <PostingSignals flags={validated.posting_flags ?? []} />
      <EmployerSignals signals={validated.employer_signals ?? []} entity={validated.entity} />
    </section>
  );
}
