"""Assemble a schema-valid Report from posting data and verified flags."""

from __future__ import annotations

from analysis.models import Entity, Ledger, Overall, Posting, PostingFlag, Report, RiskBand

EMPLOYER_SIGNAL_CATEGORIES = 4  # layoffs, funding, lawsuits, reviews


def compute_risk_band(flags: list[PostingFlag]) -> RiskBand:
    high = sum(1 for f in flags if f.severity == "high")
    med = sum(1 for f in flags if f.severity == "medium")
    total = len(flags)

    if high >= 2 or (high >= 1 and med >= 1):
        return "high"
    if high >= 1 or med >= 2 or total >= 3:
        return "elevated"
    if total >= 1:
        return "elevated" if med else "low"
    return "low"


def build_report(posting: Posting, posting_flags: list[PostingFlag]) -> Report:
    entity = Entity(
        resolved=False,
        confidence=0.0,
        canonical_name=posting.employer_name,
        domain="",
        mode="employer_unverifiable",
    )
    ledger = Ledger(
        verified=0,
        inferred=len(posting_flags),
        no_data=EMPLOYER_SIGNAL_CATEGORIES,
    )
    overall = Overall(
        risk_band=compute_risk_band(posting_flags),
        caveat="signals, not verdicts",
    )
    return Report(
        posting=posting,
        entity=entity,
        posting_flags=posting_flags,
        employer_signals=[],
        ledger=ledger,
        overall=overall,
    )


if __name__ == "__main__":
    from analysis.analyzer import SAMPLE_JD, analyze_posting
    from analysis.parser import parse_posting

    posting = parse_posting(SAMPLE_JD)
    flags = analyze_posting(SAMPLE_JD)
    report = build_report(posting, flags)

    print(f"risk_band: {report.overall.risk_band}")
    print(f"ledger: verified={report.ledger.verified}, "
          f"inferred={report.ledger.inferred}, no_data={report.ledger.no_data}")
    print()
    print(report.model_dump_json(indent=2))
