# Agent C — Frontend

**Role:** JD input UI + trust ledger rendering.

**Scope:** `frontend/` only. Do NOT touch `backend/` or `schema/`.

**Branch:** `feat/frontend` → PR into `testing`.

## Context

Codebase: `D:/Projects/EDDA`
Stack: Vanilla JS + HTML + CSS. No React, no npm, no build step.
Backend: FastAPI at `http://localhost:8000` (local) or the Zo public URL (deploy).
Mock data: `frontend/fixtures/mock_report.json` — build against this, never wait for backend.

Key files — read ALL before touching anything:
- `frontend/index.html`
- `frontend/app.js`
- `frontend/styles.css`
- `frontend/fixtures/mock_report.json`
- `schema/report_schema.json` — the contract (read-only)

## Tasks

### Task 1 — Render all schema sections from mock
Load `frontend/fixtures/mock_report.json` and render EVERY section:
- `posting` — employer name, role, comp_stated
- `entity` — resolved status, confidence, mode (verified vs employer_unverifiable)
- `posting_flags` — list with severity badges, evidence quotes, provenance tags
- `employer_signals` — list with claim, source_url, quote, provenance tag
- `ledger` — counts for verified / inferred / no_data
- `overall` — risk_band (styled: low=green, elevated=yellow, high=red) + caveat

**CP1:** Screenshot or describe every section visible in browser with mock data. Wait for confirmation.

### Task 2 — Handle employer_unverifiable gracefully
When `entity.mode === "employer_unverifiable"`, the `employer_signals` section must show a clear message ("Employer could not be verified — web signals unavailable") not blank space.

**CP2:** Switch mock entity to `mode: employer_unverifiable` and show the UI. Wait for confirmation.

### Task 3 — Provenance tags visible
Every `posting_flag` and `employer_signal` must display its `provenance` value as a visible label:
- `verified_source` → green tag
- `inferred_from_posting` → blue tag
- `no_data_found` → grey tag

**CP3:** Show all 3 tag styles rendered. Wait for confirmation.

### Task 4 — JD paste → POST /analyze → render
Wire the submit button to `POST /analyze` with `{ jd_text: <textarea value> }`.
On success → render the report. On error → show "Analysis failed — try again."
Do NOT render blank on error.

**CP4:** Paste a 3-line fake JD, submit, show network request + response in DevTools. Wait for confirmation.

## Done When

- All 4 checkpoints confirmed
- Every schema section renders from mock and from real API
- No blank on error or unverifiable employer
- PR open into `testing`

## Karpathy Rules

- Build against mock first. Backend may not be ready.
- Vanilla JS only. No libraries, no frameworks.
- Shortest HTML/CSS/JS that passes visual checks. No animations, no tooltips unless asked.
- If a section has no data, show "No data" — never hide the section header.
