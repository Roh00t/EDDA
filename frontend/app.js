const reportContainer = document.getElementById("report");

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
    <p><strong>Domain:</strong> ${report.entity.domain}</p>
    <p><strong>Mode:</strong> ${report.entity.mode}</p>
  `;

  const postingFlags = document.createElement("div");
  postingFlags.className = "card";
  postingFlags.innerHTML = `
      <h2>Posting Flags</h2>
      ${report.posting_flags.map((flag) => `
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
      ${report.employer_signals.map((signal) => `
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

async function fetchMockReport() {
  try {
    const response = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jd_text: "test" }),
    });

    if (!response.ok) {
      reportContainer.textContent = "Failed to fetch report.";
      return;
    }

    const report = await response.json();
    renderReport(report);
  } catch (error) {
    reportContainer.textContent = "Could not connect to backend.";
  }
}

fetchMockReport();
