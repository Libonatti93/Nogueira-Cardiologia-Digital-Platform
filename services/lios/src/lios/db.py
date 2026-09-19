import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

SCHEMA = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  publication_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rag_documents (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  rag_type TEXT NOT NULL CHECK (rag_type IN ('avatar','offer','signals')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  source_url TEXT,
  source_name TEXT,
  observed_at TEXT,
  checksum TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rag_lookup ON rag_documents(application_id, rag_type, active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rag_checksum ON rag_documents(application_id, rag_type, checksum);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  current_stage TEXT NOT NULL,
  audit_score REAL,
  revision_count INTEGER NOT NULL DEFAULT 0,
  article_id TEXT,
  error TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_runs_app ON pipeline_runs(application_id, started_at DESC);

CREATE TABLE IF NOT EXISTS pipeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_run ON pipeline_events(run_id, id);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  hook TEXT NOT NULL,
  image_prompt TEXT NOT NULL,
  image_url TEXT,
  seo_json TEXT NOT NULL,
  sources_json TEXT NOT NULL,
  audit_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  published_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_articles_app ON articles(application_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cache_entries (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  fresh_until TEXT NOT NULL,
  stale_until TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
"""


def now_iso() -> str:
    return datetime.now(UTC).isoformat()


class Database:
    def __init__(self, path: Path | str):
        self.dsn = str(path) if str(path).startswith(("postgres://", "postgresql://")) else None
        self.path = Path(path) if not self.dsn else None

    def initialize(self) -> None:
        if self.dsn:
            self.fetch_one("SELECT count(*) FROM applications")
            return  # Production DDL is applied by versioned migrations, never runtime.
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(SCHEMA)

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        if self.dsn:
            import psycopg
            from psycopg.rows import dict_row

            with psycopg.connect(
                self.dsn, options="-c search_path=lios", row_factory=dict_row
            ) as connection:
                yield connection
            return
        connection = sqlite3.connect(self.path, timeout=10, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def fetch_all(self, query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        query = self.sql(query)
        with self.connect() as connection:
            return [dict(row) for row in connection.execute(query, params).fetchall()]

    def fetch_one(self, query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
        query = self.sql(query)
        with self.connect() as connection:
            row = connection.execute(query, params).fetchone()
            return dict(row) if row else None

    def execute(self, query: str, params: tuple[Any, ...] = ()) -> None:
        query = self.sql(query)
        with self.connect() as connection:
            connection.execute(query, params)

    def sql(self, query: str) -> str:
        return query.replace("?", "%s") if self.dsn else query


def decode_json_fields(row: dict[str, Any] | None, *fields: str) -> dict[str, Any] | None:
    if row is None:
        return None
    for field in fields:
        if field in row and isinstance(row[field], str):
            row[field.removesuffix("_json")] = json.loads(row.pop(field))
    return row
