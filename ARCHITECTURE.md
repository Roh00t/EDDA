# EDDA Architecture

**Employer Due-Diligence Agent** — paste a JD, get a trust report.

## Pipeline

```
POST /analyze
     │
     ▼
Input Handler (app.py)
  ├─ jd_text from body
  └─ source_url (optional) → fetch + strip HTML → replace jd_text
     │
     ▼
Posting Parser (analysis/parser.py)
  └─ OpenAI structured output → Posting { employer_name, role, comp_stated, requirements[] }
     │
     ▼
Entity Resolution Gate (retrieval/resolver.py)
  └─ Exa search → confidence score
     ├─ confidence ≥ 0.6 → Entity { mode: verified, domain, canonical_name }
     └─ confidence < 0.6 OR employer undisclosed → Entity { mode: employer_unverifiable }
     │
     ├──────────────────────────────────────┐
     ▼                                      ▼
POSTING-TEXT BRANCH                  WEB-SIGNALS BRANCH
(always runs, no web)                (only if mode: verified)
     │                                      │
analyzer.py                          signals.py
OpenAI → list[PostingFlag]           Exa → raw signals + source_text cache
provenance: inferred_from_posting          │
                                     Grounding Gate (analyzer.verify_quote)
                                     DETERMINISTIC PYTHON — no LLM
                                     quote ∈ source_text → keep
                                     quote ∉ source_text → drop → no_data_found
                                           │
                                     list[EmployerSignal]
                                     provenance: verified_source
     │                                      │
     └──────────────────────────────────────┘
                        │
                        ▼
              Assembler (analysis/assembler.py)
              build_report() — pure Python, no LLM
              - computes ledger counts
              - computes risk_band from flag severity
              - caveat = "signals, not verdicts" (hardcoded)
                        │
                        ▼
              Frozen Report (schema/report_schema.json)
                        │
                        ▼
              JSONResponse → frontend
```

## Two Critical Control Points

### 1. Entity Resolution Gate (front door)
Prevents wrong-entity defamation. If we can't resolve the employer with confidence ≥ 0.6, the web-signals branch never fires. Posting-text analysis always runs regardless.

### 2. Grounding Gate (wall before the schema)
`verify_quote(quote, source_text) → bool` in `analyzer.py`.
- Normalizes unicode, flattens curly quotes, collapses whitespace
- Pure substring check — no model call, no network call
- A signal that fails → dropped → counts as `no_data_found` in ledger
- This is what makes the system auditable and defamation-safe

## Component Map

```
EDDA/
├── backend/
│   ├── app.py                    # FastAPI app, input handler, static file serving
│   ├── analysis/
│   │   ├── models.py             # Pydantic models (mirrors schema/report_schema.json)
│   │   ├── parser.py             # parse_posting() → Posting
│   │   ├── analyzer.py           # analyze_posting() → list[PostingFlag]
│   │   │                         # verify_quote() — GROUNDING GATE (deterministic)
│   │   ├── assembler.py          # build_report() → Report
│   │   └── pipeline_mvp.py       # analyze(jd_text) → Report  ← entry point
│   ├── retrieval/
│   │   ├── resolver.py           # resolve_employer() → Entity
│   │   ├── signals.py            # fetch_signals() → list[EmployerSignal]
│   │   │                         # _source_text_cache (in-process grounding support)
│   │   └── r0_preflight.py       # demo company preflight (Microsoft, Shopify, Google)
│   ├── tests/
│   │   └── test_deterministic.py # 17 tests — grounding gate, risk_band, never-blank
│   └── requirements.txt
├── frontend/
│   ├── index.html                # Single page, 6 sections
│   ├── app.js                    # Fetch + render; API_URL hostname-based
│   ├── styles.css
│   └── fixtures/
│       └── mock_report.json      # Dev fixture — all 3 provenance types present
├── schema/
│   ├── report_schema.json        # IMMUTABLE CONTRACT
│   └── mock_report.json          # IMMUTABLE REFERENCE EXAMPLE
├── demo/
│   └── demo_jd.txt               # Stage demo JD (Shopify, 5 red flags)
├── Procfile                      # Zo/Render start command
├── render.yaml                   # Render auto-deploy config
├── context.md                    # Per-agent build rules (read by every agent)
└── CLAUDE.md                     # AI assistant anti-drift rules (this repo's law)
```

## Report Schema

Defined in `schema/report_schema.json`, mirrored in `backend/analysis/models.py`.

```
Report
├── posting         { employer_name, role, comp_stated, requirements[] }
├── entity          { resolved, confidence, canonical_name, domain, mode }
├── posting_flags[] { type, severity, explanation, evidence_quote, provenance }
├── employer_signals[] { type, claim, quote, source_url, provenance }
├── ledger          { verified, inferred, no_data }  ← computed in assembler
└── overall         { risk_band, caveat }            ← computed in assembler
```

**provenance enum** is the trust spine:
- `verified_source` — passed grounding gate, quote string-matches a real source
- `inferred_from_posting` — derived from JD text only, no web
- `no_data_found` — signal dropped by grounding gate or employer unverifiable

**risk_band** is computed deterministically from `posting_flags` severity counts.

## Degradation Modes

| Condition | Behaviour |
|-----------|-----------|
| OpenAI key missing / LLM error | 0 flags, risk_band=low, empty signals — valid Report |
| Exa key missing / API error | Entity unverifiable, web branch skipped — valid Report |
| Employer undisclosed in JD | entity.mode=employer_unverifiable, web branch skipped |
| Entity confidence < 0.6 | Same as above |
| Grounding gate fails a quote | Signal dropped, counted as no_data_found |

No condition produces a blank response. `pipeline_mvp.analyze()` is wrapped in try/except at every step.

## Deploy Topology

```
GitHub (main) ──→ Zo Service (primary)
                  start: uvicorn app:app --host 0.0.0.0 --port $PORT
                  cwd: backend/
                  env: OPENAI_API_KEY, EXA_API_KEY

GitHub (testing) ──→ Render Service (fallback)
                     config: render.yaml
                     env: OPENAI_API_KEY, EXA_API_KEY
```

Frontend served as StaticFiles from FastAPI — same origin as backend on both platforms.
`location.origin + "/analyze"` in app.js resolves correctly on Zo and Render.

## Key Decisions (ADRs)

1. **Deterministic pipeline over agent orchestration** — grounding gate must be auditable. An LLM-as-judge gate can be prompted around; a substring check cannot.

2. **Posting-text branch always runs** — guarantees the product never returns blank. Web signals are a bolt-on, not a co-equal core.

3. **Frozen schema from hour 0** — lets 4 components build in parallel against a mock without coordination overhead.

4. **No source_text on EmployerSignal model** — in-process cache (`_source_text_cache` in signals.py) is sufficient for single-process FastAPI. Add `source_text: str` to model if the system ever splits across services.

5. **Exa for both entity resolution and web signals** — one API key, one client, consistent results. Entity resolution uses `search_and_contents(query, num_results=5, text=False)`.
