import json
from abc import ABC, abstractmethod
from typing import Any

import httpx


class AIProvider(ABC):
    mode = "unknown"

    @abstractmethod
    async def generate_article(
        self, context: dict[str, Any], revision: int = 0
    ) -> dict[str, Any]: ...

    @abstractmethod
    async def generate_image(self, prompt: str) -> str | None: ...


class DemoAIProvider(AIProvider):
    mode = "demo"

    async def generate_article(self, context: dict[str, Any], revision: int = 0) -> dict[str, Any]:
        signal = context["signals"][0]
        offer = context["offer"][0]
        avatar = context["avatar"][0]
        topic = context.get("topic_hint") or signal["title"]
        title = f"{topic}: o que muda e como transformar atenção em decisão útil"
        source = signal.get("source_url") or ""
        body = f"""# {title}

## O que aconteceu

{signal["content"]}

## Por que isso importa agora

O assunto ganhou atenção, mas atenção sozinha não resolve um problema. A LIOS analisou o sinal à luz do público descrito em **{avatar["title"]}** e encontrou uma ligação prática com **{offer["title"]}**. O ponto novo não é repetir a notícia: é traduzir o impacto em uma decisão que o leitor possa tomar.

## A conexão que quase ninguém está fazendo

Quando uma tendência altera comportamento, custo ou expectativa, empresas que conhecem de verdade o seu público conseguem responder com orientação, não apenas publicidade. A oferta analisada resolve uma parte concreta desse cenário: {offer["content"][:520].strip()}

## O que o leitor pode fazer

1. Confirme se o fato se aplica à sua realidade e à sua região.
2. Compare o custo de não agir com o custo da solução.
3. Verifique prazo, limites, garantia e suporte antes de decidir.
4. Use a solução apenas quando ela fizer sentido para sua necessidade real.

## Limites e transparência

Esta análise correlaciona um sinal público com dados fornecidos pela aplicação. Ela não transforma tendência em certeza, não substitui avaliação profissional e não esconde limitações comerciais. A recomendação final depende do contexto de cada pessoa.

## Fontes e método

O sinal foi registrado com origem e horário no RAG 3. O perfil do público veio do RAG 1; as características, benefícios e limites da oferta vieram do RAG 2. A LIOS separou fato, análise e orientação antes da auditoria editorial.{f" Fonte principal: {source}." if source else ""}
"""
        if revision:
            body += "\n\n## Revisão editorial\n\nEsta versão reforça a autoria, a utilidade prática, os limites e a rastreabilidade das fontes após a auditoria automática."
        return {
            "title": title,
            "summary": "Uma leitura prática e original que conecta um assunto em alta a uma decisão útil para o público certo.",
            "hook": "A tendência chama atenção. A conexão certa transforma atenção em uma decisão melhor.",
            "body_markdown": body,
            "image_prompt": f"Editorial documentary image about {topic}, strong visual contrast, human-centered, no text, credible Brazilian context, 16:9",
            "seo": {
                "meta_title": title[:60],
                "meta_description": "Entenda o que mudou, por que importa e quais decisões práticas podem ajudar você agora.",
                "canonical_path": "",
                "schema_type": "Article",
                "language": "pt-BR",
                "author": "Matheus Libonatti",
            },
            "sources": [
                {
                    "title": item["title"],
                    "url": item.get("source_url"),
                    "source": item.get("source_name"),
                }
                for item in context["signals"]
            ],
        }

    async def generate_image(self, prompt: str) -> str | None:
        return None


class OpenAIProvider(AIProvider):
    mode = "live"

    def __init__(self, api_key: str, text_model: str, image_model: str):
        self.api_key = api_key
        self.text_model = text_model
        self.image_model = image_model
        self.base_url = "https://api.openai.com/v1"

    @property
    def headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

    async def generate_article(self, context: dict[str, Any], revision: int = 0) -> dict[str, Any]:
        instructions = """Você é o editor-chefe da LIOS, criada por Matheus Libonatti. Produza conteúdo original, útil, people-first e verificável. Não copie fontes, não invente fatos e deixe claros limites e autoria. Responda somente JSON com: title, summary, hook, body_markdown, image_prompt, seo e sources. seo deve ter meta_title, meta_description, canonical_path, schema_type=Article, language=pt-BR e author=Matheus Libonatti."""
        payload = {
            "model": self.text_model,
            "instructions": instructions,
            "input": json.dumps({"context": context, "revision": revision}, ensure_ascii=False),
            "text": {"format": {"type": "json_object"}},
        }
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{self.base_url}/responses", headers=self.headers, json=payload
            )
            response.raise_for_status()
            data = response.json()
        output_text = data.get("output_text")
        if not output_text:
            chunks = []
            for item in data.get("output", []):
                for content in item.get("content", []):
                    if content.get("type") == "output_text":
                        chunks.append(content.get("text", ""))
            output_text = "".join(chunks)
        return json.loads(output_text)

    async def generate_image(self, prompt: str) -> str | None:
        payload = {"model": self.image_model, "prompt": prompt, "size": "1536x1024"}
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                f"{self.base_url}/images/generations", headers=self.headers, json=payload
            )
            response.raise_for_status()
            data = response.json()["data"][0]
        if data.get("b64_json"):
            return f"data:image/png;base64,{data['b64_json']}"
        return data.get("url")


def build_ai_provider(settings: Any) -> AIProvider:
    if settings.ai_provider == "openai" and settings.openai_api_key:
        return OpenAIProvider(settings.openai_api_key, settings.text_model, settings.image_model)
    return DemoAIProvider()
