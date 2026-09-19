from lios.db import Database
from lios.services.cache import CacheState, PersistentCache


def test_cache_fresh_and_tag_invalidation(tmp_path):
    database = Database(tmp_path / "cache.sqlite3")
    database.initialize()
    cache = PersistentCache(database)
    cache.set("source:one", {"value": 42}, tags=["app:test"])

    state, value = cache.get("source:one")
    assert state == CacheState.FRESH
    assert value == {"value": 42}
    assert cache.invalidate_tag("app:test") == 1
    assert cache.get("source:one") == (CacheState.MISS, None)
