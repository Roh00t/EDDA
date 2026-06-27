# Schema Agent — Phase 0

**Role:** Lock the contract. Everything else builds against this.

**Scope:** `schema/` only. Do NOT touch any other folder.

## Context

Codebase: `D:/Projects/EDDA`
Stack: Python 3.13 + FastAPI. No React, no npm.
Contract files: `schema/report_schema.json`, `schema/mock_report.json`

Pydantic models live in `backend/analysis/models.py` and were derived from this schema.
The schema is the source of truth — models must match it, not the other way around.

## Task

1. Read `schema/report_schema.json`. Verify it matches the structure below exactly:

```json
{
  "posting": { "employer_name": "string|undisclosed", "role": "...", "comp_stated": "string|null", "requirements": ["..."] },
  "entity":  { "resolved": true, "confidence": 0.0, "canonical_name": "...", "domain": "...", "mode": "verified|employer_unverifiable" },
  "posting_flags":    [ { "type": "scope_creep", "severity": "high", "explanation": "...", "evidence_quote": "<from JD>", "provenance": "inferred_from_posting" } ],
  "employer_signals": [ { "type": "layoffs", "claim": "...", "quote": "...", "source_url": "https://...", "provenance": "verified_source" } ],
  "ledger": { "verified": 0, "inferred": 0, "no_data": 0 },
  "overall": { "risk_band": "low|elevated|high", "caveat": "signals, not verdicts" }
}
```

2. Read `schema/mock_report.json`. Verify it is a valid example conforming to the schema (all required fields present, provenance values correct, ledger counts match actual entries).

3. If schema or mock is missing or wrong → fix it. If it matches → leave it untouched.

## Stop-and-Report Checkpoints

**CP1:** Print the full contents of `schema/report_schema.json`. Wait for confirmation.
**CP2:** Print the full contents of `schema/mock_report.json`. Confirm ledger counts are correct.

## Done When

- Both files exist and are valid
- `schema/mock_report.json` hand-validates against `schema/report_schema.json`
- No other files modified

Do NOT edit `backend/analysis/models.py` or any other file.
