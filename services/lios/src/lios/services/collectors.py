import asyncio
import re
from abc import ABC, abstractmethod
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

import httpx


class Collector(ABC):
    name: str

    @abstractmethod
    async def collect(self, query: str) -> list[dict[str, Any]]: ...


class RSSCollector(Collector):
    """Coletor web simples e legalmente conservador: lê feeds configurados, não burla acesso."""

    name = "rss-web"

    def __init__(self, feeds: list[str] | None = None):
        self.feeds = feeds or []

    async def collect(self, query: str) -> list[dict[str, Any]]:
        if not self.feeds:
            return []
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            responses = await asyncio.gather(
                *(
                    client.get(url, headers={"User-Agent": "LIOS/1.0 (+editorial intelligence)"})
                    for url in self.feeds
                ),
                return_exceptions=True,
            )
        results: list[dict[str, Any]] = []
        for url, response in zip(self.feeds, responses, strict=True):
            if isinstance(response, Exception) or response.status_code >= 400:
                continue
            text = response.text[:1_000_000]
            for block in re.findall(
                r"<(?:item|entry)[^>]*>(.*?)</(?:item|entry)>", text, re.I | re.S
            )[:20]:
                title = self._tag(block, "title")
                link = self._tag(block, "link") or self._link_href(block)
                description = re.sub(r"<[^>]+>", " ", self._tag(block, "description|summary"))
                if query and query.lower() not in f"{title} {description}".lower():
                    continue
                results.append(
                    {
                        "title": title or "Sinal editorial",
                        "content": re.sub(r"\s+", " ", description).strip(),
                        "source_url": link,
                        "source_name": urlparse(url).netloc,
                        "observed_at": datetime.now(UTC).isoformat(),
                        "metadata": {"collector": self.name, "evidence_type": "rss"},
                    }
                )
        return results

    @staticmethod
    def _tag(block: str, names: str) -> str:
        match = re.search(
            rf"<(?:{names})[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</(?:{names})>", block, re.I | re.S
        )
        return re.sub(r"\s+", " ", match.group(1)).strip() if match else ""

    @staticmethod
    def _link_href(block: str) -> str:
        match = re.search(r"<link[^>]+href=[\"']([^\"']+)", block, re.I)
        return match.group(1) if match else ""


class DemoTrendCollector(Collector):
    name = "demo-signal"

    async def collect(self, query: str) -> list[dict[str, Any]]:
        topic = query or "mudança recente no comportamento digital do consumidor"
        return [
            {
                "title": topic,
                "content": (
                    "Sinal de demonstração criado para validar o fluxo da LIOS. "
                    "Antes de publicação real, substitua por dados provenientes de uma API oficial "
                    "ou fonte editorial rastreável. O sistema mantém esta origem visível para impedir "
                    "que demonstração seja confundida com notícia verificada."
                ),
                "source_url": None,
                "source_name": "LIOS Demo",
                "observed_at": datetime.now(UTC).isoformat(),
                "metadata": {"collector": self.name, "demo": True, "evidence_type": "synthetic"},
            }
        ]


class TrendCollectorService:
    def __init__(self, collectors: list[Collector] | None = None):
        self.collectors = collectors or [RSSCollector()]

    async def collect(self, query: str, allow_demo: bool = False) -> list[dict[str, Any]]:
        batches = await asyncio.gather(*(collector.collect(query) for collector in self.collectors))
        results = [item for batch in batches for item in batch]
        if not results and allow_demo:
            results = await DemoTrendCollector().collect(query)
        unique: dict[str, dict[str, Any]] = {}
        for item in results:
            key = item.get("source_url") or item["title"].lower()
            unique[key] = item
        return list(unique.values())
