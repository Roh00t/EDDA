# Deploy Agent — Phase 3

**Role:** Ship to Zo (primary) + Render (fallback).

**Scope:** Deploy config files only. Do NOT touch `backend/` Python code or `frontend/` JS.

**Branch:** `feat/deploy` → PR into `testing` → merge to `main` → deploy triggers.

**Prerequisite:** Integration smoke test (Agent D, CP2 + CP3) must be confirmed first.

## Context

Codebase: `D:/Projects/EDDA`
Deploy targets:
- **Zo** (primary): FastAPI *Service* — NOT a React Site. Runs `uvicorn app:app`.
- **Render** (fallback): auto-deploys from `testing` branch. `render.yaml` already exists.

Key files — read before touching:
- `Procfile` — `web: uvicorn app:app --host 0.0.0.0 --port $PORT`
- `render.yaml` — Render service config
- `backend/requirements.txt`
- `.env.example` — shows required env vars

## Tasks

### Task 1 — Verify Procfile and render.yaml
Confirm `Procfile` runs uvicorn from `backend/` directory with `$PORT`.
Confirm `render.yaml` points to `testing` branch and `backend/` as root.

Fix any path issues. Do NOT change the FastAPI code.

**CP1:** Print Procfile + render.yaml contents. Wait for confirmation.

### Task 2 — Zo deploy
Deploy the FastAPI backend to Zo as a Service.
Set env vars in Zo dashboard:
- `OPENAI_API_KEY` (from team keys)
- `EXA_API_KEY` (from team keys)

Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
Working directory: `backend/`

**CP2:** Hit `GET <zo-public-url>/` → confirm `{"status": "ok"}`. Print the URL. Wait for confirmation.

### Task 3 — Smoke test on Zo public URL
```bash
curl -X POST <zo-public-url>/analyze \
  -H "Content-Type: application/json" \
  -d '{"jd_text":"Software Engineer at Google. Must know 15 technologies."}'
```

Confirm: HTTP 200, valid JSON, `posting_flags` not empty.

**CP3:** Print response + URL. Wait for confirmation.

### Task 4 — Render fallback
Confirm Render auto-deploy from `testing` is active.
Hit `GET <render-url>/` → `{"status": "ok"}`.

**CP4:** Print Render URL. Wait for confirmation.

### Task 5 — Update frontend API URL
Update `frontend/app.js` to point to the Zo public URL (not localhost) for production.
Keep localhost as a fallback for local dev.

**CP5:** Show the fetch() call in app.js with the Zo URL. Wait for confirmation.

## Done When

- Zo public URL returns `{"status":"ok"}` on GET `/`
- Zo smoke test passes (`/analyze` returns valid report)
- Render fallback live
- Frontend points to Zo URL
- PR merged to `testing`, then `main`

## Karpathy Rules

- Env vars go in the platform dashboard. Never commit API keys.
- If Zo deploy fails → flip to Render immediately, don't debug Zo for >10 min during hackathon.
- Render is already wired via render.yaml. Zo is the only unknown — pre-check Zo docs before demo day.
