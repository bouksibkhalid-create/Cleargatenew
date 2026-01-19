"""Sanctions.io API service with retry and circuit breaker"""

import httpx
import os
from typing import List, Optional, Dict, Any
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from src.models.responses import SanctionsIoEntity
from src.utils.logger import get_logger
from src.utils.errors import APIError, APITimeoutError
from src.utils.circuit_breaker import sanctions_io_breaker, CircuitBreakerError

logger = get_logger(__name__)

# Retry configuration from environment
MAX_RETRIES = int(os.getenv("API_MAX_RETRIES", "3"))
RETRY_MIN_WAIT = float(os.getenv("API_RETRY_MIN_WAIT", "1"))
RETRY_MAX_WAIT = float(os.getenv("API_RETRY_MAX_WAIT", "10"))


class SanctionsIoService:
    """
    Service for interacting with Sanctions.io API
    
    Features:
    - Automatic retry with exponential backoff
    - Circuit breaker for fault tolerance
    
    API Documentation: https://api-docs.sanctions.io/
    
    Note: Sanctions.io requires an API key. Free tier available.
    Get your key at: https://sanctions.io/
    """
    
    BASE_URL = "https://api.sanctions.io"
    
    def __init__(self, api_key: Optional[str] = None, timeout: float = None):
        """
        Initialize Sanctions.io service
        
        Args:
            api_key: Sanctions.io API key (defaults to environment variable)
            timeout: Request timeout in seconds (default from env)
        """
        self.api_key = api_key or os.getenv("SANCTIONS_IO_API_KEY")
        
        if not self.api_key:
            logger.warning("sanctions_io_no_api_key")
            # Don't fail initialization - allow service to exist but fail on actual calls
        
        self.timeout = timeout or float(os.getenv("SANCTIONS_IO_TIMEOUT", "5.0"))
        
        headers = {
            "Accept": "application/json",
            "User-Agent": "DueDiligenceApp/1.0"
        }
        
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            timeout=self.timeout,
            headers=headers,
            follow_redirects=True  # Follow 301/302 redirects
        )
    
    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=RETRY_MIN_WAIT, max=RETRY_MAX_WAIT),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        reraise=True
    )
    async def _make_request(self, query: str, fuzzy: bool, limit: int) -> dict:
        """Make HTTP request with retry logic"""
        response = await self.client.get(
            "/search",
            params={
                "name": query,
                "fuzzy": str(fuzzy).lower(),
                "limit": limit
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def search(
        self, 
        query: str,
        fuzzy: bool = False,
        limit: int = 10
    ) -> List[SanctionsIoEntity]:
        """
        Search Sanctions.io database
        
        Args:
            query: Name or entity to search for
            fuzzy: Whether to use fuzzy matching (server-side)
            limit: Maximum number of results
            
        Returns:
            List of matching entities
            
        Raises:
            APIError: If API key is missing or API returns an error
            APITimeoutError: If request times out after retries
        """
        if not self.api_key:
            raise APIError(
                "Sanctions.io API key not configured",
                status_code=401
            )
        
        logger.info(
            "sanctions_io_search_started",
            query=query,
            fuzzy=fuzzy,
            limit=limit
        )
        
        # Check circuit breaker
        if sanctions_io_breaker.current_state == "open":
            logger.warning("sanctions_io_circuit_open", query=query)
            raise APIError("Sanctions.io service temporarily unavailable")
        
        try:
            # Make the request with retry
            data = await self._make_request(query, fuzzy, limit)
            
            logger.info(
                "sanctions_io_search_success",
                query=query,
                results_count=len(data.get("results", []))
            )
            
            # Parse results
            entities = []
            for result in data.get("results", []):
                entity = self._parse_entity(result)
                entities.append(entity)
            
            return entities
            
        except CircuitBreakerError:
            logger.error("sanctions_io_circuit_breaker_open", query=query)
            raise APIError("Sanctions.io service circuit breaker open")
            
        except httpx.TimeoutException as e:
            logger.error(
                "sanctions_io_timeout",
                query=query,
                timeout=self.timeout,
                error=str(e)
            )
            raise APITimeoutError(
                f"Sanctions.io API request timed out after {self.timeout}s"
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(
                "sanctions_io_http_error",
                query=query,
                status_code=e.response.status_code,
                error=str(e)
            )
            
            # Handle specific status codes
            if e.response.status_code == 401:
                raise APIError(
                    "Sanctions.io API key is invalid",
                    status_code=401
                )
            elif e.response.status_code == 429:
                raise APIError(
                    "Sanctions.io rate limit exceeded. Please try again later.",
                    status_code=429
                )
            else:
                raise APIError(
                    f"Sanctions.io API error: {e.response.status_code}",
                    status_code=e.response.status_code
                )
            
        except Exception as e:
            logger.error(
                "sanctions_io_unexpected_error",
                query=query,
                error=str(e),
                error_type=type(e).__name__
            )
            raise APIError(f"Unexpected error: {str(e)}")



    
    def _parse_entity(self, raw_data: Dict[str, Any]) -> SanctionsIoEntity:
        """
        Parse Sanctions.io raw response into structured entity
        
        Args:
            raw_data: Raw entity data from API
            
        Returns:
            Structured entity object
        """
        # Extract aliases (AKAs)
        aliases = []
        if "akas" in raw_data:
            if isinstance(raw_data["akas"], list):
                aliases = [str(aka) for aka in raw_data["akas"]]
            elif isinstance(raw_data["akas"], str):
                aliases = [raw_data["akas"]]
        
        # Extract addresses
        addresses = []
        if "addresses" in raw_data and isinstance(raw_data["addresses"], list):
            for addr in raw_data["addresses"]:
                if isinstance(addr, dict):
                    addresses.append(addr)
                elif isinstance(addr, str):
                    addresses.append({"full": addr})
        
        # Extract sources/references
        sources = []
        if "sources" in raw_data:
            if isinstance(raw_data["sources"], list):
                sources = [str(s) for s in raw_data["sources"]]
        
        return SanctionsIoEntity(
            id=str(raw_data.get("id", "")),
            name=str(raw_data.get("name", "Unknown")),
            entity_type=str(raw_data.get("type", "Unknown")),
            
            # Sanction info
            list_type=str(raw_data.get("list_type", "Unknown")),
            programs=raw_data.get("programs", []),
            
            # Personal info
            aliases=aliases,
            birth_dates=raw_data.get("dates_of_birth", []),
            nationalities=raw_data.get("nationalities", []),
            
            # Address
            addresses=addresses,
            
            # Additional
            remarks=raw_data.get("remarks"),
            sources=sources,
            
            # Always sanctioned (it's a sanctions database)
            is_sanctioned=True,
            
            # Match score (will be set by fuzzy matcher)
            match_score=100
        )
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
