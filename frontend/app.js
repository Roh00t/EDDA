const API_URL = "http://localhost:8000/analyze";
const MOCK_URL = "fixtures/mock_report.json";

const reportContainer = document.getElementById("report");
const jdTextarea = document.getElementById("jd-text");
const analyzeBtn = document.getElementById("analyze-btn");
const statusEl = document.getElementById("status");

const PROVENANCE = {
  verified_source: {
    label: "Verified source",
    className: "badge badge-verified",
  },
  inferred_from_posting: {
    label: "Inferred from posting",
    className: "badge badge-inferred",
  },
  no_data_found: {
    label: "No data found",
    className: "badge badge-no-data",
  },
};

const RISK_BAND_CLASS = {
  low: "risk-low",
  elevated: "risk-elevated",
  high: "risk-high",
};

const SEVERITY_CLASS = {
  low: "severity-low",
  medium: "severity-medium",
  high: "severity-high",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatLabel(value) {
  return escapeHtml(String(value ?? "").replace(/_/g, " "));
}

function formatCompStated(value) {
  if (value == null || value === "" || value === "null") {
    return "Not stated";
  }
  return escapeHtml(value);
}

function validateReport(report) {
  const required = ["posting", "entity", "ledger", "overall"];
  for (const key of required) {
    if (!report?.[key] || typeof report[key] !== "object") {
      throw new Error(`Invalid report: missing ${key}`);
    }
  }
  return report;
}

function provenanceBadge(provenance) {
  const meta = PROVENANCE[provenance] ?? PROVENANCE.no_data_found;
  return `<span class="${meta.className}">${meta.label}</span>`;
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = type ? `status ${type}` : "status";
}

function showLoading() {
  reportContainer.hidden = false;
  reportContainer.innerHTML = `
    <div class="card loading-card" aria-busy="true">
      <div class="spinner" aria-hidden="true"></div>
      <p class="loading-text">Analyzing posting…</p>
      <p class="loading-subtext">This may take a moment while we read the job description.</p>
    </div>
  `;
}

function renderEntityBanner(entity) {
  if (entity.mode === "employer_unverifiable") {
    return `
      <div class="entity-banner entity-unverifiable">
        <p class="entity-title">Employer unverifiable</p>
        <p class="entity-detail">Web employer signals were not run — this report is based on posting text only.</p>
        ${provenanceBadge("no_data_found")}
      </div>
    `;
  }

  const confidencePct = Math.round((entity.confidence ?? 0) * 100);
  return `
    <div class="entity-banner entity-verified">
      <p class="entity-title">${escapeHtml(entity.canonical_name || "Unknown employer")}</p>
      <p class="entity-detail">
        Resolved employer · ${confidencePct}% confidence
        ${entity.domain ? ` · ${escapeHtml(entity.domain)}` : ""}
      </p>
      ${provenanceBadge("verified_source")}
    </div>
  `;
}

function renderSourceBanner(source) {
  const isLive = source === "live";
  return `
    <p class="source-banner ${isLive ? "source-live" : "source-preview"}" role="status">
      ${isLive ? "Live analysis" : "Preview layout (mock report)"}
    </p>
  `;
}

function renderOverallHeader(overall) {
  const bandClass = RISK_BAND_CLASS[overall.risk_band] ?? "risk-elevated";
  return `
    <header class="overall-header card">
      <div class="overall-top">
        <p class="overall-label">Signal summary</p>
        <span class="risk-band ${bandClass}">${formatLabel(overall.risk_band)}</span>
      </div>
      <p class="caveat">${escapeHtml(overall.caveat)}</p>
    </header>
  `;
}

function renderLedger(ledger) {
  return `
    <section class="card ledger-card">
      <h2>Trust ledger</h2>
      <p class="section-intro">Every claim is tagged by how it was sourced.</p>
      <ul class="ledger-counts">
        <li>
          ${provenanceBadge("verified_source")}
          <span class="ledger-num">${ledger.verified}</span>
        </li>
        <li>
          ${provenanceBadge("inferred_from_posting")}
          <span class="ledger-num">${ledger.inferred}</span>
        </li>
        <li>
          ${provenanceBadge("no_data_found")}
          <span class="ledger-num">${ledger.no_data}</span>
        </li>
      </ul>
    </section>
  `;
}

function renderPosting(posting) {
  const requirements = (posting.requirements ?? [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `
    <section class="card">
      <h2>Posting</h2>
      <dl class="posting-grid">
        <div><dt>Employer</dt><dd>${escapeHtml(posting.employer_name)}</dd></div>
        <div><dt>Role</dt><dd>${escapeHtml(posting.role)}</dd></div>
        <div><dt>Comp stated</dt><dd>${formatCompStated(posting.comp_stated)}</dd></div>
      </dl>
      ${requirements ? `<p class="requirements-label">Requirements</p><ul class="requirements-list">${requirements}</ul>` : ""}
    </section>
  `;
}

function renderPostingFlags(flags) {
  if (!flags.length) {
    return `
      <section class="card">
        <h2>Posting signals</h2>
        <div class="empty-state">
          ${provenanceBadge("no_data_found")}
          <p>No posting signals surfaced in this job description.</p>
        </div>
      </section>
    `;
  }

  const items = flags
    .map(
      (flag, index) => `
      <details class="ledger-item flag-item" ${index === 0 ? "open" : ""}>
        <summary>
          <span class="item-title">${formatLabel(flag.type)}</span>
          <span class="severity ${SEVERITY_CLASS[flag.severity] ?? "severity-medium"}">${formatLabel(flag.severity)}</span>
          ${provenanceBadge(flag.provenance)}
        </summary>
        <div class="item-body">
          <p>${escapeHtml(flag.explanation)}</p>
          <blockquote class="evidence-quote">
            <span class="quote-label">From the posting</span>
            ${escapeHtml(flag.evidence_quote)}
          </blockquote>
        </div>
      </details>
    `
    )
    .join("");

  return `
    <section class="card">
      <h2>Posting signals</h2>
      <p class="section-intro">Patterns in the job description text. Click a row to see the cited quote.</p>
      <div class="ledger-list">${items}</div>
    </section>
  `;
}

function renderEmployerSignals(signals, entity) {
  if (entity.mode === "employer_unverifiable") {
    return `
      <section class="card">
        <h2>Employer signals</h2>
        <div class="empty-state">
          ${provenanceBadge("no_data_found")}
          <p>Employer could not be verified — no web signals were collected.</p>
        </div>
      </section>
    `;
  }

  if (!signals.length) {
    return `
      <section class="card">
        <h2>Employer signals</h2>
        <div class="empty-state">
          ${provenanceBadge("no_data_found")}
          <p>No employer signals found for this company.</p>
        </div>
      </section>
    `;
  }

  const items = signals
    .map(
      (signal) => `
      <details class="ledger-item signal-item">
        <summary>
          <span class="item-title">${formatLabel(signal.type)}</span>
          ${provenanceBadge(signal.provenance)}
        </summary>
        <div class="item-body">
          <p>${escapeHtml(signal.claim)}</p>
          <blockquote class="evidence-quote">
            <span class="quote-label">Source excerpt</span>
            ${escapeHtml(signal.quote)}
          </blockquote>
          <a class="source-link" href="${escapeHtml(signal.source_url)}" target="_blank" rel="noopener noreferrer">
            View source
          </a>
        </div>
      </details>
    `
    )
    .join("");

  return `
    <section class="card">
      <h2>Employer signals</h2>
      <p class="section-intro">Grounded claims from retrieved web sources. Click a row for the excerpt and link.</p>
      <div class="ledger-list">${items}</div>
    </section>
  `;
}

function renderReport(report, source = "preview") {
  const validated = validateReport(report);
  reportContainer.hidden = false;
  reportContainer.dataset.source = source;
  reportContainer.innerHTML = [
    renderSourceBanner(source),
    renderOverallHeader(validated.overall),
    renderEntityBanner(validated.entity),
    renderLedger(validated.ledger),
    renderPosting(validated.posting),
    renderPostingFlags(validated.posting_flags ?? []),
    renderEmployerSignals(validated.employer_signals ?? [], validated.entity),
  ].join("");

  if (source === "live") {
    reportContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function loadMockReport() {
  const response = await fetch(MOCK_URL);
  if (!response.ok) {
    throw new Error(`Could not load mock report (${response.status})`);
  }
  return response.json();
}

async function analyzePosting() {
  const jdText = jdTextarea.value.trim();
  if (!jdText) {
    setStatus("Paste a job description first.", "error");
    return;
  }

  analyzeBtn.disabled = true;
  setStatus("Analyzing…", "loading");
  showLoading();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jd_text: jdText }),
    });

    if (!response.ok) {
      reportContainer.hidden = true;
      setStatus(`Analysis failed (${response.status}). Check the backend logs.`, "error");
      return;
    }

    const report = validateReport(await response.json());
    renderReport(report, "live");
    setStatus("Live report ready.", "live");
  } catch (error) {
    reportContainer.hidden = true;
    const message =
      error instanceof TypeError
        ? "Could not connect to backend. Is uvicorn running on port 8000?"
        : error.message || "Unexpected error while rendering the report.";
    setStatus(message, "error");
  } finally {
    analyzeBtn.disabled = false;
  }
}

async function initPreview() {
  try {
    const report = await loadMockReport();
    renderReport(report, "preview");
    setStatus("Preview loaded — paste a JD and click Analyze for a live report.", "preview");
  } catch (error) {
    setStatus("Could not load preview fixture.", "error");
  }
}

analyzeBtn.addEventListener("click", analyzePosting);

const previewBtn = document.getElementById("preview-btn");
previewBtn?.addEventListener("click", initPreview);

jdTextarea.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    analyzePosting();
  }
});


