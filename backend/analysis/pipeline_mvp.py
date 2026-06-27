"""MVP analysis pipeline: parse → flag → assemble, never blank."""

from __future__ import annotations

import logging

from analysis.analyzer import analyze_posting
from analysis.assembler import build_report
from analysis.models import Posting, Report
from analysis.parser import parse_posting

log = logging.getLogger("edda")


def _fallback_posting() -> Posting:
    return Posting(
        employer_name="undisclosed",
        role="unknown",
        comp_stated=None,
        requirements=[],
    )


def analyze(jd_text: str) -> Report:
    posting = _fallback_posting()
    flags = []

    try:
        posting = parse_posting(jd_text)
    except Exception:
        log.exception("parse_posting failed — returning fallback posting")

    try:
        flags = analyze_posting(jd_text)
    except Exception:
        log.exception("analyze_posting failed — returning zero flags")

    return build_report(posting, flags)


if __name__ == "__main__":
    import os

    from analysis.analyzer import SAMPLE_JD

    print("=== analyze() with valid API key ===")
    report = analyze(SAMPLE_JD)
    print(f"flags: {len(report.posting_flags)}, risk_band: {report.overall.risk_band}")
    print(report.model_dump_json(indent=2))

    print("\n=== analyze() with broken API key ===")
    os.environ["OPENAI_API_KEY"] = "sk-invalid-key-for-testing"
    broken_report = analyze(SAMPLE_JD)
    print(f"flags: {len(broken_report.posting_flags)}, risk_band: {broken_report.overall.risk_band}")
    print(broken_report.model_dump_json(indent=2))
