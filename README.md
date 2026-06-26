# EDDA — Employer Due-Diligence Agent

Paste a job description → get a trust report that decodes red flags in the posting and, when the employer is verifiable, surfaces grounded employer signals from the web. Every claim is tagged `verified_source`, `inferred_from_posting`, or `no_data_found`. Framing everywhere: **signals, not verdicts.**

Host: 'Sup Hackathon. Partners: OpenAI/Codex, Exa, Cursor, Zo.

---

## Python version (locked)

- **Python `3.13`.** Everyone matches this locally. Check with `python3.13 --version`. If you don't have it, install it before anything else — a mismatched Python is the #1 "works on my machine" bug.

## Repo structure

```
EDDA/
├── README.md
├── .gitignore                # must include .env
├── .env.example
├── schema/
│   ├── report_schema.json    # THE CONTRACT — do not edit without telling the team
│   └── mock_report.json      # a valid example report
├── backend/
│   ├── app.py                # /analyze endpoint (D)
│   ├── pipeline.py           # orchestrator (D)
│   ├── analysis/             # red-flag analyzer, grounding gate, assembler (B)
│   ├── retrieval/            # Exa entity resolution + web signals (A)
│   └── requirements.txt
└── frontend/
    ├── index.html            # interactive JD + trust ledger (C)
    ├── app.js
    └── styles.css
```

---

## First-time setup — do this once, today

Run from the repo root unless told otherwise.

> **Paste safely:** when copying commands, do NOT include trailing `# ...` comments. zsh can choke on them (`zsh: unknown file attribute`) and abort the whole pasted block. Copy one command per line, comments stripped.

**1. Clone and switch to YOUR branch.** All feature branches are cut off `testing`, not `main`.

```bash
git clone <repo-url> EDDA
cd EDDA
git checkout feat/<your-area>
```

Your area is one of: `retrieval`, `analysis`, `frontend`, `deploy`.

**2. Create and activate the virtual environment.** (Isolation = every laptop behaves the same.)

**If you use Anaconda** (your prompt shows `(base)`), drop out of it first — otherwise your packages install into Anaconda base, not the project venv, and your machine silently diverges from everyone else's:

```bash
conda deactivate
```

The `(base)` prefix should disappear. Then create and activate the venv:

```bash
python3.13 -m venv .venv
source .venv/bin/activate
```

Windows (PowerShell): `.venv\Scripts\Activate.ps1`

Your prompt should now show `(.venv)`. Confirm you're pointed at the right Python before installing anything:

```bash
which python
```

This must print a path ending in `EDDA/.venv/bin/python`. If it still shows an `anaconda`/`base` path, the activation didn't take — run the `source` line again.

> **Anaconda caveat:** if a new terminal reopens in `(base)` automatically, run `conda deactivate` before `source .venv/bin/activate` each time, or disable it permanently with `conda config --set auto_activate_base false`. Keep the venv activated whenever you work.

**3. Install backend requirements.**

```bash
pip install -r backend/requirements.txt
```

**4. Set up your keys.**

```bash
cp .env.example .env
# open .env and paste YOUR OWN keys:
#   EXA_API_KEY=...
#   OPENAI_API_KEY=...
```

Then confirm `.env` is ignored — this must print nothing:

```bash
git status --porcelain | grep ".env$"
```

If it prints `.env`, STOP — `.gitignore` is wrong, fix it before committing anything.

**5. Verify your credits are non-zero.** Log into each partner dashboard and confirm a balance actually shows: **Cursor, OpenAI, Exa, Zo.** A redemption that silently failed today is an empty balance tomorrow.

---

## Running locally — USE TWO TERMINALS

`uvicorn` is a long-running, blocking process. If you run the backend and then type the curl in the **same** terminal, the curl never executes — it waits behind the server. This caused a fake "Not Found" during setup. Always use two terminals.

**Terminal 1 — backend:**

```bash
cd EDDA
source .venv/bin/activate
cd backend
uvicorn app:app --reload
```

Leave this running. You should see `Application startup complete.`

**Terminal 2 — frontend:**

```bash
cd EDDA/frontend
python3 -m http.server 5500
```

Then open **http://localhost:5500** in your browser.

---

## Smoke test — must pass before you build

This proves the whole pipe works end-to-end on your laptop. Do all four checks. With the walking skeleton, `/analyze` ignores the input and returns `mock_report.json` — that is expected.

### Check 1 — backend is up

```bash
curl localhost:8000/
```

Expect: `{"status":"ok"}` (a health route). A 404 here means `app.py` has no root route — not fatal, but check 2 is the real test.

### Check 2 — `/analyze` returns the full mock report

In **Terminal 2** (or any terminal that is NOT running uvicorn):

