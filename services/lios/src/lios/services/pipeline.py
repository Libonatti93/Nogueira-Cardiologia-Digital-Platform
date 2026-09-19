import asyncio
from typing import Any

from ..db import now_iso
from ..providers.ai import AIProvider
from ..repository import Repository
from .audit import EditorialAuditService
from .collectors import TrendCollectorService
from .retrieval import RetrievalService

STAGES = [
    "preflight",
    "rag1",
    "rag2",
    "collect",
    "rag3",
    "correlate",
    "write",
    "image",
    "audit",
    "revise",
    "publish",
]


class PipelineError(RuntimeError):
    pass


class PipelineService:
    def __init__(
        self,
        repository: Repository,
        retrieval: RetrievalService,
        collectors: TrendCollectorService,
        ai: AIProvider,
        audit: EditorialAuditService,
        public_url: str,
    ):
        self.repository = repository
        self.retrieval = retrieval
        self.collectors = collectors
        self.ai = ai
        self.audit_service = audit
        self.public_url = public_url
        self.tasks: set[asyncio.Task[Any]] = set()

    def start(
        self, app_id: str, topic_hint: str = "", force_demo_signal: bool = False
    ) -> dict[str, Any]:
        if not self.repository.get_application(app_id):
            raise PipelineError("Aplicação não encontrada.")
        # Queue creation is atomic and survives a web session or API restart.
        from psycopg.errors import UniqueViolation

        from ..repository import new_id

        run_id = new_id("run")
        try:
            self.repository.db.execute(
                """INSERT INTO pipeline_runs
                (id,application_id,status,current_stage,started_at,topic_hint,force_demo_signal)
                VALUES (?,?,'queued','queued',?,?,?)""",
                (run_id, app_id, now_iso(), topic_hint, force_demo_signal),
            )
        except UniqueViolation as error:
            raise PipelineError("Já existe uma execução ativa para esta aplicação.") from error
        return self.repository.get_run(run_id)

    async def run(self, run_id: str, app_id: str, topic_hint: str, force_demo_signal: bool) -> None:
        try:
            self._event(run_id, "preflight", "running", "Validando os ingredientes da aplicação.")
            avatar_docs = self.repository.list_documents(app_id, "avatar")
            offer_docs = self.repository.list_documents(app_id, "offer")
            if not avatar_docs or not offer_docs:
                raise PipelineError("RAG 1 (avatar) e RAG 2 (oferta) precisam estar preenchidos.")
            self._event(
                run_id,
                "rag1",
                "success",
                f"RAG 1 pronto: {len(avatar_docs)} documento(s) do avatar.",
            )
            self._event(
                run_id,
                "rag2",
                "success",
                f"RAG 2 pronto: {len(offer_docs)} documento(s) da oferta.",
            )

            self._event(
                run_id, "collect", "running", "Coletando sinais rastreáveis da web e APIs oficiais."
            )
            collected = await self.collectors.collect(topic_hint, allow_demo=force_demo_signal)
            for signal in collected:
                self.repository.add_document(app_id, {"rag_type": "signals", **signal})
            signal_docs = self.repository.list_documents(app_id, "signals")
            if not signal_docs:
                raise PipelineError(
                    "Nenhum sinal no RAG 3. Configure fontes ou use o modo demonstração."
                )
            self._event(
                run_id, "rag3", "success", f"RAG 3 consolidado com {len(signal_docs)} sinal(is)."
            )

            query = topic_hint or signal_docs[0]["title"]
            self._event(run_id, "correlate", "running", "Cruzando hype, avatar e solução.")
            context = {
                "topic_hint": topic_hint,
                "avatar": self.retrieval.retrieve(app_id, "avatar", query),
                "offer": self.retrieval.retrieve(app_id, "offer", query),
                "signals": self.retrieval.retrieve(app_id, "signals", query),
            }
            self._event(
                run_id,
                "correlate",
                "success",
                "Novo ponto de vista encontrado com evidências preservadas.",
            )

            revision = 0
            article: dict[str, Any] | None = None
            while revision <= 2:
                stage = "write" if revision == 0 else "revise"
                self._event(
                    run_id,
                    stage,
                    "running",
                    "Criando matéria autoral."
                    if revision == 0
                    else f"Reescrevendo após auditoria — tentativa {revision}.",
                )
                payload = await self.ai.generate_article(context, revision)
                # Source provenance comes from retrieved documents, never model assertions.
                payload["sources"] = [
                    {
                        "title": item["title"],
                        "url": item.get("source_url"),
                        "source": item.get("source_name"),
                        "synthetic": self.ai.mode == "demo"
                        or bool(item.get("metadata", {}).get("demo"))
                        or item.get("metadata", {}).get("evidence_type") == "synthetic",
                    }
                    for item in context["signals"]
                ]
                if article is None:
                    article = self.repository.create_article(app_id, run_id, payload)
                    self.repository.update_run(run_id, article_id=article["id"])
                else:
                    # Mantém cada tentativa auditável sem apagar o histórico anterior.
                    article = self.repository.create_article(app_id, run_id, payload)
                    self.repository.update_run(
                        run_id, article_id=article["id"], revision_count=revision
                    )
                self._event(
                    run_id, stage, "success", "Rascunho concluído.", {"article_id": article["id"]}
                )

                self._event(run_id, "image", "running", "Criando imagem com hook visual forte.")
                image_url = await self.ai.generate_image(article["image_prompt"])
                article["image_url"] = image_url
                self.repository.update_article_image(article["id"], image_url)
                self._event(
                    run_id,
                    "image",
                    "success" if image_url else "skipped",
                    "Imagem criada." if image_url else "Imagem aguardando provedor de IA ao vivo.",
                )

                self._event(
                    run_id,
                    "audit",
                    "running",
                    "Agente auditor avaliando qualidade, utilidade e SEO.",
                )
                result = self.audit_service.audit(article)
                self.repository.update_article_audit(article["id"], result.model_dump())
                self.repository.update_run(run_id, audit_score=result.score)
                self._event(
                    run_id,
                    "audit",
                    "success" if result.approved else "warning",
                    f"Nota {result.score}/10 — {result.summary}",
                    result.model_dump(),
                )
                if result.approved:
                    self.repository.update_run(
                        run_id,
                        status="ready_for_review",
                        current_stage="review",
                        finished_at=now_iso(),
                    )
                    self._event(
                        run_id,
                        "review",
                        "success",
                        "Auditoria aprovada. Envie ao blog como rascunho para revisão humana.",
                    )
                    return
                revision += 1
                if revision <= 2:
                    self._event(
                        run_id,
                        "revise",
                        "queued",
                        "Nota abaixo de 8 ou bloqueio crítico: voltando ao RAG 3.",
                    )

            self.repository.update_run(
                run_id, status="review_required", current_stage="audit", finished_at=now_iso()
            )
            self._event(
                run_id,
                "audit",
                "blocked",
                "Limite de revisões atingido. Revisão humana necessária.",
            )
        except Exception as error:
            self.repository.update_run(
                run_id,
                status="failed",
                current_stage="failed",
                error=type(error).__name__,
                finished_at=now_iso(),
            )
            self._event(
                run_id, "failed", "error", "Falha na execução. Confira a configuração do serviço."
            )

    def _event(
        self,
        run_id: str,
        stage: str,
        status: str,
        message: str,
        payload: dict[str, Any] | None = None,
    ) -> None:
        self.repository.update_run(run_id, current_stage=stage)
        self.repository.add_event(run_id, stage, status, message, payload)
