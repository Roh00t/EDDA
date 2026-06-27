# EDDA Agent Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dispatch 5 Claude Code sub-agents across 3 phases to build all EDDA components in parallel and ship to Zo before demo.

**Architecture:** Schema locked first → A/B/C build in parallel against mock → D wires real components → Deploy agent ships to Zo + Render.

**Tech Stack:** Python 3.12 (3.13 not installed locally), FastAPI, Vanilla JS, Exa API, OpenAI structured outputs, Zo hosting, Render fallback.

## Global Constraints

- Python 3.12 locally (3.13 in prod on Zo — test both if possible)
- No React, no TypeScript, no npm. Vanilla JS only in frontend/.
- `schema/report_schema.json` is immutable — no agent changes it without orchestrator approval
- Every agent branches off `testing`, PRs back into `testing`
- Grounding gate must be deterministic Python — no LLM call inside it
- Pipeline must never return blank (degrade to posting-text branch if web fails)
- API keys in `.env` only — never commit them
- Each agent reads `context.md` before starting

---

## Task 0: Schema Lock (prerequisite — run first, sequential)

**Files:**
- Read: `schema/report_schema.json`
- Read: `schema/mock_report.json`

**Interfaces:**
- Produces: confirmed-valid schema + mock for all Phase 1 agents to build against

- [ ] **Step 1: Dispatch Schema Agent**

Open a new Claude Code agent with the contents of `Agents/00-schema-agent.md` as the prompt.

```
Agent(
  description="Schema lock agent",
  prompt=open("Agents/00-schema-agent.md").read()
)
```

- [ ] **Step 2: Verify CP1 — schema contents printed**

Agent prints `schema/report_schema.json`. Confirm it has all 6 top-level keys:
`posting`, `entity`, `posting_flags`, `employer_signals`, `ledger`, `overall`

- [ ] **Step 3: Verify CP2 — mock validated**

Agent prints `schema/mock_report.json`. Confirm ledger counts match actual entry counts.

- [ ] **Step 4: Confirm phase 0 done**

Schema unchanged and valid. Proceed to Task 1.

---

## Task 1: Parallel Build — A + B + C (dispatch all 3 simultaneously)

**Files:**
- Agent A → `backend/retrieval/resolver.py`, `backend/retrieval/signals.py`, `backend/retrieval/r0_preflight.py`
- Agent B → `backend/analysis/analyzer.py`, `backend/analysis/assembler.py`, `backend/analysis/pipeline_mvp.py`, `backend/tests/test_deterministic.py`
- Agent C → `frontend/index.html`, `frontend/app.js`, `frontend/styles.css`

**Interfaces:**
- Agent A produces: `resolve_employer(name: str) -> Entity`, `fetch_signals(entity: Entity) -> list[EmployerSignal]`
- Agent B produces: `analyze_posting(jd_text: str) -> list[PostingFlag]`, `build_report(...) -> Report`, grounding gate as pure function
- Agent C produces: UI that renders all schema fields from `frontend/fixtures/mock_report.json`

- [ ] **Step 1: Dispatch all 3 in one message**

```python
# Send these 3 Agent calls in a SINGLE response to run in parallel
Agent(
  description="Agent A — Retrieval",
  prompt=open("Agents/01-retrieval-agent.md").read()
)
Agent(
  description="Agent B — Analysis (critical path)",
  prompt=open("Agents/02-analysis-agent.md").read()
)
Agent(
  description="Agent C — Frontend",
  prompt=open("Agents/03-frontend-agent.md").read()
)
```

- [ ] **Step 2: Monitor Agent B first (critical path)**

While all 3 run, track B's progress. If B's CP2 (grounding gate) fails → pause A and C, fix B first.

- [ ] **Step 3: Verify Agent A checkpoints**

- CP1: `resolve_employer("Google")` → `mode: verified`, confidence ≥ 0.6 ✓
- CP2: One real `EmployerSignal` printed with `quote` + `source_url` ✓
- CP3: 3 demo companies chosen and hardcoded in `r0_preflight.py` ✓
- CP4: `quote in source_text` is True for one real signal ✓

- [ ] **Step 4: Verify Agent B checkpoints**

- CP1: `analyze_posting(SAMPLE_JD)` returns ≥ 1 `PostingFlag` ✓
- CP2: Grounding gate drops a fabricated quote (deterministic, no LLM) ✓
- CP3: `pipeline_mvp.analyze("")` returns valid Report, not blank ✓
- CP4: `pytest backend/tests/test_deterministic.py` — all green ✓

- [ ] **Step 5: Verify Agent C checkpoints**

