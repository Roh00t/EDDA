# Agent A — Retrieval

**Role:** Exa entity resolver + employer web signals.

**Scope:** `backend/retrieval/` only. Do NOT touch `app.py`, `analysis/`, or `frontend/`.

**Branch:** `feat/retrieval` → PR into `testing`.

## Context

Codebase: `D:/Projects/EDDA`
Stack: Python 3.13 + FastAPI. Exa API for entity resolution and web signals.
Env: `EXA_API_KEY` in `.env` (see `.env.example`).

Key files already exist — read them before touching anything:
- `backend/retrieval/resolver.py` — `resolve_employer(name) → Entity`
- `backend/retrieval/signals.py` — `fetch_signals(entity) → list[EmployerSignal]`
- `backend/analysis/models.py` — Entity and EmployerSignal types (read-only)
- `backend/retrieval/r0_preflight.py` — demo company preflight script

The pipeline (`backend/analysis/pipeline_mvp.py`) imports these via optional try/except — if your code raises, the pipeline degrades gracefully. Do not change that behavior.

## Tasks

### Task 1 — Verify resolver works
Run `python backend/retrieval/resolver.py` (or equivalent). Confirm:
- `resolve_employer("Google")` → `mode: verified`, `confidence >= 0.6`
- `resolve_employer("undisclosed")` → `mode: employer_unverifiable`
- `resolve_employer("")` → `mode: employer_unverifiable`

Fix any bugs found. Do NOT change the function signature.

**CP1:** Print actual output of all 3 calls above. Wait for confirmation before continuing.

### Task 2 — Verify signals work
Confirm `fetch_signals(entity)` returns a list of `EmployerSignal` objects for a verified entity.
Each signal must have: `type`, `claim`, `quote`, `source_url`, `provenance="verified_source"`.

**CP2:** Print 1 sample EmployerSignal from a real Exa fetch. Wait for confirmation.

### Task 3 — Preflight 4–5 demo companies
Run `backend/retrieval/r0_preflight.py` against these companies:
- Google, Microsoft, Stripe, Shopify, Palantir

Keep the 3 richest results (most signals returned, cleanest domain resolution).
Update `r0_preflight.py` to hardcode those 3 as the demo set.

**CP3:** Print the 3 chosen companies + their signal counts. Wait for confirmation.

### Task 4 — Grounding gate compatibility
Each `EmployerSignal.quote` must be a substring of the text in the retrieved source document.
Confirm signals.py stores the raw source text alongside the quote so the grounding gate (in `analysis/assembler.py`) can verify it.

If `signals.py` does NOT store source text → add a `source_text` field to the return value.
Do NOT edit `analysis/models.py` — discuss with orchestrator first.

**CP4:** Show that `quote in source_text` is True for one real signal. Wait for confirmation.

## Done When

- All 3 checkpoints confirmed
- `resolve_employer` and `fetch_signals` pass manual verification
- 3 demo companies hardcoded in `r0_preflight.py`
- PR open into `testing`

## Karpathy Rules

- Read `resolver.py` and `signals.py` fully before editing anything.
- Fix bugs; don't refactor.
- If Exa API key is missing or invalid, stop and report — don't fake data.
