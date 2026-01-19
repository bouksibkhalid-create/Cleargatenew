
import functools
import json
import hashlib
from typing import Callable, Any
from src.services.cache_service import get_cache_service
from src.middleware.rate_limiter import get_rate_limiter
from src.utils.logger import get_logger
from src.config.settings import settings

logger = get_logger(__name__)

def rate_limit(func: Callable) -> Callable:
    """Rate limiting decorator"""
    @functools.wraps(func)
    def wrapper(event: dict, context: Any) -> dict:
        if not settings.ENABLE_RATE_LIMITING:
            return func(event, context)
            
        # Get IP from Netlify event
        headers = event.get("headers", {})
        client_ip = headers.get("client-ip") or headers.get("x-forwarded-for", "unknown")
        
        limiter = get_rate_limiter()
        allowed, remaining = limiter.is_allowed(client_ip)
        
        if not allowed:
            return {
                "statusCode": 429,
                "headers": {
                    "Content-Type": "application/json",
                    "Retry-After": str(settings.RATE_LIMIT_WINDOW_SECONDS)
                },
                "body": json.dumps({
                    "error": "TooManyRequests",
                    "message": "Rate limit exceeded"
                })
            }
            
        response = func(event, context)
        
        # Add rate limit headers
        if isinstance(response, dict):
            if "headers" not in response:
                response["headers"] = {}
            response["headers"]["X-RateLimit-Limit"] = str(limiter.max_requests)
            response["headers"]["X-RateLimit-Remaining"] = str(remaining)
            
        return response
    return wrapper

def cached(ttl_seconds: int = 3600) -> Callable:
    """Caching decorator"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(event: dict, context: Any) -> dict:
            if not settings.ENABLE_CACHE:
                return func(event, context)
            
            # Skip caching for non-GET/POST or errors
            method = event.get("httpMethod")
            if method == "OPTIONS":
                return func(event, context)
                
            # Generate cache key
            body = event.get("body", "")
            path = event.get("path", "")
            query = json.dumps(event.get("queryStringParameters", {}), sort_keys=True)
            
            # Key based on path, query, and body
            key_content = f"{method}:{path}:{query}:{body}"
            key_hash = hashlib.md5(key_content.encode()).hexdigest()
            cache_key = f"api:{key_hash}"
            
            cache = get_cache_service()
            cached_response = cache.get(cache_key)
            
            if cached_response:
                return cached_response
                
            # Execute function
            response = func(event, context)
            
            # Cache success responses
            if response.get("statusCode") == 200:
                cache.set(cache_key, response, ttl=None) # Use default TTL
                
            return response
        return wrapper
    return decorator
