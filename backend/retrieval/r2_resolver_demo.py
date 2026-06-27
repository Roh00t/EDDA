from __future__ import annotations

from retrieval.resolver import resolve_employer


CASES = ["Shopee", "Carro", "Endowus", "undisclosed"]


def main() -> None:
    for name in CASES:
        entity = resolve_employer(name)
        print(f"\n{name}:")
        print(entity.model_dump_json(indent=2))


if __name__ == "__main__":
    main()
