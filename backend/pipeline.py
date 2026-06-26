from pathlib import Path
from typing import Any

SCHEMA_DIR = Path(__file__).resolve().parent.parent / "schema"


def load_mock_report() -> Any:
    mock_path = SCHEMA_DIR / "mock_report.json"
    with mock_path.open("r", encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    print(load_mock_report())
