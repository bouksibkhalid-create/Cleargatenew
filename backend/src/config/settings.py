"""Application settings"""

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


settings = Settings()

