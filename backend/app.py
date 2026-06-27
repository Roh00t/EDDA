import logging
import os
import re
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from analysis.pipeline_mvp import analyze as analyze_jd

log = logging.getLogger("edda")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    jd_text: str
    source_url: str | None = None


@app.on_event("startup")
async def check_openai_key():
    if not os.getenv("OPENAI_API_KEY"):
        log.warning(
            "OPENAI_API_KEY is not set — analyze() will fail soft (0 flags, low risk)"
        )
    else:
        log.info("OPENAI_API_KEY detected")


@app.get("/health")
async def health():
    return {"status": "ok"}


def _fetch_url_text(url: str) -> str | None:
    # ponytail: raw httpx + regex strip — good enough for hackathon JD pages
    try:
        r = httpx.get(url, timeout=5, follow_redirects=True)
        r.raise_for_status()
        return re.sub(r"<[^>]+>", " ", r.text)
    except Exception:
        log.warning("source_url fetch failed — falling back to jd_text")
        return None


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    jd_text = request.jd_text
    if request.source_url:
        fetched = _fetch_url_text(request.source_url)
        if fetched:
            jd_text = fetched
    report = analyze_jd(jd_text)
    return JSONResponse(content=report.model_dump(mode="json"))


_frontend = Path(__file__).resolve().parent.parent / "frontend"
if _frontend.exists():
    app.mount("/", StaticFiles(directory=str(_frontend), html=True), name="frontend")
