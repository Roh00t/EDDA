"""Extract structured posting fields from raw job-description text."""

from __future__ import annotations

import os

from dotenv import load_dotenv
from openai import OpenAI

from analysis.models import Posting

load_dotenv()

PARSER_MODEL = os.getenv("EDDA_PARSER_MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = """\
Extract structured fields from the job description text.

Rules:
- employer_name: company or hiring org name; use "undisclosed" if not stated
- role: job title
- comp_stated: salary/compensation text exactly as stated, or null if absent
- requirements: list of individual requirement bullets or sentences
"""


def parse_posting(jd_text: str) -> Posting:
    client = OpenAI()
    completion = client.chat.completions.parse(
        model=PARSER_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": jd_text},
        ],
        response_format=Posting,
    )
    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI returned no parsed posting")
    return parsed


if __name__ == "__main__":
    SAMPLE_JD = """\
Senior Full Stack Engineer — Acme Analytics

Location: Remote (US)

About Acme Analytics
We're a fast-growing data platform startup helping enterprises turn raw telemetry into actionable insights.

The Role
We're looking for a Senior Full Stack Engineer to join our core product team. You'll work across the stack — from React dashboards to Python microservices — and partner closely with product and design.

Responsibilities
- Design and build scalable APIs in Python (FastAPI)
- Own frontend features in React and TypeScript
- Mentor junior engineers and lead architecture discussions
- Participate in on-call rotation (1 week per month)

Requirements
- 5+ years of professional software engineering experience
- Strong Python and modern JavaScript/TypeScript
- Experience with cloud infrastructure (AWS or GCP)
- Excellent written and verbal communication

Nice to have
- Experience with data pipelines or analytics products
- Prior startup experience

Compensation
Base salary: $145,000 - $175,000 depending on experience, plus equity and full benefits.

We are an equal opportunity employer.
"""

    posting = parse_posting(SAMPLE_JD)
    print(posting.model_dump_json(indent=2))
