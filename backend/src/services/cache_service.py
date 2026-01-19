
from typing import Optional, Any
import json
import hashlib
from datetime import datetime, timedelta
from src.utils.logger import get_logger

logger = get_logger(__name__)

class CacheService:
    """
    Simple in-memory cache for API responses
    
    For production, consider using Redis for distributed caching
    """
    
    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize cache service
        
        Args:
            ttl_seconds: Time to live for cache entries
        """
        self.cache: dict = {}
        self.ttl = timedelta(seconds=ttl_seconds)
    
    def _generate_key(self, prefix: str, **kwargs) -> str:
        """
        Generate cache key from parameters
        
        Args:
            prefix: Cache key prefix
            **kwargs: Parameters to include in key
            
        Returns:
            Cache key string
        """
        # Sort kwargs for consistent key generation
        params = json.dumps(kwargs, sort_keys=True)
        hash_digest = hashlib.md5(params.encode()).hexdigest()
        return f"{prefix}:{hash_digest}"
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found/expired
        """
        if key not in self.cache:
            # Low log level to avoid spam
            return None
        
        entry = self.cache[key]
        
        # Check if expired
        if datetime.utcnow() > entry["expires_at"]:
            del self.cache[key]
            return None
        
        logger.debug("cache_hit", key=key)
        return entry["value"]
    
    def set(self, key: str, value: Any, ttl: Optional[timedelta] = None):
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Optional custom TTL
        """
        expires_at = datetime.utcnow() + (ttl or self.ttl)
        
        self.cache[key] = {
            "value": value,
            "expires_at": expires_at,
            "created_at": datetime.utcnow()
        }
    
    def delete(self, key: str):
        """Delete key from cache"""
        if key in self.cache:
            del self.cache[key]
    
    def clear(self):
        """Clear all cache entries"""
        count = len(self.cache)
        self.cache.clear()
        logger.info("cache_cleared", count=count)
    
    def cleanup(self):
        """Remove expired entries"""
        now = datetime.utcnow()
        expired_keys = [
            key for key, entry in self.cache.items()
            if now > entry["expires_at"]
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            logger.info("cache_cleanup", expired_count=len(expired_keys))

# Global cache instance
_cache_instance: Optional[CacheService] = None

def get_cache_service() -> CacheService:
    """Get singleton cache service"""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheService(ttl_seconds=3600)  # 1 hour
    return _cache_instance
