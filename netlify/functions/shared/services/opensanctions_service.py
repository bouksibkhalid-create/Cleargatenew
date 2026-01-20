"""OpenSanctions API service with retry and circuit breaker"""

import httpx
import os
from typing import List, Optional, Dict, Any
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from src.models.responses import OpenSanctionsEntity, SanctionProgram
from src.utils.logger import get_logger
from src.utils.errors import APIError, APITimeoutError
from src.utils.circuit_breaker import opensanctions_breaker, CircuitBreakerError

logger = get_logger(__name__)

# Retry configuration from environment
MAX_RETRIES = int(os.getenv("API_MAX_RETRIES", "3"))
RETRY_MIN_WAIT = float(os.getenv("API_RETRY_MIN_WAIT", "1"))
RETRY_MAX_WAIT = float(os.getenv("API_RETRY_MAX_WAIT", "10"))


class OpenSanctionsService:
    """
    Service for interacting with OpenSanctions API
    
    Features:
    - Automatic retry with exponential backoff
    - Circuit breaker for fault tolerance
    
    API Documentation: https://www.opensanctions.org/docs/api/
    """
    
    BASE_URL = "https://api.opensanctions.org"
    
    def __init__(self, timeout: float = None):
        """
        Initialize OpenSanctions service
        
        Args:
            timeout: Request timeout in seconds (default from env)
        """
        self.timeout = timeout or float(os.getenv("OPENSANCTIONS_TIMEOUT", "5.0"))
        # Get API key from environment
        api_key = os.getenv("OPENSANCTIONS_API_KEY")
        
        headers = {
            "Accept": "application/json",
            "User-Agent": "DueDiligenceApp/1.0"
        }
        
        if api_key:
            headers["Authorization"] = f"ApiKey {api_key}"
        
        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            timeout=self.timeout,
            headers=headers
        )
    
    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=RETRY_MIN_WAIT, max=RETRY_MAX_WAIT),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        reraise=True
    )
    async def _make_request(self, query: str, limit: int) -> dict:
        """Make HTTP request with retry logic"""
        response = await self.client.get(
            "/search/default",
            params={
                "q": query,
                "limit": limit
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def search(
        self, 
        query: str, 
        limit: int = 10
    ) -> List[OpenSanctionsEntity]:
        """
        Search OpenSanctions database
        
        Args:
            query: Name or entity to search for
            limit: Maximum number of results
            
        Returns:
            List of matching entities
            
        Raises:
            APITimeoutError: If request times out after retries
            APIError: If API returns an error or circuit is open
        """
        logger.info(
            "opensanctions_search_started",
            query=query,
            limit=limit
        )
        
        # Check circuit breaker
        if opensanctions_breaker.current_state == "open":
            logger.warning("opensanctions_circuit_open", query=query)
            raise APIError("OpenSanctions service temporarily unavailable")
        
        try:
            # Make the request with retry
            data = await self._make_request(query, limit)
            
            logger.info(
                "opensanctions_search_success",
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
            logger.error("opensanctions_circuit_breaker_open", query=query)
            raise APIError("OpenSanctions service circuit breaker open")
            
        except httpx.TimeoutException as e:
            logger.error(
                "opensanctions_timeout",
                query=query,
                timeout=self.timeout,
                error=str(e)
            )
            raise APITimeoutError(
                f"OpenSanctions API request timed out after {self.timeout}s"
            )
            
        except httpx.HTTPStatusError as e:
            logger.error(
                "opensanctions_http_error",
                query=query,
                status_code=e.response.status_code,
                error=str(e)
            )
            raise APIError(
                f"OpenSanctions API error: {e.response.status_code}",
                status_code=e.response.status_code
            )
            
        except Exception as e:
            logger.error(
                "opensanctions_unexpected_error",
                query=query,
                error=str(e),
                error_type=type(e).__name__
            )
            raise APIError(f"Unexpected error: {str(e)}")

    


    def _parse_entity(self, raw_data: Dict[str, Any]) -> OpenSanctionsEntity:
        """
        Parse OpenSanctions raw response into structured entity
        
        OpenSanctions uses arrays for all property values, so we need
        to extract them properly.
        
        Args:
            raw_data: Raw entity data from API
            
        Returns:
            Structured entity object
        """
        properties = raw_data.get("properties", {})
        
        # Helper to get first value from array
        def get_first(arr: Any) -> Optional[str]:
            if isinstance(arr, list) and len(arr) > 0:
                return str(arr[0])
            return None
        
        # Helper to get all values from array
        def get_all(arr: Any) -> List[str]:
            if isinstance(arr, list):
                return [str(item) for item in arr]
            return []
        
        # Helper to check if text is Latin (English-friendly)
        def is_latin(text: str) -> bool:
            if not text:
                return False
            # Allow Latin letters, spaces, punctuation
            import re
            return bool(re.match(r'^[\x00-\x7F\u00C0-\u00FF\u0100-\u017F\s\.\,\-\'\"]+$', text))
        
        # Helper to get best English/Latin name
        def get_english_name() -> str:
            # Try name property first
            names = properties.get("name", [])
            for name in names:
                if is_latin(str(name)):
                    return str(name)
            
            # Try alias property
            aliases = properties.get("alias", [])
            for alias in aliases:
                if is_latin(str(alias)):
                    return str(alias)
            
            # Try constructing from firstName + lastName
            first_names = properties.get("firstName", [])
            last_names = properties.get("lastName", [])
            for fn in first_names:
                if is_latin(str(fn)):
                    for ln in last_names:
                        if is_latin(str(ln)):
                            return f"{fn} {ln}"
            
            # Fallback to first name available
            if names:
                return str(names[0])
            return "Unknown"
        
        # Extract sanction programs
        sanction_programs = self._extract_sanction_programs(properties)
        
        # Determine if sanctioned - also check topics for "sanction" keyword
        topics = properties.get("topics", [])
        has_sanction_topic = any("sanction" in str(t).lower() for t in topics)
        is_sanctioned = len(sanction_programs) > 0 or has_sanction_topic
        
        return OpenSanctionsEntity(
            id=raw_data.get("id", ""),
            name=get_english_name(),
            schema=raw_data.get("schema", "Unknown"),
            
            # Personal info - filter to Latin only for display
            aliases=[a for a in get_all(properties.get("alias")) if is_latin(a)][:5],
            birth_date=get_first(properties.get("birthDate")),
            death_date=get_first(properties.get("deathDate")),
            nationalities=get_all(properties.get("nationality")),
            countries=get_all(properties.get("country")),
            
            # Sanctions
            is_sanctioned=is_sanctioned,
            sanction_programs=sanction_programs,
            
            # Metadata
            datasets=raw_data.get("datasets", []),
            first_seen=raw_data.get("first_seen"),
            last_seen=raw_data.get("last_seen"),
            properties=properties,
            
            # URL
            url=f"{self.BASE_URL}/entities/{raw_data.get('id')}"
        )

    
    def _extract_sanction_programs(
        self, 
        properties: Dict[str, Any]
    ) -> List[SanctionProgram]:
        """
        Extract sanction program details from properties
        
        Args:
            properties: Entity properties dict
            
        Returns:
            List of sanction programs
        """
        programs = []
        
        # Get program names
        program_names = properties.get("program", [])
        authorities = properties.get("authority", [])
        start_dates = properties.get("startDate", [])
        reasons = properties.get("reason", [])
        
        # Create program objects
        for i, program_name in enumerate(program_names):
            program = SanctionProgram(
                program=str(program_name),
                authority=str(authorities[i]) if i < len(authorities) else None,
                start_date=str(start_dates[i]) if i < len(start_dates) else None,
                reason=str(reasons[i]) if i < len(reasons) else None
            )
            programs.append(program)
        
        return programs
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
