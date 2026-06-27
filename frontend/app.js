const reportContainer = document.getElementById("report");
const jdTextarea = document.getElementById("jd-text");
const analyzeBtn = document.getElementById("analyze-btn");
const statusEl = document.getElementById("status");

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = type ? `status ${type}` : "status";
}

function renderReport(report) {
  reportContainer.innerHTML = "";

  const posting = document.createElement("div");
  posting.className = "card";
  posting.innerHTML = `
    <h2>Posting</h2>
    <p><strong>Employer:</strong> ${report.posting.employer_name}</p>
    <p><strong>Role:</strong> ${report.posting.role}</p>
    <p><strong>Comp stated:</strong> ${report.posting.comp_stated || "n/a"}</p>
    <p><strong>Requirements:</strong></p>
    <ul>${report.posting.requirements.map((item) => `<li>${item}</li>`).join("")}</ul>
  `;

  const entity = document.createElement("div");
  entity.className = "card";
  entity.innerHTML = `
    <h2>Entity</h2>
    <p><strong>Resolved:</strong> ${report.entity.resolved}</p>
    <p><strong>Confidence:</strong> ${report.entity.confidence}</p>
    <p><strong>Canonical:</strong> ${report.entity.canonical_name}</p>
    <p><strong>Domain:</strong> ${report.entity.domain || "n/a"}</p>
    <p><strong>Mode:</strong> ${report.entity.mode}</p>
  `;

  const postingFlags = document.createElement("div");
  postingFlags.className = "card";
  postingFlags.innerHTML = `
      <h2>Posting Flags</h2>
      ${report.posting_flags.length === 0
        ? "<p>No posting flags detected.</p>"
        : report.posting_flags.map((flag) => `
        <div class="flag">
          <p><strong>${flag.type}</strong> (${flag.severity})</p>
          <p>${flag.explanation}</p>
          <p><em>${flag.evidence_quote}</em></p>
          <p><small>${flag.provenance}</small></p>
        </div>
      `).join("")}
  `;

  const employerSignals = document.createElement("div");
  employerSignals.className = "card";
  employerSignals.innerHTML = `
      <h2>Employer Signals</h2>
      ${report.employer_signals.length === 0
        ? "<p>No employer signals (web lookup not enabled in MVP).</p>"
        : report.employer_signals.map((signal) => `
        <div class="signal">
          <p><strong>${signal.type}</strong></p>
          <p>${signal.claim}</p>
          <p><em>${signal.quote}</em></p>
          <p><a href="${signal.source_url}" target="_blank">${signal.source_url}</a></p>
          <p><small>${signal.provenance}</small></p>
        </div>
      `).join("")}
  `;

  const ledger = document.createElement("div");
  ledger.className = "card";
  ledger.innerHTML = `
    <h2>Ledger</h2>
    <p>Verified: ${report.ledger.verified}</p>
    <p>Inferred: ${report.ledger.inferred}</p>
    <p>No data: ${report.ledger.no_data}</p>
  `;

  const overall = document.createElement("div");
  overall.className = "card";
  overall.innerHTML = `
    <h2>Overall</h2>
    <p><strong>Risk band:</strong> ${report.overall.risk_band}</p>
    <p>${report.overall.caveat}</p>
  `;

  reportContainer.append(posting, entity, postingFlags, employerSignals, ledger, overall);
}

async function analyzePosting() {
  const jdText = jdTextarea.value.trim();
  if (!jdText) {
    setStatus("Paste a job description first.", "error");
    return;
  }

  analyzeBtn.disabled = true;
  setStatus("Analyzing…", "loading");

  try {
    const response = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jd_text: jdText }),
    });

    if (!response.ok) {
      setStatus(`Analysis failed (${response.status}). Check the backend logs.`, "error");
      return;
    }

    const report = await response.json();
    renderReport(report);
    setStatus("");
  } catch (error) {
    setStatus("Could not connect to backend. Is uvicorn running on port 8000?", "error");
  } finally {
    analyzeBtn.disabled = false;
  }
}

analyzeBtn.addEventListener("click", analyzePosting);

jdTextarea.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    analyzePosting();
  }
});
