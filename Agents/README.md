# EDDA — Agent Orchestration Plan

**Goal:** Build all 4 components in parallel using Claude Code sub-agents. You are the orchestrator.

## Phase Map

```
Phase 0 — SEQUENTIAL (blocks everything)
  └─ Schema Agent: confirm schema/report_schema.json + mock_report.json are locked

Phase 1 — PARALLEL (dispatch all 3 simultaneously)
  ├─ Agent A: backend/retrieval/ — Exa entity resolver + web signals
  ├─ Agent B: backend/analysis/ — red-flag analyzer + grounding gate  ⭐ CRITICAL PATH
  └─ Agent C: frontend/         — JD input UI + trust ledger rendering

Phase 2 — SEQUENTIAL (after A + B merge to testing)
  └─ Agent D: backend/app.py — wire real components, integration smoke test

Phase 3 — SEQUENTIAL (after smoke test passes)
  └─ Deploy Agent: Zo primary + Render fallback
```

## Dispatch Commands (Claude Code)

**Phase 1 — all three in one message:**
```
Agent(prompt=open("Agents/01-retrieval-agent.md").read())
Agent(prompt=open("Agents/02-analysis-agent.md").read())
Agent(prompt=open("Agents/03-frontend-agent.md").read())
```

**Phase 2 — after A+B merge:**
```
Agent(prompt=open("Agents/04-glue-agent.md").read())
```

**Phase 3 — after smoke test:**
```
Agent(prompt=open("Agents/05-deploy-agent.md").read())
```

## Handoff Protocol

- Each agent branches off `testing`, commits small, opens PR into `testing`.
- Handoff signal = PR merged to `testing`.
- Orchestrator checks `testing` before firing Phase 2.

## Red-Team Strike List (fix before dispatching)

1. **Scope bleed** — agents must NOT touch files outside their folder. `analysis/models.py` and `app.py` are owned by B and D respectively. Any agent that edits outside scope = stop and report.
2. **Grounding gate orphan** — deterministic quote-verification lives in `backend/analysis/assembler.py`. Agent B owns it. Confirm it ships before Phase 2 fires.
3. **Exa rate limits** — Agent A can fail silently. `pipeline_mvp.py` already degrades gracefully; confirm Agent D's smoke test verifies degraded mode too.
4. **No-blank contract** — every phase must verify the pipeline never returns an empty report. Test with a JD that has `employer_name: undisclosed`.

## Karpathy Success Criteria (per phase)

| Phase | Done when |
|-------|-----------|
| 0 | `schema/report_schema.json` unchanged, `schema/mock_report.json` validates against it |
| 1A | `resolve_employer("Google")` returns `mode: verified`, confidence ≥ 0.6 |
| 1B | `analyze_posting(SAMPLE_JD)` returns ≥ 1 flag, grounding gate drops a bad quote |
| 1C | Pasting a JD renders all schema sections; `no_data_found` shows gracefully |
| 2 | `POST /analyze` with real JD returns valid Report JSON, smoke test passes |
| 3 | Public Zo URL returns non-blank report for demo JD |
