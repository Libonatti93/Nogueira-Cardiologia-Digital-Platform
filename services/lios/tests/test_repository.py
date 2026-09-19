from lios.db import Database
from lios.repository import Repository


def make_repo(tmp_path):
    database = Database(tmp_path / "test.sqlite3")
    database.initialize()
    return Repository(database)


def test_application_and_rags_are_isolated(tmp_path):
    repo = make_repo(tmp_path)
    first = repo.create_application({"name": "Primeira", "slug": "primeira"})
    second = repo.create_application({"name": "Segunda", "slug": "segunda"})
    repo.add_document(
        first["id"],
        {
            "rag_type": "avatar",
            "title": "Avatar A",
            "content": "Perfil exclusivo A",
            "metadata": {},
        },
    )

    assert len(repo.list_documents(first["id"], "avatar")) == 1
    assert repo.list_documents(second["id"], "avatar") == []


def test_duplicate_document_is_deduplicated(tmp_path):
    repo = make_repo(tmp_path)
    app = repo.create_application({"name": "Aplicação", "slug": "aplicacao"})
    payload = {"rag_type": "signals", "title": "Sinal", "content": "Mesmo conteúdo", "metadata": {}}
    first = repo.add_document(app["id"], payload)
    second = repo.add_document(app["id"], payload)

    assert first["id"] == second["id"]
    assert len(repo.list_documents(app["id"], "signals")) == 1
