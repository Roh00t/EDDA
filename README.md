# EDDA

Employer Due-Diligence Agent

## Python version

- Locked Python version: `3.13`
- Everyone must match this version locally and in CI.

## Repo structure

```
EDDA/
├── README.md
├── .gitignore
├── .env.example
├── schema/
│   ├── report_schema.json
│   └── mock_report.json
├── backend/
│   ├── app.py
│   ├── pipeline.py
│   ├── analysis/
│   ├── retrieval/
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── app.js
    └── styles.css
```

## Run commands

1. Create venv and activate:

```bash
python3.13 -m venv .venv
source .venv/bin/activate
```

2. Install backend requirements:

```bash
pip install -r backend/requirements.txt
```

3. Start backend:

```bash
cd backend
uvicorn app:app --reload
```

4. Start frontend:

```bash
cd frontend
python3 -m http.server 5500
```

5. Smoke test:

```bash
curl -X POST localhost:8000/analyze -H "Content-Type: application/json" -d '{"jd_text":"test"}'
```

## Owner map

- A — Retrieval: `backend/retrieval/` and Exa integration
- B — Analysis: `backend/analysis/`, schema, grounding gate, report assembler
- C — Surface: `frontend/`, UI and report rendering
- D — Glue + Deploy: `backend/app.py`, Zo deploy, Render fallback

## Branch names

- `feat/retrieval`
- `feat/analysis`
- `feat/frontend`
- `feat/deploy`

## Environment

Copy `.env.example` to `.env` and add your partner keys locally. Do not commit `.env`.
