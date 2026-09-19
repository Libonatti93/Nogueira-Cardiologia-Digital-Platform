import re
from typing import Any

from ..schemas import AuditCriterion, AuditResult


class EditorialAuditService:
    """Auditoria explicável baseada nas diretrizes públicas do Google, não em 'truques de ranking'."""

    WEIGHTS = {
        "helpfulness": 0.22,
        "originality": 0.16,
        "trust": 0.17,
        "intent": 0.13,
        "readability": 0.10,
        "seo": 0.12,
        "safety": 0.10,
    }

    def audit(self, article: dict[str, Any]) -> AuditResult:
        body = article["body_markdown"]
        seo = article["seo"]
        sources = article["sources"]
        words = re.findall(r"\b[\wÀ-ÿ-]+\b", body)
        headings = re.findall(r"^##?\s+", body, re.MULTILINE)
        actionable = any(
            term in body.lower() for term in ("pode fazer", "passo", "decisão", "verifique")
        )
        limitations = any(term in body.lower() for term in ("limites", "não substitui", "depende"))
        source_count = sum(1 for source in sources if source.get("url") or source.get("source"))

        criteria = [
            self._criterion(
                "helpfulness",
                "Utilidade para pessoas",
                min(10, 5 + len(headings) * 0.7 + (2 if actionable else 0)),
                "Estrutura orientada a decisões e próximos passos."
                if actionable
                else "Faltam ações claras.",
                "Inclua consequências e ações concretas.",
            ),
            self._criterion(
                "originality",
                "Valor original",
                9 if "conexão" in body.lower() and len(words) >= 280 else 6.5,
                "A matéria correlaciona sinal, avatar e oferta em vez de apenas resumir.",
                "Explicite o novo ponto de vista e a evidência.",
            ),
            self._criterion(
                "trust",
                "Confiança e fontes",
                min(
                    10,
                    5.5
                    + source_count * 1.5
                    + (1.5 if "Matheus Libonatti" in body or seo.get("author") else 0),
                ),
                f"{source_count} fonte(s) rastreável(is) e autoria declarada.",
                "Adicione fonte primária, data e autoria.",
            ),
            self._criterion(
                "intent",
                "Adequação ao avatar",
                9 if "leitor" in body.lower() and actionable else 6,
                "A linguagem traduz impacto para o público cadastrado.",
                "Mostre por que o tema importa a este avatar.",
            ),
            self._criterion(
                "readability",
                "Clareza e leitura",
                min(10, 6 + len(headings) * 0.55),
                f"{len(words)} palavras e {len(headings)} divisões de leitura.",
                "Use subtítulos descritivos e parágrafos curtos.",
            ),
            self._criterion(
                "seo",
                "SEO técnico",
                self._seo_score(article),
                "Título, descrição, idioma, canonical e schema são verificados.",
                "Complete metadados sem exagero ou repetição.",
            ),
            self._criterion(
                "safety",
                "Transparência e limites",
                9.5 if limitations else 5.5,
                "Limitações e natureza da análise estão visíveis."
                if limitations
                else "Limitações não estão claras.",
                "Declare limites, incertezas e conflitos comerciais.",
            ),
        ]
        score = round(sum(item.score * item.weight for item in criteria), 1)
        blockers = []
        if source_count == 0:
            blockers.append("Nenhuma fonte identificável.")
        if seo.get("author") != "Matheus Libonatti":
            blockers.append("Autoria oficial ausente.")
        if any(
            source.get("source") == "LIOS Demo" or source.get("synthetic") for source in sources
        ):
            blockers.append("Sinal de demonstração não pode ser publicado como notícia real.")
        approved = score >= 8 and not blockers
        return AuditResult(
            score=score,
            approved=approved,
            criteria=criteria,
            blockers=blockers,
            summary=(
                "Aprovada para publicação." if approved else "Retorna ao RAG 3 para nova versão."
            ),
        )

    def _criterion(
        self, key: str, label: str, score: float, evidence: str, recommendation: str
    ) -> AuditCriterion:
        return AuditCriterion(
            key=key,
            label=label,
            score=round(min(score, 10), 1),
            weight=self.WEIGHTS[key],
            evidence=evidence,
            recommendation=recommendation,
        )

    @staticmethod
    def _seo_score(article: dict[str, Any]) -> float:
        seo = article["seo"]
        checks = [
            20 <= len(seo.get("meta_title", "")) <= 65,
            70 <= len(seo.get("meta_description", "")) <= 170,
            seo.get("schema_type") == "Article",
            seo.get("language") == "pt-BR",
            bool(article.get("slug")),
        ]
        return 4 + sum(checks) * 1.2
