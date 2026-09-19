from lios.services.audit import EditorialAuditService


def article(source="Fonte Primária", url="https://example.com/fato"):
    body = (
        """# Um título útil

## O que aconteceu
Um fato verificável foi observado e explicado com contexto para o leitor.

## Por que isso importa
Esta conexão oferece uma análise original, não apenas um resumo da fonte. O leitor entende a decisão.

## O que você pode fazer
1. Verifique a informação.
2. Compare os efeitos.
3. Tome uma decisão consciente.

## Limites e transparência
Esta análise depende do contexto e não substitui avaliação profissional. Matheus Libonatti é o autor.

## Fontes e método
Os fatos, a análise e a orientação foram separados. """
        + "Conteúdo útil e específico. " * 35
    )
    return {
        "title": "Um título útil para uma decisão real",
        "slug": "titulo-util",
        "body_markdown": body,
        "seo": {
            "meta_title": "Um título útil para uma decisão real",
            "meta_description": "Uma explicação original, clara e prática para ajudar o leitor a compreender o fato e tomar uma decisão melhor.",
            "schema_type": "Article",
            "language": "pt-BR",
            "author": "Matheus Libonatti",
        },
        "sources": [{"source": source, "url": url}],
    }


def test_good_article_reaches_publication_threshold():
    result = EditorialAuditService().audit(article())
    assert result.score >= 8
    assert result.approved is True


def test_demo_signal_is_a_hard_blocker():
    result = EditorialAuditService().audit(article(source="LIOS Demo", url=None))
    assert result.approved is False
    assert any("demonstração" in blocker for blocker in result.blockers)
