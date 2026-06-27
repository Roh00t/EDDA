"""Extract and verify posting red flags from job-description text."""

from __future__ import annotations

import os
import re
import unicodedata

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel, Field

from analysis.models import FlagSeverity, FlagType, PostingFlag

load_dotenv()

ANALYZER_MODEL = os.getenv("EDDA_ANALYZER_MODEL", "gpt-4o")

FLAG_TYPES = (
    "scope_creep",
    "vague_responsibilities",
    "comp_red_flag",
    "unrealistic_requirements",
    "urgency_pressure",
    "ghost_job_language",
)

SYSTEM_PROMPT = f"""\
Analyze the job description for red flags. Return up to 8 flags.

Allowed flag types only: {", ".join(FLAG_TYPES)}

For each flag provide:
- type: one of the allowed types
- severity: low, medium, or high — calibrate carefully; do not mark everything high
- explanation: brief reason this is a concern
- evidence_quote: a VERBATIM span copied exactly from the job description

Rules:
- evidence_quote MUST appear word-for-word in the input text (same words, minor whitespace ok)
- only flag genuine concerns supported by the text
- prefer fewer, well-calibrated flags over padding the list
"""


class FlagDraft(BaseModel):
    type: FlagType
    severity: FlagSeverity
    explanation: str
    evidence_quote: str


class PostingFlagsResponse(BaseModel):
    flags: list[FlagDraft] = Field(max_length=8)


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = (
        text.replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2013", "-")
        .replace("\u2014", "-")
    )
    return re.sub(r"\s+", " ", text).strip().lower()


def verify_quote(quote: str, jd_text: str) -> bool:
    return _normalize(quote) in _normalize(jd_text)


def _filter_verified_flags(flags: list[PostingFlag], jd_text: str) -> list[PostingFlag]:
    return [flag for flag in flags if verify_quote(flag.evidence_quote, jd_text)]


def analyze_posting(jd_text: str) -> list[PostingFlag]:
    client = OpenAI()
    completion = client.chat.completions.parse(
        model=ANALYZER_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": jd_text},
        ],
        response_format=PostingFlagsResponse,
    )
    parsed = completion.choices[0].message.parsed
    if parsed is None:
        return []

    flags = [
        PostingFlag(
            type=draft.type,
            severity=draft.severity,
            explanation=draft.explanation,
            evidence_quote=draft.evidence_quote,
            provenance="inferred_from_posting",
        )
        for draft in parsed.flags[:8]
    ]
    return _filter_verified_flags(flags, jd_text)


SAMPLE_JD = """\
Marketing Coordinator — BrightPath Solutions

Location: Hybrid (NYC)

About the Role
BrightPath Solutions is seeking a versatile Marketing Coordinator who can wear many hats in our lean team.

Responsibilities
- Manage social media, email campaigns, and brand strategy end-to-end
- Design landing pages, write ad copy, and run paid acquisition campaigns
- Support sales with lead qualification and occasional client calls
- Handle miscellaneous tasks as needed to keep the team moving

Requirements
- 2-3 years of marketing experience
- Proficiency in Adobe Creative Suite, HubSpot, Google Analytics, and basic HTML/CSS
- Must be a self-starter comfortable with ambiguity
- Bachelor's degree required

Other Details
- Competitive compensation based on experience (salary not disclosed)
- We need someone who can hit the ground running — ideal start date is ASAP
- This posting has been open for 8 months; we review applications on a rolling basis
"""


if __name__ == "__main__":
    print("=== analyze_posting on sample JD ===")
    flags = analyze_posting(SAMPLE_JD)
    for i, flag in enumerate(flags, 1):
        print(f"\nFlag {i}:")
        print(flag.model_dump_json(indent=2))

    print("\n=== verify_quote red-team demo ===")
    fabricated = PostingFlag(
        type="comp_red_flag",
        severity="high",
        explanation="Fabricated: claims no equity offered.",
        evidence_quote="We offer zero equity and below-market pay with no benefits.",
        provenance="inferred_from_posting",
    )
    mixed = flags + [fabricated]
    print(f"Before filter: {len(mixed)} flags")
    print(f"  Fabricated quote verified? {verify_quote(fabricated.evidence_quote, SAMPLE_JD)}")

    verified = _filter_verified_flags(mixed, SAMPLE_JD)
    print(f"After filter:  {len(verified)} flags (fabricated dropped)")
    for flag in verified:
        print(f"  - [{flag.severity}] {flag.type}: {flag.evidence_quote[:60]}...")
