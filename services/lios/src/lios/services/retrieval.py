import math
import re
from collections import Counter
from typing import Any

from ..repository import Repository

STOPWORDS = {
    "a",
    "as",
    "o",
    "os",
    "de",
    "da",
    "das",
    "do",
    "dos",
    "e",
    "em",
    "um",
    "uma",
    "para",
    "por",
    "com",
    "que",
    "na",
    "no",
    "nas",
    "nos",
    "ao",
    "aos",
    "se",
    "ser",
}


def tokens(text: str) -> list[str]:
    return [
        token for token in re.findall(r"[a-zá-ú0-9]{3,}", text.lower()) if token not in STOPWORDS
    ]


class RetrievalService:
    """RAG V1 local: recuperação lexical explicável, isolada por aplicação e tipo."""

    def __init__(self, repository: Repository):
        self.repository = repository

    def retrieve(
        self, app_id: str, rag_type: str, query: str, limit: int = 5
    ) -> list[dict[str, Any]]:
        documents = self.repository.list_documents(app_id, rag_type)
        query_terms = Counter(tokens(query))
        scored: list[tuple[float, dict[str, Any]]] = []
        for document in documents:
            document_terms = Counter(tokens(f"{document['title']} {document['content']}"))
            overlap = sum(min(count, document_terms[term]) for term, count in query_terms.items())
            coverage = overlap / max(sum(query_terms.values()), 1)
            title_bonus = len(set(tokens(document["title"])) & set(query_terms)) * 0.15
            freshness = 1 / math.log2(2 + max(len(document["content"]) / 2500, 0))
            score = round(coverage * 0.7 + title_bonus + freshness * 0.1, 4)
            enriched = {**document, "retrieval_score": score}
            scored.append((score, enriched))
        return [item for _, item in sorted(scored, key=lambda pair: pair[0], reverse=True)[:limit]]
