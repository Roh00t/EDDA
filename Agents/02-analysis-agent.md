# Agent B — Analysis (CRITICAL PATH)

**Role:** Red-flag analyzer + grounding gate. This is the load-bearing dependency.

**Scope:** `backend/analysis/` only. Do NOT touch `app.py`, `retrieval/`, or `frontend/`.

**Branch:** `feat/analysis` → PR into `testing`.

## Context

Codebase: `D:/Projects/EDDA`
Stack: Python 3.13 + FastAPI. OpenAI structured outputs for LLM calls.
Env: `OPENAI_API_KEY` in `.env`.

Key files — read ALL before touching anything:
- `backend/analysis/models.py` — Report schema as Pydantic models (source of truth)
- `backend/analysis/parser.py` — `parse_posting(jd_text) → Posting`
- `backend/analysis/analyzer.py` — `analyze_posting(jd_text) → list[PostingFlag]`
- `backend/analysis/assembler.py` — `build_report(...) → Report` + grounding gate
- `backend/analysis/pipeline_mvp.py` — end-to-end wiring (read-only unless bug found)
- `backend/tests/test_deterministic.py` — existing tests (must still pass)
- `schema/report_schema.json` — the contract (never edit)

## Tasks

### Task 1 — Verify analyzer produces flags
Run: `python -m backend.analysis.analyzer` (or the `__main__` block).
Confirm `analyze_posting(SAMPLE_JD)` returns ≥ 1 `PostingFlag` with valid provenance.

**CP1:** Print actual PostingFlag output (JSON). Wait for confirmation.

### Task 2 — Verify grounding gate drops bad quotes
The grounding gate in `assembler.py` must enforce: a signal only appears in the report if `signal.quote` is a substring of the retrieved source text.

Write or locate the gate logic. Verify with a unit test:
```python
# signal.quote NOT in source_text → dropped
# signal.quote IN source_text → kept
```

If gate is missing or incomplete → implement it as a pure function in `assembler.py`.
It must be deterministic Python — NO LLM call. A gate that calls the model is a bug.

**CP2:** Show the gate function + demonstrate it drops a fabricated quote. Wait for confirmation.

### Task 3 — Verify never-blank contract
Confirm `pipeline_mvp.analyze("")` returns a valid Report (not an exception, not empty JSON).
The report may have 0 flags and `risk_band: low`, but it must conform to the schema.

**CP3:** Print the Report JSON for an empty-string JD. Wait for confirmation.

### Task 4 — Run existing tests
```bash
cd D:/Projects/EDDA
python -m pytest backend/tests/test_deterministic.py -v
```
All tests must pass. Fix failures; do not delete tests.

**CP4:** Show pytest output (all green). Wait for confirmation.

## Done When

- All 4 checkpoints confirmed
- Grounding gate is deterministic Python, verifiably drops bad quotes
- Never-blank contract holds
- All existing tests pass
- PR open into `testing`

## Karpathy Rules

- Read all files above before writing a line.
- Grounding gate = pure function. If it touches the network or an LLM, stop and report.
- If `models.py` needs a schema change → STOP and report to orchestrator. Do not self-approve.
- Shortest fix that makes tests pass. No refactoring beyond the task.
