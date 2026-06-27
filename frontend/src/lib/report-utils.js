// Presentation helpers + defensive normalization for the analysis report.
// The report shape is produced by the backend /analyze endpoint and mirrored
// by fixtures/mock_report.json.

export const PROVENANCE = {
  verified_source: { className: "badge badge-verified", label: "Verified source" },
  inferred_from_posting: { className: "badge badge-inferred", label: "Inferred from posting" },
  no_data_found: { className: "badge badge-no-data", label: "No data found" },
};

export const RISK_BAND_CLASS = {
  low: "risk-low",
  limited: "risk-low",
  moderate: "risk-elevated",
  elevated: "risk-elevated",
  high: "risk-high",
  severe: "risk-high",
  critical: "risk-high",
};

export const SEVERITY_CLASS = {
  low: "severity-low",
  medium: "severity-medium",
  high: "severity-high",
};

// "scope_creep" -> "Scope Creep", "high" -> "High"
export function formatLabel(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatCompStated(comp) {
  if (comp === null || comp === undefined || comp === "") return "Not stated";
  return typeof comp === "string" ? comp : String(comp);
}

// Fill in safe defaults so a partial/empty report never crashes the view.
export function validateReport(report) {
  const safe = report ?? {};
  return {
    overall: {
      risk_band: safe.overall?.risk_band ?? "elevated",
      caveat: safe.overall?.caveat ?? "signals, not verdicts",
    },
    entity: safe.entity ?? { mode: "employer_unverifiable" },
    ledger: {
      verified: safe.ledger?.verified ?? 0,
      inferred: safe.ledger?.inferred ?? 0,
      no_data: safe.ledger?.no_data ?? 0,
    },
    posting: {
      employer_name: safe.posting?.employer_name ?? "undisclosed",
      role: safe.posting?.role ?? "unknown",
      comp_stated: safe.posting?.comp_stated ?? null,
      requirements: safe.posting?.requirements ?? [],
    },
    posting_flags: safe.posting_flags ?? [],
    employer_signals: safe.employer_signals ?? [],
  };
}
