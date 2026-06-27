// Data layer for the analyzer: mock fixture loader + live /analyze call.
// The backend returns the same shape as fixtures/mock_report.json.

import mockReport from "../../fixtures/mock_report.json";

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export async function loadMockReport() {
  // Return a copy so the shared fixture can't be mutated by the UI.
  return clone(mockReport);
}

export async function requestLiveReport(jdText) {
  const response = await fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd_text: jdText }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed (HTTP ${response.status})`);
  }

  return response.json();
}
