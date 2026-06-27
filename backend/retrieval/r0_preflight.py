import os

from exa_py import Exa


# Top 3 demo companies by signal richness from preflight run (2026-06-27):
# Microsoft=3 signals, Shopify=2 signals, Google=1 signal
COMPANIES = ["Microsoft", "Shopify", "Google"]


def result_text(result):
    return getattr(result, "text", None) or ""


def result_url(result):
    return getattr(result, "url", None) or ""


def load_dotenv_file():
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


def main():
    load_dotenv_file()
    api_key = os.getenv("EXA_API_KEY") or os.getenv("EXA_KEY")
    if not api_key:
        raise RuntimeError("Missing EXA_API_KEY/EXA_KEY in environment")

    exa = Exa(api_key)
    print("Exa client public attrs:")
    print([name for name in dir(exa) if not name.startswith("_")])
    print("search_and_contents attr:", getattr(exa, "search_and_contents", None))

    for company in COMPANIES:
        query = f"{company} layoffs OR funding OR lawsuit 2025 2026"
        print(f"\n=== {company} ===")
        response = exa.search_and_contents(query, num_results=3, text=True)
        results = getattr(response, "results", []) or []
        print("result_count:", len(results))
        for idx, result in enumerate(results, start=1):
            text = " ".join(result_text(result).split())
            print(f"{idx}. url: {result_url(result)}")
            print(f"   text_150: {text[:150]}")


if __name__ == "__main__":
    main()
