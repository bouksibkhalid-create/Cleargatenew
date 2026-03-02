"""Application settings"""

import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration - OpenSanctions
    OPENSANCTIONS_API_KEY: Optional[str] = None
    OPENSANCTIONS_TIMEOUT: float = 5.0
    
    # API Configuration - Sanctions.io
    SANCTIONS_IO_API_KEY: Optional[str] = None
    SANCTIONS_IO_TIMEOUT: float = 5.0
    
    # Neo4j Configuration
    NEO4J_URI: Optional[str] = None
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: Optional[str] = None
    NEO4J_MAX_CONNECTION_LIFETIME: int = 3600
    NEO4J_MAX_CONNECTION_POOL_SIZE: int = 50
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None
    
    # Search Configuration
    API_REQUEST_LIMIT: int = 50
    DEFAULT_FUZZY_THRESHOLD: int = 80
    
    # Graph Configuration
    MAX_GRAPH_DEPTH: int = 3
    MAX_GRAPH_NODES: int = 100
    DEFAULT_GRAPH_DEPTH: int = 2
    DEFAULT_GRAPH_NODES: int = 50
    
    # AI Analysis (Anthropic Claude)
    ANTHROPIC_API_KEY: Optional[str] = None
    AI_ANALYSIS_MODEL: str = "claude-sonnet-4-20250514"
    AI_ANALYSIS_MAX_TOKENS: int = 1024
    AI_ANALYSIS_TIMEOUT: float = 30.0
    
    # OSINT / OpenCorporates (F2)
    OPENCORPORATES_API_KEY: Optional[str] = None

    # Adverse Media
    SERPER_API_KEY: Optional[str] = None
    GOOGLE_CSE_API_KEY: Optional[str] = None
    GOOGLE_CSE_ENGINE_ID: Optional[str] = None
    ADVERSE_MEDIA_PROVIDER: str = "serper"
    ADVERSE_MEDIA_MAX_QUERIES: int = 5
    ADVERSE_MEDIA_QUERY_DELAY: float = 0.2
    ADVERSE_MEDIA_DEDUP_THRESHOLD: int = 85
    
    # Logging
    LOG_LEVEL: str = "INFO"

    # Cache Configuration
    CACHE_TTL_SECONDS: int = 3600
    ENABLE_CACHE: bool = True
    
    # Rate Limiting
    RATE_LIMIT_MAX_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    ENABLE_RATE_LIMITING: bool = True
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    ENABLE_SENTRY: bool = True
    
    # Environment
    ENVIRONMENT: str = "development"
    NETLIFY: Optional[str] = None
    NETLIFY_BUILD_ID: Optional[str] = None
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }

    def model_post_init(self, __context: object) -> None:
        """Fallback: check common alternate env var names from Vercel."""
        _ALIASES = {
            "SERPER_API_KEY": ["Serp_Api_Key", "SERP_API_KEY", "serper_api_key"],
            "ANTHROPIC_API_KEY": ["Anthropic_Api_Key", "ANTHROPIC_API_KEY", "anthropic_api_key"],
        }
        for field, alt_names in _ALIASES.items():
            if getattr(self, field) is None:
                for alt in alt_names:
                    val = os.getenv(alt)
                    if val:
                        object.__setattr__(self, field, val)
                        break


settings = Settings()

