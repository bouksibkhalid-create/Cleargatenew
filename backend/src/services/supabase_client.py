"""
Supabase Client

Provides a singleton Supabase client for database operations.
"""

from typing import Optional
from supabase import create_client, Client
from src.config.settings import settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

# Singleton client instance
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get singleton Supabase client instance.
    
    Uses service key for full database access (server-side only).
    Falls back to anon key if service key not available.
    """
    global _supabase_client
    
    if _supabase_client is None:
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_ANON_KEY
        
        if not key:
            raise ValueError(
                "Supabase key not configured. Set SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY"
            )
        
        _supabase_client = create_client(url, key)
        logger.info("supabase_client_initialized", url=url)
    
    return _supabase_client


def reset_client():
    """Reset the client (useful for testing)"""
    global _supabase_client
    _supabase_client = None
