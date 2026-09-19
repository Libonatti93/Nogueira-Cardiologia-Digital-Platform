import hashlib
import json
import re
import uuid
from typing import Any

from .db import Database, decode_json_fields, now_iso


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"


def checksum(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def slugify(value: str) -> str:
    normalized = value.lower().strip()
    normalized = re.sub(r"[^a-z0-9à-ú]+", "-", normalized, flags=re.IGNORECASE)
    return normalized.strip("-")[:90] or "conteudo-lios"


class Repository:
    def __init__(self, db: Database):
        self.db = db

    def create_application(self, payload: dict[str, Any]) -> dict[str, Any]:
        item_id, timestamp = new_id("app"), now_iso()
        self.db.execute(
            """INSERT INTO applications
               (id,name,slug,description,publication_url,status,created_at,updated_at)
               VALUES (?,?,?,?,?,'active',?,?)""",
            (
                item_id,
                payload["name"],
                payload["slug"],
                payload.get("description", ""),
                payload.get("publication_url", ""),
                timestamp,
                timestamp,
            ),
        )
        return self.get_application(item_id)  # type: ignore[return-value]

    def list_applications(self) -> list[dict[str, Any]]:
        applications = self.db.fetch_all("SELECT * FROM applications ORDER BY created_at DESC")
        for app in applications:
            app["counts"] = self.db.fetch_one(
                """SELECT
                   SUM(CASE WHEN rag_type='avatar' THEN 1 ELSE 0 END) avatar,
                   SUM(CASE WHEN rag_type='offer' THEN 1 ELSE 0 END) offer,
                   SUM(CASE WHEN rag_type='signals' THEN 1 ELSE 0 END) signals
                   FROM rag_documents WHERE application_id=? AND active=1""",
                (app["id"],),
            )
        return applications

    def get_application(self, app_id: str) -> dict[str, Any] | None:
        return self.db.fetch_one("SELECT * FROM applications WHERE id=?", (app_id,))

    def add_document(self, app_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        item_id, timestamp = new_id("doc"), now_iso()
        content_hash = checksum(payload["content"])
        existing = self.db.fetch_one(
            "SELECT * FROM rag_documents WHERE application_id=? AND rag_type=? AND checksum=?",
            (app_id, payload["rag_type"], content_hash),
        )
        if existing:
            return decode_json_fields(existing, "metadata_json")  # type: ignore[return-value]
        self.db.execute(
            """INSERT INTO rag_documents
               (id,application_id,rag_type,title,content,metadata_json,source_url,source_name,
                observed_at,checksum,created_at,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT (application_id,rag_type,checksum) DO NOTHING""",
            (
                item_id,
                app_id,
                payload["rag_type"],
                payload["title"],
                payload["content"],
                json.dumps(payload.get("metadata", {}), ensure_ascii=False),
                str(payload.get("source_url") or "") or None,
                payload.get("source_name"),
                payload.get("observed_at"),
                content_hash,
                timestamp,
                timestamp,
            ),
        )
        return decode_json_fields(
            self.db.fetch_one(
                "SELECT * FROM rag_documents WHERE application_id=? AND rag_type=? AND checksum=?",
                (app_id, payload["rag_type"], content_hash),
            ),
            "metadata_json",
        )

    def get_document(self, item_id: str) -> dict[str, Any] | None:
        return decode_json_fields(
            self.db.fetch_one("SELECT * FROM rag_documents WHERE id=?", (item_id,)),
            "metadata_json",
        )

    def list_documents(self, app_id: str, rag_type: str | None = None) -> list[dict[str, Any]]:
        query = "SELECT * FROM rag_documents WHERE application_id=? AND active=1"
        params: tuple[Any, ...] = (app_id,)
        if rag_type:
            query += " AND rag_type=?"
            params += (rag_type,)
        query += " ORDER BY created_at DESC"
        return [
            decode_json_fields(row, "metadata_json") for row in self.db.fetch_all(query, params)
        ]  # type: ignore[misc]

    def create_run(self, app_id: str) -> dict[str, Any]:
        run_id, timestamp = new_id("run"), now_iso()
        self.db.execute(
            """INSERT INTO pipeline_runs
               (id,application_id,status,current_stage,started_at)
               VALUES (?,?,'running','preflight',?)""",
            (run_id, app_id, timestamp),
        )
        return self.get_run(run_id)  # type: ignore[return-value]

    def update_run(self, run_id: str, **fields: Any) -> None:
        allowed = {
            "status",
            "current_stage",
            "audit_score",
            "revision_count",
            "article_id",
            "error",
            "finished_at",
        }
        values = {key: value for key, value in fields.items() if key in allowed}
        if not values:
            return
        setters = ",".join(f"{key}=?" for key in values)
        self.db.execute(
            f"UPDATE pipeline_runs SET {setters} WHERE id=?", (*values.values(), run_id)
        )

    def get_run(self, run_id: str) -> dict[str, Any] | None:
        run = self.db.fetch_one("SELECT * FROM pipeline_runs WHERE id=?", (run_id,))
        if run:
            run["events"] = [
                decode_json_fields(row, "payload_json")
                for row in self.db.fetch_all(
                    "SELECT * FROM pipeline_events WHERE run_id=? ORDER BY id", (run_id,)
                )
            ]
            if run.get("article_id"):
                run["article"] = self.get_article(run["article_id"])
        return run

    def list_runs(self, app_id: str | None = None, limit: int = 20) -> list[dict[str, Any]]:
        if app_id:
            return self.db.fetch_all(
                "SELECT * FROM pipeline_runs WHERE application_id=? ORDER BY started_at DESC LIMIT ?",
                (app_id, limit),
            )
        return self.db.fetch_all(
            "SELECT * FROM pipeline_runs ORDER BY started_at DESC LIMIT ?", (limit,)
        )

    def add_event(
        self,
        run_id: str,
        stage: str,
        status: str,
        message: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        self.db.execute(
            """INSERT INTO pipeline_events(run_id,stage,status,message,payload_json,created_at)
               VALUES (?,?,?,?,?,?)""",
            (
                run_id,
                stage,
                status,
                message,
                json.dumps(payload or {}, ensure_ascii=False),
                now_iso(),
            ),
        )
        row = self.db.fetch_one(
            "SELECT * FROM pipeline_events WHERE run_id=? ORDER BY id DESC LIMIT 1", (run_id,)
        )
        return decode_json_fields(row, "payload_json") or {}

    def create_article(self, app_id: str, run_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        item_id, timestamp = new_id("article"), now_iso()
        self.db.execute(
            """INSERT INTO articles
               (id,application_id,run_id,title,slug,summary,body_markdown,hook,image_prompt,image_url,
                seo_json,sources_json,status,created_at,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                item_id,
                app_id,
                run_id,
                payload["title"],
                slugify(payload["title"]),
                payload["summary"],
                payload["body_markdown"],
                payload["hook"],
                payload["image_prompt"],
                payload.get("image_url"),
                json.dumps(payload["seo"], ensure_ascii=False),
                json.dumps(payload["sources"], ensure_ascii=False),
                "draft",
                timestamp,
                timestamp,
            ),
        )
        return self.get_article(item_id)  # type: ignore[return-value]

    def update_article_audit(self, article_id: str, audit: dict[str, Any]) -> None:
        self.db.execute(
            "UPDATE articles SET audit_json=?,updated_at=? WHERE id=?",
            (json.dumps(audit, ensure_ascii=False), now_iso(), article_id),
        )

    def update_article_image(self, article_id: str, image_url: str | None) -> None:
        self.db.execute(
            "UPDATE articles SET image_url=?,updated_at=? WHERE id=?",
            (image_url, now_iso(), article_id),
        )

    def publish_article(self, article_id: str, published_url: str) -> None:
        timestamp = now_iso()
        self.db.execute(
            """UPDATE articles SET status='published',published_url=?,published_at=?,updated_at=?
               WHERE id=?""",
            (published_url, timestamp, timestamp, article_id),
        )

    def get_article(self, article_id: str) -> dict[str, Any] | None:
        return decode_json_fields(
            self.db.fetch_one("SELECT * FROM articles WHERE id=?", (article_id,)),
            "seo_json",
            "sources_json",
            "audit_json",
        )

    def get_article_by_slug(self, slug: str) -> dict[str, Any] | None:
        return decode_json_fields(
            self.db.fetch_one(
                "SELECT * FROM articles WHERE slug=? AND status='published' ORDER BY published_at DESC LIMIT 1",
                (slug,),
            ),
            "seo_json",
            "sources_json",
            "audit_json",
        )

    def dashboard(self) -> dict[str, Any]:
        return {
            "applications": self.db.fetch_one("SELECT COUNT(*) total FROM applications")["total"],
            "documents": self.db.fetch_one(
                "SELECT COUNT(*) total FROM rag_documents WHERE active=1"
            )["total"],
            "published": self.db.fetch_one(
                "SELECT COUNT(*) total FROM articles WHERE status='published'"
            )["total"],
            "running": self.db.fetch_one(
                "SELECT COUNT(*) total FROM pipeline_runs WHERE status='running'"
            )["total"],
            "runs": self.list_runs(limit=8),
        }
