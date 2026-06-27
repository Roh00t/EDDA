# CLAUDE.md — EDDA Project Rules

Read this before touching any file. These rules prevent the most common drift patterns.

## What This Project Is

EDDA (Employer Due-Diligence Agent) — paste a job description, get a trust report.
Every claim is tagged `verified_source`, `inferred_from_posting`, or `no_data_found`.
Brand promise: **"signals, not verdicts."**

## Immutable Files — Never Edit Without Orchestrator Approval

| File | Why frozen |
|------|-----------|
| `schema/report_schema.json` | Contract every component builds against |
| `schema/mock_report.json` | Reference example — all agents build against this |
| `backend/analysis/models.py` | Pydantic mirror of schema — change schema first, then models |

If you think the schema must change: **STOP and report. Do not self-approve.**

## Non-Negotiable Invariants

1. **Grounding gate is deterministic Python — never an LLM call.**
   Lives in `backend/analysis/analyzer.py` as `verify_quote()` and `_normalize()`.
   A gate that calls the model or network is a bug, not a feature.

2. **Pipeline never returns blank.**
   If web signals fail, entity is unresolvable, or the LLM errors — degrade to the
   posting-text branch. `pipeline_mvp.analyze()` must always return a valid `Report`.

3. **`overall.caveat` is always `"signals, not verdicts"`** — hardcoded in `Overall` model.

4. **API keys never committed.** `.env` only. `.env.example` shows required keys.

## Stack — No Additions Without Asking

- **Backend:** Python 3.13 (3.11/3.12 locally acceptable), FastAPI, Pydantic v2
- **Frontend:** Vanilla JS + HTML + CSS. No React, no TypeScript, no npm, no build step.
- **LLM:** OpenAI structured outputs only — no free-text parsing of model responses
- **Web signals:** Exa API only
- **Do not add:** ORMs, task queues, caches, auth layers, websockets, or heavy ML deps (no pyspark, no torch, no transformers)

## File Ownership — Scope Lock

Each component owns exactly its directory. Do not cross boundaries.

| Owner | Scope | Must NOT touch |
|-------|-------|----------------|
| Retrieval | `backend/retrieval/` | app.py, analysis/, frontend/ |
| Analysis | `backend/analysis/` | app.py, retrieval/, frontend/ |
| Frontend | `frontend/` | backend/, schema/ |
| Glue/Deploy | `backend/app.py`, `Procfile`, `render.yaml` | analysis/, retrieval/ internals |

## Key Interfaces (do not rename without updating all callers)

```python
# Retrieval
resolve_employer(employer_name: str) -> Entity          # resolver.py
fetch_signals(entity: Entity) -> list[EmployerSignal]  # signals.py
get_signal_source_text(url: str) -> str                # signals.py — grounding cache

# Analysis
parse_posting(jd_text: str) -> Posting                 # parser.py
analyze_posting(jd_text: str) -> list[PostingFlag]     # analyzer.py
verify_quote(quote: str, source_text: str) -> bool     # analyzer.py — DETERMINISTIC
build_report(...) -> Report                            # assembler.py

# Pipeline
analyze(jd_text: str) -> Report                        # pipeline_mvp.py — entry point
```

## How to Run Locally

```bash
# Backend (from project root)
.venv/Scripts/activate        # Windows
source .venv/bin/activate     # Mac/Linux
cd backend && uvicorn app:app --reload

# Frontend is served by FastAPI at http://localhost:8000/
# (StaticFiles mount in app.py serves frontend/ at /)
```

## How to Test

```bash
# From project root
python -m pytest backend/tests/ -v

# Smoke test (backend must be running)
curl -X POST localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"jd_text":"Software Engineer at Google. Must know 15 technologies."}'

# Never-blank test
curl -X POST localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"jd_text":"Job at [Undisclosed Company]. Competitive salary."}'
# Expect: entity.mode=employer_unverifiable, employer_signals=[], not blank
```

## Branch Rules

```
feat/retrieval  →┐
feat/analysis   →┤ testing → main
feat/frontend   →┤
feat/deploy     →┘
```

- Branch off `testing`, PR back into `testing`
- `main` is always deployable
- Commit small and often — one checkpoint per commit

## Deploy Topology

- **Zo** (primary): FastAPI Service, start cmd `uvicorn app:app --host 0.0.0.0 --port $PORT`, working dir `backend/`
- **Render** (fallback): auto-deploys from `testing` via `render.yaml`
- Frontend served as StaticFiles from FastAPI — same origin as backend

## Demo Companies (pre-flighted through Exa)

Hardcoded in `backend/retrieval/r0_preflight.py`: **Microsoft, Shopify, Google**
Use one of these as the employer in the stage demo JD.
Demo JD lives at `demo/demo_jd.txt`.

## What Frequently Goes Wrong

- Editing `models.py` without touching the schema first → schema/model drift
- Adding a network call inside `verify_quote()` → violates grounding gate invariant
- Returning an empty dict or `{}` on LLM error → violates never-blank invariant
- Adding a heavy pip package → breaks Zo/Render build time (pyspark happened once)
- Touching files outside your scope → merge conflicts in a 4-person parallel build
