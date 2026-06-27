from __future__ import annotations

from analysis.analyzer import verify_quote
from analysis.models import Entity
from retrieval.signals import (
    SignalDraft,
    _drafts_for_doc,
    retrieve_signal_docs,
    verified_signals_from_drafts,
)


DEMO_ENTITY = Entity(
    resolved=True,
    confidence=0.95,
    canonical_name="Shopee",
    domain="shopee.sg",
    mode="verified",
)

FABRICATED_QUOTE = "Shopee announced it will shut down all Singapore operations tomorrow."


def main() -> None:
    docs = retrieve_signal_docs(DEMO_ENTITY)
    real_drafts = []
    company_terms = (DEMO_ENTITY.canonical_name.lower(), DEMO_ENTITY.domain.split(".")[0].lower())
    for doc in docs:
        real_drafts.extend(_drafts_for_doc(doc, company_terms))

    fabricated = SignalDraft(
        type="layoffs",
        claim=FABRICATED_QUOTE,
        quote=FABRICATED_QUOTE,
        source_url=docs[0].url if docs else "https://example.com/fabricated",
    )
    mixed_drafts = real_drafts + [fabricated]

    real_signals = verified_signals_from_drafts(docs, real_drafts)
    mixed_signals = verified_signals_from_drafts(docs, mixed_drafts)
    fabricated_matches = [verify_quote(FABRICATED_QUOTE, doc.text) for doc in docs]

    print("retrieved_doc_count:", len(docs))
    print("real_candidate_count:", len(real_drafts))
    print("with_fabricated_candidate_count:", len(mixed_drafts))
    print("verified_real_count:", len(real_signals))
    print("verified_after_fabrication_count:", len(mixed_signals))
    print("fabricated_quote_verified_against_any_doc:", any(fabricated_matches))
    print("fabricated_survived:", any(signal.quote == FABRICATED_QUOTE for signal in mixed_signals))

    print("\nSurvivors:")
    for signal in mixed_signals:
        print(f"- {signal.type}: {signal.quote}")


if __name__ == "__main__":
    main()
