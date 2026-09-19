import json

from .repository import Repository

AVATAR = {
    "age_range": "25 a 55 anos",
    "predominant_gender": "diverso, com comunicação inclusiva",
    "common_habits": [
        "pesquisa pelo celular",
        "compara antes de comprar",
        "compartilha pelo WhatsApp",
    ],
    "common_concerns": ["tempo", "custo", "confiança", "resultado prático"],
    "average_income": "a validar com dados reais da aplicação",
    "education_level": "variado",
    "professions": ["empreendedores", "gestores", "profissionais operacionais"],
    "learning_interests": ["tecnologia", "negócios", "soluções práticas"],
    "social_networks": ["Instagram", "TikTok", "YouTube", "WhatsApp"],
    "technology_awareness": "intermediário; busca clareza antes de adotar",
    "ai_usage": "usa ou está começando a usar assistentes de IA",
    "usual_search_channels": ["Google", "YouTube", "redes sociais"],
}

OFFER = {
    "overview": {
        "name": "Oferta de demonstração",
        "type": "serviço",
        "purpose": "mostrar o fluxo completo da LIOS",
    },
    "target_audience": {
        "indicated_for": "equipes que precisam produzir conteúdo útil e rastreável",
        "not_for": "spam ou conteúdo sem revisão",
    },
    "characteristics": {
        "included": ["pesquisa", "correlação", "redação", "auditoria"],
        "delivery": "digital",
    },
    "benefits_results": {
        "benefits": ["clareza", "consistência", "rastreabilidade"],
        "limitations": "depende de dados e fontes de qualidade",
    },
    "quality_trust": {"method": "fontes preservadas, auditoria explicável e aprovação mínima 8/10"},
    "pricing": {
        "price": "não definido nesta demonstração",
        "additional_costs": "APIs externas podem ter custo",
    },
    "purchase_delivery": {"how": "configuração por aplicação", "availability": "V1"},
    "warranty_cancellation": {"terms": "definidos por cada aplicação"},
    "safety_risks": {
        "risks": ["fonte incorreta", "automação sem supervisão"],
        "privacy": "minimização de dados pessoais",
    },
    "comparison": {"differential": "orquestração própria, sem n8n, fluxo totalmente visível"},
    "after_sales": {"support": "operador LIOS", "updates": "versionadas"},
}


def seed_demo(repository: Repository) -> None:
    if repository.list_applications():
        return
    app = repository.create_application(
        {
            "name": "LIOS Lab",
            "slug": "lios-lab",
            "description": "Aplicação segura de demonstração do fluxo RAG 1 → RAG 2 → RAG 3 → auditoria.",
            "publication_url": "",
        }
    )
    repository.add_document(
        app["id"],
        {
            "rag_type": "avatar",
            "title": "Avatar de demonstração",
            "content": json.dumps(AVATAR, ensure_ascii=False, indent=2),
            "metadata": {"schema": "avatar.v1", "demo": True},
        },
    )
    repository.add_document(
        app["id"],
        {
            "rag_type": "offer",
            "title": "Oferta de demonstração",
            "content": json.dumps(OFFER, ensure_ascii=False, indent=2),
            "metadata": {"schema": "offer.v1", "demo": True},
        },
    )
