# EDDA Agent Orchestration Design

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development`.

**What:** 5 parallel Claude Code sub-agents build all EDDA components simultaneously. Orchestrator (you) coordinates phases and integration.

**Why:** 10-hour hackathon. Sequential build = 4× slower. Parallel agents on independent scopes = demo-ready in time.

## Architecture

3 phases. Phase 0 blocks Phase 1. Phase 1 (A+B) blocks Phase 2. Phase 2 blocks Phase 3.

```
Phase 0: Schema Agent          — locks schema/report_schema.json + mock
Phase 1: Agent A (retrieval)   — backend/retrieval/ (Exa)
         Agent B (analysis)    — backend/analysis/ (red-flags + grounding gate) ⭐ CRITICAL
         Agent C (frontend)    — frontend/ (UI + trust ledger)
Phase 2: Agent D (glue)        — backend/app.py integration + smoke test
Phase 3: Deploy Agent          — Zo primary + Render fallback
```

## Contracts (never break)

- `schema/report_schema.json` — immutable during build. No agent edits it.
- `backend/analysis/models.py` — Pydantic source of truth. Only B can propose changes; orchestrator approves.
- `context.md` — rules every agent must follow. Each prompt references it.
- Grounding gate = deterministic Python only. No LLM call inside the gate.
- Pipeline never returns blank. Degrades to posting-text analysis if web fails.

## Scope Map (hard boundaries)

| Agent | Owns | Must NOT touch |
|-------|------|----------------|
| Schema | schema/ | everything else |
| A | backend/retrieval/ | app.py, analysis/, frontend/ |
| B | backend/analysis/ | app.py, retrieval/, frontend/ |
| C | frontend/ | backend/ |
| D | backend/app.py | analysis/, retrieval/, frontend/ |
| Deploy | Procfile, render.yaml | Python code, JS |

## Red-Team Strikes (mitigated)

1. Scope bleed → each agent prompt has explicit "Do NOT touch" list
2. Grounding gate orphan → Agent B owns it, CP2 verifies it drops bad quotes
3. Exa failure → pipeline_mvp degrades gracefully; Agent D verifies degraded mode
4. Never-blank → every agent has a no-blank checkpoint
