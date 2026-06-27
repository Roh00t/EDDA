from __future__ import annotations

from urllib.parse import urlparse

from analysis.models import Entity
from retrieval.signals import _exa_client


GENERIC_DOMAINS = {
    "linkedin.com",
    "facebook.com",
    "instagram.com",
    "wikipedia.org",
    "crunchbase.com",
    "glassdoor.com",
    "indeed.com",
}


def _domain(url: str) -> str:
    host = urlparse(url).netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    return host


def _clean_name(name: str) -> str:
    return " ".join(name.split()).strip()


def _confidence(employer_name: str, title: str, domain: str, rank: int) -> float:
    name_tokens = [token for token in employer_name.lower().split() if len(token) > 2]
    title_l = title.lower()
    domain_l = domain.lower()
    score = 0.35
    if name_tokens and any(token in domain_l for token in name_tokens):
        score += 0.35
    if name_tokens and any(token in title_l for token in name_tokens):
        score += 0.2
    if domain_l not in GENERIC_DOMAINS:
        score += 0.1
    if rank == 0:
        score += 0.05
    return min(score, 0.95)


def resolve_employer(employer_name: str, hints: dict | None = None) -> Entity:
    name = _clean_name(employer_name)
    if not name or name.lower() == "undisclosed":
        return Entity(
            resolved=False,
            confidence=0.0,
            canonical_name=name or "undisclosed",
            domain="",
            mode="employer_unverifiable",
        )

    query = f"{name} official website company"
    response = _exa_client().search_and_contents(query, num_results=5, text=False)
    best: tuple[float, str, str] | None = None

    for rank, result in enumerate(getattr(response, "results", []) or []):
        url = getattr(result, "url", "") or ""
        title = getattr(result, "title", "") or ""
        domain = _domain(url)
        if not domain:
            continue
        confidence = _confidence(name, title, domain, rank)
        if best is None or confidence > best[0]:
            best = (confidence, title or name, domain)

    if best is None or best[0] < 0.6:
        return Entity(
            resolved=False,
            confidence=best[0] if best else 0.0,
            canonical_name=name,
            domain=best[2] if best else "",
            mode="employer_unverifiable",
        )

    return Entity(
        resolved=True,
        confidence=best[0],
        canonical_name=name,
        domain=best[2],
        mode="verified",
    )
