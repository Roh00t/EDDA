You are building ONE component of a team project: an employer / job-posting due-diligence tool. A user pastes a job description; the app returns a trust report that (a) decodes red flags in the posting and (b) when the employer can be verified, surfaces grounded employer signals from the web. Every claim carries a `provenance` tag: `verified_source`, `inferred_from_posting`, or `no_data_found`.

**Stack:** Python 3.13 + FastAPI backend, vanilla JS frontend. No React, no TypeScript, no npm. Use `pip install --break-system-packages`.

**THE CONTRACT IS LAW.** `schema/report_schema.json` defines the report shape; `schema/mock_report.json` is a valid example. Your output MUST validate against the schema. Do NOT edit the schema. If you think it must change, STOP and report — do not change it yourself.

**Non-negotiable rules:**

1. Grounding verification is deterministic Python, NEVER an LLM call. A claim is valid only if its `quote` string-matches text actually present in a source you hold.
2. The product must NEVER render blank. If anything fails, degrade to the posting-text analysis, which never depends on the web.
3. Use OpenAI structured outputs / function calling so the model returns schema-shaped JSON objects — do not hand-parse free text.
4. Work ONLY in your assigned folder. Branch off `testing`, commit small and often, PR into `testing`.

**STOP-AND-REPORT:** at each checkpoint, stop, print the exact output, and wait for my confirmation against the schema before continuing. Do not proceed past a checkpoint on your own. Do not start the next checkpoint's work early.