- CP1: All 6 schema sections visible in browser with mock data ✓
- CP2: `employer_unverifiable` shows message, not blank ✓
- CP3: All 3 provenance tag styles rendered ✓
- CP4: JD paste → POST /analyze → report renders ✓

- [ ] **Step 6: Merge A + B to testing**

Both agents open PRs to `testing`. Review diffs for scope bleed. Merge A, then B.

```bash
git checkout testing && git pull
# verify both PRs merged
```

---

## Task 2: Glue + Integration (after A + B merged to testing)

**Files:**
- Modify: `backend/app.py` (verify wiring only — may need no changes)
- Read: `backend/analysis/pipeline_mvp.py`
- Test: `backend/tests/test_deterministic.py`

**Interfaces:**
- Consumes: `resolve_employer`, `fetch_signals` from retrieval; `analyze_posting`, `build_report` from analysis
- Produces: `POST /analyze` returning valid `Report` JSON

- [ ] **Step 1: Dispatch Agent D**

```python
Agent(
  description="Agent D — Glue + Integration",
  prompt=open("Agents/04-glue-agent.md").read()
)
```

- [ ] **Step 2: Verify CP1 — full pipeline**

```python
from analysis.pipeline_mvp import analyze
r = analyze("Software Engineer at Google. Must know Python, Kubernetes, and 15 other things.")
# expect: valid JSON, all schema fields, risk_band in [low, elevated, high]
```

- [ ] **Step 3: Verify CP2 — HTTP smoke test**

```bash
curl -X POST localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"jd_text":"Software Engineer at Stripe. 10 years required for junior role."}'
# expect: HTTP 200, posting_flags not empty
```

- [ ] **Step 4: Verify CP3 — never-blank smoke test**

```bash
curl -X POST localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"jd_text":"Software Engineer at [Undisclosed Company]. Competitive salary."}'
# expect: HTTP 200, entity.mode = employer_unverifiable, employer_signals = []
```

- [ ] **Step 5: Verify CP4 — all tests green**

```bash
python -m pytest backend/tests/ -v
# expect: all pass
```

- [ ] **Step 6: Merge D to testing, then testing → main**

```bash
# after D's PR merged to testing
git checkout main && git merge testing && git push origin main
```

---

## Task 3: Deploy (after main is clean)

**Files:**
- Read/fix: `Procfile`
- Read/fix: `render.yaml`
- Modify: `frontend/app.js` (point fetch URL to Zo)

**Interfaces:**
- Produces: public Zo URL returning valid `/analyze` response for demo JD

- [ ] **Step 1: Dispatch Deploy Agent**

```python
Agent(
  description="Deploy Agent — Zo + Render",
  prompt=open("Agents/05-deploy-agent.md").read()
)
```

- [ ] **Step 2: Verify CP2 — Zo health check**

```bash
curl <zo-public-url>/
# expect: {"status": "ok"}
```

- [ ] **Step 3: Verify CP3 — Zo smoke test**

```bash
curl -X POST <zo-public-url>/analyze \
  -H "Content-Type: application/json" \
  -d '{"jd_text":"Software Engineer at Google. Must know 15 technologies."}'
# expect: HTTP 200, posting_flags not empty
```

- [ ] **Step 4: Verify CP4 — Render fallback**

```bash
curl <render-url>/
# expect: {"status": "ok"}
```

- [ ] **Step 5: Lock demo JD**

Choose the exact JD text to paste on stage. Requirements:
- Named employer (one of the 3 pre-flighted companies)
- Contains ≥ 2 red-flag patterns (scope creep, undisclosed comp, etc.)
- Short enough to paste in <10 seconds

Hardcode it in a `demo/demo_jd.txt` file.

- [ ] **Step 6: Full demo rehearsal**

On the Zo public URL:
1. Paste demo JD → submit
2. Verify report renders: posting flags, employer signals, ledger, risk_band
3. Verify no blank sections

- [ ] **Step 7: Commit demo JD + push**

```bash
git add demo/demo_jd.txt
git commit -m "chore: lock demo JD for stage"
git push origin main
```

---

## Orchestrator Checklist (you)

- [ ] Phase 0 done — schema locked
- [ ] Phase 1 dispatched — all 3 agents running in parallel
- [ ] Agent B CP2 verified — grounding gate drops bad quote
- [ ] A + B PRs merged to testing
- [ ] Phase 2 done — smoke test passes on localhost
- [ ] main is clean and deployable
- [ ] Phase 3 done — Zo URL live
- [ ] Demo rehearsed on public URL
- [ ] Demo JD locked
