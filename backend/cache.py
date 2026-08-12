"""
cache.py
---------
Camada fina de cache em Redis para as agregações do dashboard
(summary, cruzamentos, correlações), que são caras de recalcular a
cada requisição. O cache é invalidado sempre que há upload/remoção
de registros.
"""
import os
import json
import redis

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
CACHE_TTL_SECONDS = int(os.environ.get("CACHE_TTL_SECONDS", "300"))
CACHE_PREFIX = "insightlink:dashboard:"

_client = None


def get_client():
    global _client
    if _client is None:
        _client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    return _client


def cache_get(key: str):
    try:
        raw = get_client().get(CACHE_PREFIX + key)
        return json.loads(raw) if raw else None
    except redis.RedisError:
        return None


def cache_set(key: str, value, ttl: int = CACHE_TTL_SECONDS):
    try:
        get_client().set(CACHE_PREFIX + key, json.dumps(value), ex=ttl)
    except redis.RedisError:
        pass


def cache_invalidate_all():
    """Remove todas as chaves de dashboard cacheadas (chamado após writes)."""
    try:
        client = get_client()
        for key in client.scan_iter(f"{CACHE_PREFIX}*"):
            client.delete(key)
    except redis.RedisError:
        pass