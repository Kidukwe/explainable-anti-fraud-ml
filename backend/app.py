"""Operational API only: no model or dataset is supplied by the scaffold."""

from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Ozon Anti-Fraud — учебный проект", version="0.1.0")


class Health(BaseModel):
    status: Literal["ok"] = "ok"
    service: str = "antifraud"


@app.get("/healthz", response_model=Health, tags=["operations"])
def health() -> Health:
    """Liveness is independent of whether the team has implemented a model."""
    return Health()


@app.get("/readyz", tags=["operations"], status_code=503)
def readiness() -> JSONResponse:
    """Do not claim inference readiness before a validated model exists."""
    return JSONResponse(
        status_code=503,
        content={"status": "not_ready", "reason": "model_not_implemented"},
    )


@app.get("/api/v1/metrics", tags=["dashboard"], status_code=503)
def metrics() -> JSONResponse:
    """Expose an explicit absence of evaluation results; never fabricate scores."""
    return JSONResponse(
        status_code=503,
        content={"status": "not_available", "metrics": None, "reason": "evaluation_not_run"},
    )


# API routes must be registered before the root static mount.
app.mount("/", StaticFiles(directory=Path(__file__).parent / "static", html=True), name="dashboard")
