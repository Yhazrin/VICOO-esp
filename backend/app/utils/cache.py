import functools
import json
import logging
from typing import Any, Callable, Optional, Union
import pickle

from app.config import settings

logger = logging.getLogger("vicoo.cache")

# Global Redis client placeholder
_redis_client = None

def get_redis():
    global _redis_client
    if _redis_client is None and settings.REDIS_URL:
        try:
            import redis.asyncio as redis
            _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=False)
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
    return _redis_client

def cached(
    prefix: str, 
    ttl: int = 300, 
    key_builder: Optional[Callable] = None
):
    """
    Decorator to cache async function results in Redis.
    Uses pickle for serialization to handle complex Pydantic models / SQLAlchemy objects.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            if not settings.REDIS_URL:
                return await func(*args, **kwargs)

            redis = get_redis()
            if not redis:
                return await func(*args, **kwargs)

            # Build cache key
            if key_builder:
                cache_key = f"{prefix}:{key_builder(*args, **kwargs)}"
            else:
                # Default key builder: func_name + args + kwargs
                # Note: This is a simple version, might need adjustment for complex args
                arg_str = ":".join([str(a) for a in args[1:]]) # Skip 'self'
                kwarg_str = ":".join([f"{k}={v}" for k, v in sorted(kwargs.items())])
                cache_key = f"{prefix}:{func.__name__}:{arg_str}:{kwarg_str}"

            try:
                # Try to get from cache
                cached_data = await redis.get(cache_key)
                if cached_data:
                    logger.debug(f"Cache hit: {cache_key}")
                    return pickle.loads(cached_data)
            except Exception as e:
                logger.warning(f"Cache read error for {cache_key}: {e}")

            # Execute function
            result = await func(*args, **kwargs)

            try:
                # Store in cache
                if result is not None:
                    await redis.setex(
                        cache_key, 
                        ttl, 
                        pickle.dumps(result)
                    )
                    logger.debug(f"Cache stored: {cache_key}")
            except Exception as e:
                logger.warning(f"Cache write error for {cache_key}: {e}")

            return result
        return wrapper
    return decorator

async def invalidate_cache(pattern: str):
    """Invalidate all keys matching a pattern."""
    redis = get_redis()
    if not redis:
        return
    
    try:
        keys = await redis.keys(f"{pattern}*")
        if keys:
            await redis.delete(*keys)
            logger.info(f"Invalidated {len(keys)} keys with pattern: {pattern}")
    except Exception as e:
        logger.error(f"Failed to invalidate cache: {e}")
