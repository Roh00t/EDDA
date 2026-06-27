from __future__ import annotations

from analysis.analyzer import verify_quote
from analysis.models import Entity
from retrieval.signals import fetch_signals, retrieve_signal_docs


DEMO_ENTITY = Entity(
    resolved=True,
    confidence=0.95,
    canonical_name="Shopee",
    domain="shopee.sg",
    mode="verified",
)


def main() -> None:
    docs = retrieve_signal_docs(DEMO_ENTITY)
    signals = fetch_signals(DEMO_ENTITY)
    text_by_url = {doc.url: doc.text for doc in docs}

    print("entity:")
    print(DEMO_ENTITY.model_dump_json(indent=2))
    print("retrieved_doc_count:", len(docs))
    print("surviving_signal_count:", len(signals))

    for idx, signal in enumerate(signals, start=1):
        source_text = text_by_url[str(signal.source_url)]
        print(f"\nSignal {idx}:")
        print(signal.model_dump_json(indent=2))
        print("quote_verbatim_in_source:", verify_quote(signal.quote, source_text))
        print("source_contains_quote_index:", " ".join(source_text.split()).find(" ".join(signal.quote.split())))


if __name__ == "__main__":
    main()
