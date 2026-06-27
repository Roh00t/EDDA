import logging
import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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


@app.get("/")
async def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    report = analyze_jd(request.jd_text)
    return JSONResponse(content=report.model_dump(mode="json"))
