import json
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pathlib import Path

app = FastAPI()

SCHEMA_DIR = Path(__file__).resolve().parent.parent / "schema"
MOCK_REPORT_PATH = SCHEMA_DIR / "mock_report.json"

@app.post("/analyze")
async def analyze():
    with MOCK_REPORT_PATH.open("r", encoding="utf-8") as f:
        report = json.load(f)
    return JSONResponse(content=report)
