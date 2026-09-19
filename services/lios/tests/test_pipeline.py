import asyncio

from lios.db import Database
from lios.providers.ai import DemoAIProvider
from lios.repository import Repository
from lios.services.audit import EditorialAuditService
from lios.services.collectors import TrendCollectorService
from lios.services.pipeline import PipelineService
from lios.services.retrieval import RetrievalService


def test_demo_provider_cannot_publish_even_with_real_sources(tmp_path):
    database = Database(tmp_path / "pipeline.sqlite3")
    database.initialize()
    repo = Repository(database)
    app = repo.create_application({"name": "Cliente", "slug": "cliente"})
    repo.add_document(
        app["id"],
        {
            "rag_type": "avatar",
            "title": "Avatar",
            "content": "Pessoa que busca tecnologia, economia, clareza e decisões práticas.",
            "metadata": {},
        },
    )
    repo.add_document(
        app["id"],
        {
            "rag_type": "offer",
            "title": "Consultoria",
            "content": "Serviço de consultoria que reduz tempo, organiza decisões, explica limites e oferece suporte.",
            "metadata": {},
        },
    )
    repo.add_document(
        app["id"],
        {
            "rag_type": "signals",
            "title": "Tecnologia em pequenas empresas",
            "content": "Pesquisa pública mostra adoção responsável de tecnologia por pequenas empresas brasileiras.",
            "source_name": "Fonte Primária",
            "source_url": "https://example.com/pesquisa",
            "metadata": {},
        },
    )
    service = PipelineService(
        repo,
        RetrievalService(repo),
        TrendCollectorService([]),
        DemoAIProvider(),
        EditorialAuditService(),
        "https://lios.example",
    )
    run = repo.create_run(app["id"])

    asyncio.run(service.run(run["id"], app["id"], "tecnologia em pequenas empresas", False))

    completed = repo.get_run(run["id"])
    assert completed["status"] == "review_required"
    assert completed["audit_score"] >= 8
    assert completed["article"]["published_url"] is None
    assert completed["article"]["audit"]["approved"] is False
    assert completed["events"][-1]["stage"] == "audit"


def test_live_provider_stops_for_human_review(tmp_path):
    class TestLiveProvider(DemoAIProvider):
        mode = "live"

    database = Database(tmp_path / "live.sqlite3")
    database.initialize()
    repo = Repository(database)
    app = repo.create_application({"name": "Review", "slug": "review"})
    for kind in ["avatar", "offer", "signals"]:
        repo.add_document(
            app["id"],
            {
                "rag_type": kind,
                "title": "Contexto público",
                "content": "Contexto de teste suficiente para revisar a produção editorial com limites e fontes.",
                "source_name": "Test source",
                "source_url": "https://example.com/source",
                "metadata": {},
            },
        )
    service = PipelineService(
        repo,
        RetrievalService(repo),
        TrendCollectorService([]),
        TestLiveProvider(),
        EditorialAuditService(),
        "https://clinic.example",
    )
    run = repo.create_run(app["id"])
    asyncio.run(service.run(run["id"], app["id"], "Teste editorial", False))
    result = repo.get_run(run["id"])
    assert result["status"] == "ready_for_review"
    assert result["article"]["status"] == "draft"
    assert result["article"]["published_url"] is None
