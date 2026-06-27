from __future__ import annotations

import os
import re
from dataclasses import dataclass

from exa_py import Exa

from analysis.analyzer import verify_quote
from analysis.models import EmployerSignal, Entity


SIGNAL_TYPES = ("layoffs", "funding", "lawsuits", "reviews")


@dataclass(frozen=True)
class RetrievedDoc:
    url: str
    text: str


@dataclass(frozen=True)
class SignalDraft:
    type: str
    claim: str
    quote: str
    source_url: str


def _load_env() -> None:
    for path in (".env", "backend/.env"):
        try:
            with open(path, encoding="utf-8") as env_file:
                for raw_line in env_file:
                    line = raw_line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
        except FileNotFoundError:
            continue


def _exa_client() -> Exa:
    _load_env()
    api_key = os.getenv("EXA_API_KEY") or os.getenv("EXA_KEY")
    if not api_key:
        raise RuntimeError("Missing EXA_API_KEY/EXA_KEY in environment")
    return Exa(api_key)


def _result_text(result) -> str:
    return getattr(result, "text", None) or ""


def _result_url(result) -> str:
    return getattr(result, "url", None) or ""


def _sentence_with(text: str, terms: tuple[str, ...], required_terms: tuple[str, ...]) -> str | None:
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        cleaned = " ".join(sentence.split())
        lowered = cleaned.lower()
        has_signal_term = any(term in lowered for term in terms)
        has_required_term = any(term in lowered for term in required_terms)
        if 40 <= len(cleaned) <= 320 and has_signal_term and has_required_term:
            return cleaned
    return None


def _claim_from_quote(signal_type: str, quote: str) -> str:
    if signal_type == "layoffs":
        return quote
    if signal_type == "funding":
        return quote
    if signal_type == "lawsuits":
        return quote
    return quote


def _drafts_for_doc(doc: RetrievedDoc, company_terms: tuple[str, ...] = ()) -> list[SignalDraft]:
    checks = {
        "layoffs": ("layoff", "lay off", "job cut", "cuts jobs", "retrench"),
        "funding": ("raises", "raised", "funding round", "fundraise", "series a", "series b", "series c"),
        "lawsuits": ("lawsuit", "class action", "settlement", "securities fraud", "litigation"),
        "reviews": ("glassdoor", "employee review", "employee reviews", "rated by employees"),
    }
    required_terms = tuple(term.lower() for term in company_terms if term) or ("",)
    drafts: list[SignalDraft] = []
    for signal_type, terms in checks.items():
        quote = _sentence_with(doc.text, terms, required_terms)
        if quote:
            drafts.append(
                SignalDraft(
                    type=signal_type,
                    claim=_claim_from_quote(signal_type, quote),
                    quote=quote,
                    source_url=doc.url,
                )
            )
    return drafts


def retrieve_signal_docs(entity: Entity, num_results: int = 3) -> list[RetrievedDoc]:
    if entity.mode != "verified" or not entity.resolved:
        return []

    query = f"{entity.canonical_name} layoffs OR funding OR lawsuit OR reviews 2025 2026"
    response = _exa_client().search_and_contents(query, num_results=num_results, text=True)
    docs = []
    for result in getattr(response, "results", []) or []:
        url = _result_url(result)
        text = _result_text(result)
        if url and text:
            docs.append(RetrievedDoc(url=url, text=text))
    return docs


def verified_signals_from_docs(docs: list[RetrievedDoc]) -> list[EmployerSignal]:
    drafts: list[SignalDraft] = []
    for doc in docs:
        drafts.extend(_drafts_for_doc(doc))
    return verified_signals_from_drafts(docs, drafts)


def verified_signals_from_docs_for_entity(
    entity: Entity, docs: list[RetrievedDoc]
) -> list[EmployerSignal]:
    company_terms = tuple(
        term.lower()
        for term in (entity.canonical_name, entity.domain.split(".")[0])
        if term
    )
    drafts: list[SignalDraft] = []
    for doc in docs:
        drafts.extend(_drafts_for_doc(doc, company_terms))
    return verified_signals_from_drafts(docs, drafts)


def verified_signals_from_drafts(
    docs: list[RetrievedDoc], drafts: list[SignalDraft]
) -> list[EmployerSignal]:
    retrieved_urls = {doc.url for doc in docs}
    text_by_url = {doc.url: doc.text for doc in docs}
    signals: list[EmployerSignal] = []

    for draft in drafts:
        if draft.source_url not in retrieved_urls:
            continue
        if draft.type not in SIGNAL_TYPES:
            continue
        if not verify_quote(draft.quote, text_by_url[draft.source_url]):
            continue
        signals.append(
            EmployerSignal(
                type=draft.type,
                claim=draft.claim,
                quote=draft.quote,
                source_url=draft.source_url,
                provenance="verified_source",
            )
        )
    return signals


def fetch_signals(entity: Entity) -> list[EmployerSignal]:
    docs = retrieve_signal_docs(entity)
    return verified_signals_from_docs_for_entity(entity, docs)
