"""Regression locks for EDDA's deterministic pieces.  Run: cd backend && pytest -q"""

from analysis.analyzer import verify_quote
from analysis.assembler import build_report
from analysis.models import Posting, PostingFlag, Report


def _posting():
    return Posting(employer_name="X", role="Y", comp_stated=None, requirements=[])


def _flag(severity):
    return PostingFlag(
        type="scope_creep",
        severity=severity,
        explanation="e",
        evidence_quote="q",
        provenance="inferred_from_posting",
    )


# --- verify_quote ---


def test_quote_exact():
    assert verify_quote("own product strategy", "You will own product strategy here.") is True


def test_quote_case_insensitive():
    assert verify_quote("OWN PRODUCT", "we own product lines") is True


def test_quote_whitespace_collapsed():
    assert verify_quote("wear many hats", "wear   many\n  hats in a lean team") is True


def test_quote_rejects_fabrication():
    assert verify_quote("below-market pay with no benefits", "Competitive salary.") is False


def test_quote_curly_apostrophe_still_matches():
    assert verify_quote("we\u2019ll move fast", "We'll move fast and break things.") is True


# --- risk_band, tested through build_report (public behaviour) ---


def test_band_low_no_flags():
    assert build_report(_posting(), []).overall.risk_band == "low"


def test_band_elevated_single_high():
    assert build_report(_posting(), [_flag("high")]).overall.risk_band == "elevated"


def test_band_elevated_three_medium():
    assert build_report(_posting(), [_flag("medium")] * 3).overall.risk_band == "elevated"


def test_band_high_two_high():
    assert build_report(_posting(), [_flag("high"), _flag("high")]).overall.risk_band == "high"


def test_three_low_flags_not_low():
    assert build_report(_posting(), [_flag("low")] * 3).overall.risk_band == "elevated"


def test_two_low_one_medium_not_low():
    assert (
        build_report(_posting(), [_flag("low"), _flag("low"), _flag("medium")]).overall.risk_band
        == "elevated"
    )


# --- failure path must produce a schema-valid Report with a complete entity ---


def test_failure_path_returns_valid_report(monkeypatch):
    import analysis.pipeline_mvp as p

    def boom(*a, **k):
        raise RuntimeError("simulated API failure")

    monkeypatch.setattr(p, "parse_posting", boom)
    monkeypatch.setattr(p, "analyze_posting", boom)

    report = p.analyze("any jd text")
    assert isinstance(report, Report)
    assert report.entity.mode == "employer_unverifiable"
    assert report.entity.resolved is False
    assert report.posting_flags == []
    assert report.overall.risk_band == "low"
    Report.model_validate(report.model_dump(mode="json"))
