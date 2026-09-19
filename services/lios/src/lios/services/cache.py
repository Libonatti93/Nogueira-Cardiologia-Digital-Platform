import json
from datetime import UTC, datetime, timedelta
from typing import Any

from ..db import Database, now_iso


class CacheState:
    MISS = "miss"
    FRESH = "fresh"
    STALE = "stale"


class PersistentCache:
    """Cache persistente com TTL fresco, stale-while-revalidate e tags de invalidação."""

    def __init__(self, db: Database, default_ttl: int = 900, stale_ttl: int = 3600):
        self.db = db
        self.default_ttl = default_ttl
        self.stale_ttl = stale_ttl

    def get(self, key: str) -> tuple[str, Any | None]:
        row = self.db.fetch_one("SELECT * FROM cache_entries WHERE key=?", (key,))
        if not row:
            return CacheState.MISS, None
        now = datetime.now(UTC)
        if now <= datetime.fromisoformat(row["fresh_until"]):
            return CacheState.FRESH, json.loads(row["value_json"])
        if now <= datetime.fromisoformat(row["stale_until"]):
            return CacheState.STALE, json.loads(row["value_json"])
        self.db.execute("DELETE FROM cache_entries WHERE key=?", (key,))
        return CacheState.MISS, None

    def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
        stale_ttl: int | None = None,
        tags: list[str] | None = None,
    ) -> None:
        now = datetime.now(UTC)
        fresh_until = now + timedelta(seconds=ttl or self.default_ttl)
        stale_until = fresh_until + timedelta(seconds=stale_ttl or self.stale_ttl)
        self.db.execute(
            """INSERT INTO cache_entries(key,value_json,fresh_until,stale_until,tags_json,updated_at)
               VALUES (?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET
               value_json=excluded.value_json,fresh_until=excluded.fresh_until,
               stale_until=excluded.stale_until,tags_json=excluded.tags_json,updated_at=excluded.updated_at""",
            (
                key,
                json.dumps(value, ensure_ascii=False),
                fresh_until.isoformat(),
                stale_until.isoformat(),
                json.dumps(tags or []),
                now_iso(),
            ),
        )

    def invalidate_tag(self, tag: str) -> int:
        rows = self.db.fetch_all("SELECT key,tags_json FROM cache_entries")
        keys = [row["key"] for row in rows if tag in json.loads(row["tags_json"])]
        for key in keys:
            self.db.execute("DELETE FROM cache_entries WHERE key=?", (key,))
        return len(keys)
