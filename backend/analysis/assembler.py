"""Assemble a schema-valid Report from posting data and verified flags."""

from __future__ import annotations

from analysis.models import (
    Entity,
    EmployerSignal,
    Ledger,
    Overall,
    Posting,
    PostingFlag,
    Report,
    RiskBand,
)

EMPLOYER_SIGNAL_CATEGORIES = ("layoffs", "funding", "lawsuits", "reviews")


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


def _mvp_entity(posting: Posting) -> Entity:
    return Entity(
        resolved=False,
        confidence=0.0,
        canonical_name=posting.employer_name,
        domain="",
        mode="employer_unverifiable",
    )


def compute_ledger(
    posting_flags: list[PostingFlag],
    employer_signals: list[EmployerSignal],
    entity: Entity,
    queried_categories: set[str] | None = None,
) -> Ledger:
    verified = len(employer_signals)
    inferred = len(posting_flags)
    all_categories = set(EMPLOYER_SIGNAL_CATEGORIES)

    if entity.mode == "employer_unverifiable":
        no_data = len(all_categories)
    else:
        categories_queried = all_categories if queried_categories is None else queried_categories
        categories_with_signals = {signal.type for signal in employer_signals}
        empty_queried = categories_queried - categories_with_signals
        no_data = len(empty_queried)

    return Ledger(verified=verified, inferred=inferred, no_data=no_data)


def build_report(
    posting: Posting,
    posting_flags: list[PostingFlag],
    entity: Entity | None = None,
    employer_signals: list[EmployerSignal] | None = None,
) -> Report:
    resolved_entity = entity or _mvp_entity(posting)
    signals = employer_signals if employer_signals is not None else []
    ledger = compute_ledger(posting_flags, signals, resolved_entity)
    overall = Overall(
        risk_band=compute_risk_band(posting_flags),
        caveat="signals, not verdicts",
    )
    return Report(
        posting=posting,
        entity=resolved_entity,
        posting_flags=posting_flags,
        employer_signals=signals,
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
