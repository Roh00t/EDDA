"""Pydantic v2 models mirroring schema/report_schema.json."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


class Posting(BaseModel):
    employer_name: str
    role: str
    comp_stated: str | None
    requirements: list[str]


EntityMode = Literal["verified", "employer_unverifiable"]


class Entity(BaseModel):
    resolved: bool
    confidence: float
    canonical_name: str
    domain: str
    mode: EntityMode


FlagType = Literal[
    "scope_creep",
    "vague_responsibilities",
    "comp_red_flag",
    "unrealistic_requirements",
    "urgency_pressure",
    "ghost_job_language",
]

FlagSeverity = Literal["low", "medium", "high"]
FlagProvenance = Literal["inferred_from_posting"]


class PostingFlag(BaseModel):
    type: FlagType
    severity: FlagSeverity
    explanation: str
    evidence_quote: str
    provenance: FlagProvenance


EmployerSignalType = Literal["layoffs", "funding", "lawsuits", "reviews"]
EmployerSignalProvenance = Literal["verified_source"]


class EmployerSignal(BaseModel):
    type: EmployerSignalType
    claim: str
    quote: str
    source_url: HttpUrl
    provenance: EmployerSignalProvenance


class Ledger(BaseModel):
    verified: int
    inferred: int
    no_data: int


RiskBand = Literal["low", "elevated", "high"]


class Overall(BaseModel):
    risk_band: RiskBand
    caveat: Literal["signals, not verdicts"] = Field(default="signals, not verdicts")


class Report(BaseModel):
    posting: Posting
    entity: Entity
    posting_flags: list[PostingFlag]
    employer_signals: list[EmployerSignal]
    ledger: Ledger
    overall: Overall


def _assert_mock_report_parses() -> Report:
    schema_dir = Path(__file__).resolve().parent.parent.parent / "schema"
    mock_path = schema_dir / "mock_report.json"
    with mock_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return Report.model_validate(data)


if __name__ == "__main__":
    report = _assert_mock_report_parses()
    print("mock_report.json parsed successfully into Report")
    print(report.model_dump_json(indent=2))
