# Deploy Agent — Task 3 Report

**STATUS: DONE_WITH_CONCERNS**

---

## Procfile + render.yaml — Verification

### Procfile (`D:/Projects/EDDA/Procfile`)

```
web: cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Verdict: CORRECT.** No changes made.
- Uses `cd backend &&` to set working directory before invoking uvicorn.
- `app:app` correctly references `backend/app.py` → FastAPI `app` instance.
- `--host 0.0.0.0 --port $PORT` satisfies both Zo and Render's dynamic port injection.

### render.yaml (`D:/Projects/EDDA/render.yaml`)

```yaml
services:
  - type: web
    name: edda
    runtime: python
    region: singapore
    branch: testing
    buildCommand: pip install -r backend/requirements.txt
    startCommand: cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: EXA_API_KEY
        sync: false
```

**Verdict: CORRECT.** No changes made.
- `branch: testing` matches the integration branch.
- `buildCommand` correctly references `backend/requirements.txt` from repo root.
- `startCommand` is consistent with Procfile.
- `envVars` with `sync: false` means both keys must be set manually in Render dashboard — correct, no secrets in code.
- `region: singapore` — note: Exa API latency will be lowest from Singapore.

---

## frontend/app.js — API_URL update

**Before:**
```js
const API_URL = "http://localhost:8000/analyze";
```

**After:**
```js
const _isLocal =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
const API_URL = _isLocal
  ? "http://localhost:8000/analyze"
  : location.origin + "/analyze";
```

**How it works:**
- Local dev (`localhost` or `127.0.0.1`): points to `http://localhost:8000/analyze` — unchanged behavior, no CORS issues.
- Production (any other hostname, e.g. Zo or Render): uses `location.origin + "/analyze"` — picks up whatever domain the frontend is served from and appends `/analyze`. This works without hardcoding the URL.

**Assumption:** The frontend and backend are served from the same origin in production (which is the case for a single FastAPI service serving both the API and static files, or if Zo/Render routes both under one domain). If they end up on separate origins, swap `location.origin` for the explicit backend URL.

---

## demo/demo_jd.txt — Contents

```
Software Engineer — Shopify (Remote)

We're scaling fast and need someone who can hit the ground running — ideally starting within the next two weeks.

Responsibilities:
- Own full-stack features across web, mobile, and data pipelines
- Lead architecture decisions and mentor junior engineers
- Collaborate with design, product, and ML teams on cross-functional initiatives
- On-call rotation for production incidents

Requirements:
- 8+ years of experience (this is a mid-level role)
- Proficiency in Ruby, Go, React, TypeScript, Kafka, Kubernetes, and Postgres
- Prior experience with payments infrastructure preferred

Compensation: Competitive. Details discussed at offer stage.

Note: We receive a high volume of applications. Only shortlisted candidates will be contacted. Role may be filled at any time — apply immediately.
```

**Word count:** ~130 words. Well under the 200-word limit.

**Red flags embedded (5 total):**

1. **Unrealistic requirements** — "8+ years of experience (this is a mid-level role)" — experience mismatch is explicit.
2. **Scope creep** — "Own full-stack features across web, mobile, and data pipelines" + "Lead architecture decisions and mentor junior engineers" for a single mid-level role.
3. **Undisclosed comp** — "Competitive. Details discussed at offer stage." — classic comp red flag.
4. **Urgency pressure** — "hit the ground running — ideally starting within the next two weeks."
5. **Ghost job language** — "Role may be filled at any time — apply immediately" + "Only shortlisted candidates will be contacted."

**Employer:** Shopify — recognizable brand from the hardcoded demo set (Microsoft, Shopify, Google), will trigger the Exa retrieval path.

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/app.js` | Line 1: hostname-based API_URL fallback (5 lines replacing 1) |
| `demo/demo_jd.txt` | Created — stage demo JD for Shopify |
| `.superpowers/sdd/task-3-report.md` | Created — this report |

**Procfile** — no changes (was correct)
**render.yaml** — no changes (was correct)

**Commit hash:** see git log after commit on `feat/deploy` branch.

---

## Manual Steps for Zo Deploy

1. Go to the Zo dashboard and create a new **Service** (not a Site).
2. Connect the GitHub repo, select branch `testing` (or `main` after merge).
3. Set **Working Directory** to `backend/` (or leave root and use the start command as-is — the `cd backend &&` prefix handles it).
4. Set **Start Command** to: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in the Zo dashboard:
   - `OPENAI_API_KEY` — value from team's `.env`
   - `EXA_API_KEY` — value from team's `.env`
6. Deploy and hit `GET <zo-url>/` — confirm `{"status": "ok"}`.
7. Smoke test: `curl -X POST <zo-url>/analyze -H "Content-Type: application/json" -d '{"jd_text":"Software Engineer at Google. Must know 15 technologies."}'` — confirm HTTP 200 and `posting_flags` not empty.

**For Render:** auto-deploys from `testing` branch are already wired via `render.yaml`. Push to `testing` and Render picks it up automatically. Set env vars in Render dashboard before first deploy.

---

## Concerns

1. **`uvloop` in requirements.txt** — `uvloop==0.22.1` is Linux-only. On Windows dev machines this will error at install time. Render (Linux) will be fine. Zo should be fine if it runs Linux containers. If Zo runs Windows — unlikely but possible — `uvloop` will fail to install. Mitigation: add `--ignore-installed uvloop` or make it optional. Not changed here as it's backend/ scope.

2. **`pyspark` in requirements.txt** — `pyspark==4.0.0` and related packages appear unused by the EDDA pipeline. These add ~500 MB to the install. This will make Render/Zo builds slow and may hit memory limits. Not changed here (backend/ scope), but flag for the team.

3. **Frontend/backend same-origin assumption** — The `location.origin + "/analyze"` approach only works if the frontend is served from the same domain as the backend. If they're on separate subdomains or separate services, you'll need to update `app.js` with the explicit backend URL once it's known.

4. **CORS wildcard** — `app.py` uses `allow_origins=["*"]` which is fine for a hackathon but worth noting.
