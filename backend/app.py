import logging
import os
import re

import httpx
from dotenv import load_dotenv

load_dotenv()

from pathlib import Path

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


@app.get("/healthz")
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


# Serve the static frontend as a single service (must be mounted AFTER the API
# routes above so /analyze and /healthz take precedence over the catch-all).
_FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if _FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=_FRONTEND_DIR, html=True), name="frontend")
else:
    log.warning("frontend dir not found at %s — serving API only", _FRONTEND_DIR)
