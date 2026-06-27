# Agent D — Glue + Integration

**Role:** Wire real components behind `/analyze`. Run integration smoke test.

**Scope:** `backend/app.py` primary. May also touch `backend/analysis/pipeline_mvp.py` if wiring bugs found.

**Branch:** `feat/deploy` → PR into `testing`.

**Prerequisite:** Agent A (feat/retrieval) and Agent B (feat/analysis) must be merged to `testing` first.

## Context

Codebase: `D:/Projects/EDDA`
Stack: Python 3.13 + FastAPI. Uvicorn server.
Env: `OPENAI_API_KEY` + `EXA_API_KEY` in `.env`.

Key files — read ALL before touching anything:
- `backend/app.py` — already wired to `analysis.pipeline_mvp.analyze`
- `backend/analysis/pipeline_mvp.py` — end-to-end pipeline (read to understand flow)
- `backend/analysis/models.py` — Report type
- `backend/retrieval/resolver.py` — `resolve_employer`
- `backend/retrieval/signals.py` — `fetch_signals`
- `backend/tests/test_deterministic.py` — run these

## Tasks

### Task 1 — Verify full pipeline end-to-end
Pull latest `testing` branch (has A+B work). Install deps:
```bash
pip install -r backend/requirements.txt
```

Run pipeline directly:
```bash
cd backend && python -c "
from analysis.pipeline_mvp import analyze
r = analyze('Software Engineer at Google. Must know Python, Kubernetes, and 15 other things.')
print(r.model_dump_json(indent=2))
"
```

Confirm: valid JSON, all schema fields present, `risk_band` is one of `low|elevated|high`.

**CP1:** Print full JSON output. Wait for confirmation.

### Task 2 — Smoke test via HTTP
Start server:
```bash
cd backend && uvicorn app:app --port 8000
```

Run smoke test:
```bash
curl -X POST localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"jd_text":"Software Engineer at Stripe. 10 years required for junior role."}'
```

Confirm: HTTP 200, valid JSON report, `posting_flags` not empty.

**CP2:** Print curl response (pretty JSON). Wait for confirmation.

### Task 3 — Never-blank smoke test
Run smoke test with employer_unverifiable scenario:
```bash
curl -X POST localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"jd_text":"Software Engineer at [Undisclosed Company]. Competitive salary."}'
```

Confirm: HTTP 200, `entity.mode` is `employer_unverifiable`, `employer_signals` is empty array, report is NOT blank.

**CP3:** Print curl response. Wait for confirmation.

### Task 4 — Run all tests
```bash
cd D:/Projects/EDDA && python -m pytest backend/tests/ -v
```
All must pass. Fix failures; do not delete tests.

**CP4:** Show pytest output. Wait for confirmation.

## Done When

- All 4 checkpoints confirmed
- `/analyze` returns valid Report for real JD + undisclosed employer
- All tests pass
- PR open into `testing`

## Karpathy Rules

- Read `app.py` fully. It may already wire everything correctly — your job is verify, not rewrite.
- If `pipeline_mvp.py` has a bug → fix the bug there. Don't patch around it in `app.py`.
- Do NOT add middleware, logging, metrics, or other unrequested features.
- If `OPENAI_API_KEY` is missing, the pipeline should return 0 flags (graceful). Confirm this works.