```bash
curl -X POST localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"jd_text":"test"}'
```

Expect: the complete `mock_report.json` JSON, starting with `{"posting":{"employer_name":"Example Corp"...` and ending with `..."caveat":"signals, not verdicts"}}`. If you get `{"detail":"Not Found"}`, the route isn't registered — open **http://127.0.0.1:8000/docs** and confirm `POST /analyze` is listed.

### Check 3 — CORS preflight passes (this is what lets the browser talk to the backend)

The browser sends an `OPTIONS` request before the real POST. If this fails, the page shows "Could not connect to backend" even though curl works.

```bash
curl -i -X OPTIONS localhost:8000/analyze \
  -H "Origin: http://localhost:5500" \
  -H "Access-Control-Request-Method: POST"
```

Expect: status `200` or `204`, and an `access-control-allow-origin` header in the response. If you get `405 Method Not Allowed`, the CORS middleware isn't active — see Troubleshooting.

### Check 4 — the frontend renders the report

Open **http://localhost:5500**. You should see the report drawn out: Posting, Entity, Posting Flags, Employer Signals, Ledger, Overall — with the `signals, not verdicts` caveat at the bottom.

### ✅ Success criteria — all four must be true

- [ ] `GET /` returns `{"status":"ok"}`
- [ ] `POST /analyze` returns the full mock report JSON
- [ ] `OPTIONS /analyze` returns `200`/`204` with an allow-origin header
- [ ] The page at `localhost:5500` renders every section of the report

When all four pass on your laptop, your environment is aligned with the team. Tell the group "smoke test green."

---

## Troubleshooting — the exact things that bit us

| Symptom | Cause | Fix |
| --- | --- | --- |
| `ERROR: [Errno 48] Address already in use` | A previous uvicorn is still on port 8000 | `pkill -f uvicorn` then restart |
| `cd: no such file or directory: backend` | You're already inside `backend/` | Don't `cd backend` again; just run `uvicorn app:app --reload` |
| curl seems to hang or returns nothing | You ran it in the same terminal as uvicorn (blocked) | Use a second terminal for curl |
| `{"detail":"Not Found"}` on `POST /analyze` | Route not registered / wrong path | Check **/docs** for the exact path; it must be `/analyze` |
| Page says "Could not connect to backend" + `OPTIONS → 405` | CORS middleware missing or the running server is stale | `grep -n CORS backend/app.py` → if absent, add the CORS block (below); then `pkill -f uvicorn` and restart |
| Preflight passes but page still can't connect | Frontend fetch URL origin mismatch | In `frontend/app.js` the URL must be exactly `http://localhost:8000/analyze`; the browser treats `localhost` and `127.0.0.1` as different origins |

CORS block (must sit right after `app = FastAPI()` in `backend/app.py`):

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # permissive for the hackathon
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Daily git workflow

`main` is always deployable (the working skeleton). `testing` is where integration happens. Never commit straight to `main`.

```bash
# start of a work session — get the latest shared code
git checkout testing
git pull origin testing
git checkout feat/<your-area>
git merge testing               # bring shared changes into your branch

# ...work, in YOUR folder only...

git add -A
git commit -m "clear, small message"
git push origin feat/<your-area>
# then open a PR: feat/<your-area> -> testing
```

- Commit **small and often**; don't save one giant merge for hour 8.
- Work **only in your assigned folder** — this keeps merge conflicts near zero.
- **Do not change `schema/report_schema.json`** without telling everyone. If it must change, B edits it on `main` and announces it.

---

## Owner map

- **A — Retrieval:** `backend/retrieval/` — Exa entity resolution + web signals
- **B — Analysis (spine):** `backend/analysis/` + `schema/` — red-flag analyzer, grounding gate, report assembler
- **C — Surface:** `frontend/` — interactive JD view + trust ledger UI
- **D — Glue + Deploy:** `backend/app.py`, `pipeline.py` — input handler, Zo deploy, Render fallback, demo machine

## Branch names

`feat/retrieval` · `feat/analysis` · `feat/frontend` · `feat/deploy` → `testing` → `main`

---

## Golden rules (don't break these)

1. **The schema is law.** Your output validates against `schema/report_schema.json`. B's Pydantic models are the machine-enforced version of it.
2. **Grounding verification is deterministic Python, never an LLM call.** A web claim renders only if its `quote` string-matches a retrieved document.
3. **Never render blank.** If retrieval or entity resolution fails, the report still returns from the posting-text analysis with `no_data_found` employer signals.
4. **Use OpenAI structured outputs** so the model returns schema-shaped objects — don't hand-parse free text.
5. **Signals, not verdicts.** Never use the words "detect", "fraud", or "verdict" in the UI.