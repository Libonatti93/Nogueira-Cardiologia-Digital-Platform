import asyncio
import json
from collections.abc import AsyncIterator
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from psycopg.errors import UniqueViolation

from ..repository import Repository
from ..schemas import ApplicationCreate, PipelineStart, RagDocumentCreate
from ..services.pipeline import PipelineError, PipelineService

router = APIRouter(prefix="/api/v1")


async def repository(request: Request) -> Repository:
    return request.app.state.repository


async def pipeline(request: Request) -> PipelineService:
    return request.app.state.pipeline


Repo = Annotated[Repository, Depends(repository)]
Pipe = Annotated[PipelineService, Depends(pipeline)]


@router.get("/health")
async def health(request: Request) -> dict[str, Any]:
    return {
        "status": "ok",
        "version": "1.0.0",
        "ai_mode": request.app.state.ai.mode,
        "database": "ready",
    }


@router.get("/dashboard")
async def dashboard(repo: Repo, request: Request) -> dict[str, Any]:
    return {**repo.dashboard(), "ai_mode": request.app.state.ai.mode}


@router.get("/applications")
async def applications(repo: Repo) -> list[dict[str, Any]]:
    return repo.list_applications()


@router.post("/applications", status_code=status.HTTP_201_CREATED)
async def create_application(payload: ApplicationCreate, repo: Repo) -> dict[str, Any]:
    try:
        return repo.create_application(payload.model_dump())
    except Exception as error:
        if isinstance(error, UniqueViolation) or "UNIQUE" in str(error):
            raise HTTPException(
                status_code=409, detail="Já existe uma aplicação com esse slug."
            ) from error
        raise


@router.get("/applications/{app_id}")
async def application(app_id: str, repo: Repo) -> dict[str, Any]:
    item = repo.get_application(app_id)
    if not item:
        raise HTTPException(status_code=404, detail="Aplicação não encontrada.")
    item["documents"] = repo.list_documents(app_id)
    item["runs"] = repo.list_runs(app_id)
    return item


@router.get("/applications/{app_id}/documents")
async def documents(
    app_id: str, repo: Repo, rag_type: str | None = Query(default=None)
) -> list[dict[str, Any]]:
    return repo.list_documents(app_id, rag_type)


@router.post("/applications/{app_id}/documents", status_code=status.HTTP_201_CREATED)
async def add_document(app_id: str, payload: RagDocumentCreate, repo: Repo) -> dict[str, Any]:
    if not repo.get_application(app_id):
        raise HTTPException(status_code=404, detail="Aplicação não encontrada.")
    return repo.add_document(app_id, payload.model_dump(mode="json"))


@router.post("/applications/{app_id}/runs", status_code=status.HTTP_202_ACCEPTED)
async def start_run(app_id: str, payload: PipelineStart, pipe: Pipe) -> dict[str, Any]:
    try:
        return pipe.start(app_id, payload.topic_hint, payload.force_demo_signal)
    except PipelineError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/runs")
async def runs(repo: Repo, application_id: str | None = None) -> list[dict[str, Any]]:
    return repo.list_runs(application_id)


@router.get("/runs/{run_id}")
async def run(run_id: str, repo: Repo) -> dict[str, Any]:
    item = repo.get_run(run_id)
    if not item:
        raise HTTPException(status_code=404, detail="Execução não encontrada.")
    return item


@router.get("/runs/{run_id}/events")
async def run_events(run_id: str, repo: Repo) -> StreamingResponse:
    if not repo.get_run(run_id):
        raise HTTPException(status_code=404, detail="Execução não encontrada.")

    async def stream() -> AsyncIterator[str]:
        last_event_id = 0
        while True:
            item = repo.get_run(run_id)
            if not item:
                break
            events = [event for event in item["events"] if event["id"] > last_event_id]
            for event in events:
                last_event_id = event["id"]
                yield f"id: {event['id']}\nevent: pipeline\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"
            if item["status"] not in {"running", "queued"}:
                yield f"event: complete\ndata: {json.dumps({'status': item['status']})}\n\n"
                break
            yield ": keep-alive\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )


@router.get("/articles/{article_id}")
async def article(article_id: str, repo: Repo) -> dict[str, Any]:
    item = repo.get_article(article_id)
    if not item:
        raise HTTPException(status_code=404, detail="Matéria não encontrada.")
    return item
