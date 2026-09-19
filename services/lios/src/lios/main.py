"""Private LIOS API. All user authentication and RBAC remain in Next.js."""

import asyncio
import contextlib
import logging
import os
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .api.routes import router
from .config import get_settings
from .db import Database, now_iso
from .providers.ai import build_ai_provider
from .repository import Repository
from .services.audit import EditorialAuditService
from .services.collectors import RSSCollector, TrendCollectorService
from .services.pipeline import PipelineService
from .services.retrieval import RetrievalService


async def worker(app):
    repo, pipe = app.state.repository, app.state.pipeline
    while True:
        try:
            with repo.db.connect() as connection:
                row = connection.execute("""UPDATE pipeline_runs SET status='running'
                    WHERE id=(SELECT id FROM pipeline_runs WHERE status='queued'
                    ORDER BY started_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *""").fetchone()
            if row:
                await pipe.run(
                    row["id"], row["application_id"], row["topic_hint"], row["force_demo_signal"]
                )
            else:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            raise
        except Exception:
            logging.error("lios_worker_iteration_failed")
            await asyncio.sleep(5)


@asynccontextmanager
async def lifespan(app):
    settings = get_settings()
    database = Database(settings.database_url)
    database.initialize()
    repository = Repository(database)
    # A single API/worker process is deployed. Interrupted work is never silently republished.
    for run in database.fetch_all("SELECT id FROM pipeline_runs WHERE status='running'"):
        repository.update_run(
            run["id"],
            status="failed",
            current_stage="failed",
            error="Execução interrompida pelo reinício do serviço.",
            finished_at=now_iso(),
        )
        repository.add_event(
            run["id"], "failed", "error", "Serviço reiniciado; inicie uma nova execução."
        )
    ai = build_ai_provider(settings)
    app.state.database = database
    app.state.repository = repository
    app.state.ai = ai
    app.state.pipeline = PipelineService(
        repository,
        RetrievalService(repository),
        TrendCollectorService(
            [RSSCollector([u.strip() for u in settings.rss_feeds.split(",") if u.strip()])]
        ),
        ai,
        EditorialAuditService(),
        settings.public_url,
    )
    task = asyncio.create_task(worker(app))
    app.state.worker = task
    try:
        yield
    finally:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(
    title="LIOS / Nogueira", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None
)


@app.middleware("http")
async def private_api(request: Request, call_next):
    if request.url.path != "/healthz":
        supplied = request.headers.get("x-operator-token", "")
        if not secrets.compare_digest(supplied, get_settings().operator_token):
            return JSONResponse({"detail": "Acesso não autorizado."}, status_code=401)
    try:
        response = await call_next(request)
    except Exception:
        logging.error("lios_request_failed")
        response = JSONResponse({"detail": "Falha interna na LIOS."}, status_code=500)
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get("/healthz")
async def health(request: Request):
    request.app.state.database.fetch_one("SELECT 1 AS ok")
    if request.app.state.worker.done():
        return JSONResponse({"status": "degraded"}, status_code=503)
    return {"status": "ok", "sha": os.getenv("RELEASE_SHA", "unknown")}


app.include_router(router)
