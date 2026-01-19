"""Enhanced Netlify Function for multi-source entity search"""

import json
import asyncio
import os
from dotenv import load_dotenv
from typing import Dict, Any, List, Tuple, Union

# Load environment variables
load_dotenv()

from src.services.opensanctions_service import OpenSanctionsService
from src.services.sanctions_io_service import SanctionsIoService
from src.services.offshore_service import OffshoreLeaksService
from src.services.aggregator import ResultAggregator
from src.services.data_sources.local_search_service import get_local_sanctions_service
from src.models.requests import SearchRequest
from src.models.responses import (
    SearchResponse, 
    ErrorResponse,
    OpenSanctionsEntity,
    SanctionsIoEntity
)
from src.utils.logger import get_logger
from src.utils.errors import APIError, APITimeoutError
from src.utils.decorators import cached, rate_limit
from pydantic import ValidationError

logger = get_logger(__name__)


def search_local_sanctions(query: str, limit: int = 50) -> Tuple[List[OpenSanctionsEntity], str]:
    """
    Search sanctions data from Supabase PostgreSQL (with fallback to local cache).
    
    Returns:
        Tuple of (results converted to OpenSanctionsEntity format, error_message)
    """
    from src.models.responses import SanctionProgram
    
    def convert_to_entity(result: dict) -> OpenSanctionsEntity:
        """Convert a sanctions result to OpenSanctionsEntity format"""
        # Convert program strings to SanctionProgram objects
        sanction_programs = []
        for prog in result.get('programs', []):
            sanction_programs.append(SanctionProgram(
                program=prog,
                authority=result.get('source', 'Unknown'),
                start_date=result.get('date_added') or result.get('dateAdded'),
                reason=None
            ))
        
        # Map entity type to schema
        entity_type = result.get('entity_type', result.get('type', 'person'))
        schema_map = {
            'person': 'Person',
            'company': 'Company', 
            'organization': 'Organization',
            'vessel': 'Vessel',
            'aircraft': 'Aircraft',
        }
        entity_schema = schema_map.get(entity_type, 'LegalEntity')
        
        # Get birth dates
        birth_dates = result.get('birth_dates', result.get('birthDates', []))
        birth_date = birth_dates[0] if birth_dates else None
        
        # Get match score (Supabase returns 0-1, convert to 0-100)
        match_score = result.get('matchScore', result.get('match_score', 1.0))
        if isinstance(match_score, float) and match_score <= 1.0:
            match_score = int(match_score * 100)
        
        return OpenSanctionsEntity(
            id=result.get('source_id', result.get('id', '')),
            name=result.get('name', 'Unknown'),
            schema=entity_schema,
            countries=result.get('nationalities', []),
            aliases=result.get('aliases', []),
            birth_date=birth_date,
            nationalities=result.get('nationalities', []),
            sanction_programs=sanction_programs,
            is_sanctioned=True,
            match_score=int(match_score),
            url=result.get('source_url', result.get('sourceUrl', 'https://sanctionssearch.ofac.treas.gov/')),
            datasets=[result.get('source', 'Local')],
            source="opensanctions",
        )
    
    # Try Supabase first (persistent storage)
    try:
        from src.services.data_sources.supabase_search_service import get_supabase_search_service
        
        supabase_service = get_supabase_search_service()
        results = supabase_service.search(query=query, limit=limit)
        
        if results:
            entities = [convert_to_entity(r) for r in results]
            
            logger.info(
                "supabase_sanctions_search_success",
                query=query,
                results_count=len(entities)
            )
            
            return (entities, None)
        
        # If no results from Supabase, fall through to local cache
        logger.info("supabase_no_results_fallback_to_local", query=query)
        
    except Exception as e:
        logger.warning(
            "supabase_search_failed_fallback_to_local",
            query=query,
            error=str(e)
        )
    
    # Fallback: Local in-memory cache (for when Supabase is unavailable)
    try:
        local_service = get_local_sanctions_service()
        results = local_service.search(query=query, limit=limit)
        entities = [convert_to_entity(r) for r in results]
        
        logger.info(
            "local_sanctions_search_success",
            query=query,
            results_count=len(entities)
        )
        
        return (entities, None)
        
    except Exception as e:
        logger.error(
            "local_sanctions_search_error",
            query=query,
            error=str(e)
        )
        return ([], f"Sanctions search error: {str(e)}")


async def search_source(
    service: Union[OpenSanctionsService, SanctionsIoService],
    query: str,
    search_type: str,
    limit: int,
    source_name: str
) -> Tuple[List[Union[OpenSanctionsEntity, SanctionsIoEntity]], str]:
    """
    Search a single source and handle errors gracefully
    
    Args:
        service: Service instance (OpenSanctions or Sanctions.io)
        query: Search query
        search_type: "exact" or "fuzzy"
        limit: Max results
        source_name: Name of source (for logging)
        
    Returns:
        Tuple of (results, error_message)
    """
    try:
        # For Sanctions.io, pass fuzzy parameter
        if source_name == "sanctions_io" and hasattr(service, 'search'):
            results = await service.search(
                query=query,
                fuzzy=(search_type == "fuzzy"),
                limit=limit
            )
        else:
            results = await service.search(query=query, limit=limit)
        
        return (results, None)
        
    except APITimeoutError as e:
        logger.warning(
            f"{source_name}_timeout",
            query=query,
            error=str(e)
        )
        return ([], "Request timed out")
        
    except APIError as e:
        logger.warning(
            f"{source_name}_error",
            query=query,
            error=str(e),
            status_code=getattr(e, 'status_code', 0)
        )
        return ([], str(e.message) if hasattr(e, 'message') else str(e))
        
    except Exception as e:
        logger.error(
            f"{source_name}_unexpected_error",
            query=query,
            error=str(e),
            error_type=type(e).__name__
        )
        return ([], f"Unexpected error: {str(e)}")



async def perform_search(request: SearchRequest) -> SearchResponse:
    """
    Perform multi-source entity search with parallel API calls
    
    Args:
        request: Validated search request
        
    Returns:
        Aggregated search response
    """
    # Initialize services
    opensanctions_service = OpenSanctionsService()
    sanctions_io_service = SanctionsIoService()
    aggregator = ResultAggregator(fuzzy_threshold=request.fuzzy_threshold)
    
    try:
        # Prepare parallel tasks
        tasks = []
        task_sources = []
        
        if "opensanctions" in request.sources:
            tasks.append(
                search_source(
                    opensanctions_service,
                    request.query,
                    request.search_type,
                    request.limit,
                    "opensanctions"
                )
            )
            task_sources.append("opensanctions")
        
        if "sanctions_io" in request.sources:
            tasks.append(
                search_source(
                    sanctions_io_service,
                    request.query,
                    request.search_type,
                    request.limit,
                    "sanctions_io"
                )
            )
            task_sources.append("sanctions_io")
        
        # Add offshore_leaks search if requested
        offshore_service = None
        offshore_leaks_results = []
        offshore_leaks_error = None
        
        if "offshore_leaks" in request.sources:
            try:
                offshore_service = OffshoreLeaksService()
                offshore_leaks_results = await offshore_service.search(
                    query=request.query,
                    limit=request.limit
                )
                task_sources.append("offshore_leaks")
                logger.info(
                    "offshore_leaks_search_success",
                    query=request.query,
                    results_count=len(offshore_leaks_results)
                )
            except Exception as e:
                offshore_leaks_error = str(e)
                logger.warning(
                    "offshore_leaks_search_error",
                    query=request.query,
                    error=str(e)
                )
                task_sources.append("offshore_leaks")
        
        # Execute all searches in parallel
        logger.info(
            "parallel_search_started",
            query=request.query,
            sources=task_sources
        )
        
        results = await asyncio.gather(*tasks)
        
        # Extract results and errors
        opensanctions_results = []
        opensanctions_error = None
        sanctions_io_results = []
        sanctions_io_error = None
        
        for i, (task_results, error) in enumerate(results):
            source = task_sources[i]
            if source == "opensanctions":
                opensanctions_results = task_results
                opensanctions_error = error
            elif source == "sanctions_io":
                sanctions_io_results = task_results
                sanctions_io_error = error
        
        # ENHANCEMENT: Search local sanctions (OFAC, EU) as primary/fallback source
        # This uses data downloaded directly from government sources
        local_results, local_error = search_local_sanctions(request.query, request.limit)
        
        if local_results:
            logger.info(
                "local_sanctions_merged",
                query=request.query,
                local_count=len(local_results),
                api_count=len(opensanctions_results)
            )
            # If OpenSanctions API failed, use local results entirely
            if opensanctions_error and not opensanctions_results:
                opensanctions_results = local_results
                opensanctions_error = None  # Clear error since local worked
            else:
                # Merge local results with API results (local first for priority)
                # Deduplicate by name to avoid duplicates
                existing_names = {e.name.lower() for e in opensanctions_results}
                for local_entity in local_results:
                    if local_entity.name.lower() not in existing_names:
                        opensanctions_results.append(local_entity)
                        existing_names.add(local_entity.name.lower())

        
        # Aggregate results
        response = aggregator.aggregate(
            query=request.query,
            search_type=request.search_type,
            opensanctions_results=opensanctions_results,
            sanctions_io_results=sanctions_io_results,
            opensanctions_error=opensanctions_error,
            sanctions_io_error=sanctions_io_error,
            offshore_leaks_results=offshore_leaks_results,
            offshore_leaks_error=offshore_leaks_error,
            sources_requested=request.sources
        )
        
        return response
        
    finally:
        # Cleanup
        await opensanctions_service.close()
        await sanctions_io_service.close()
        if offshore_service:
            await offshore_service.client.close()


@rate_limit
@cached(ttl_seconds=300)
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Enhanced Netlify Function handler for multi-source search
    
    Args:
        event: Lambda event object
        context: Lambda context object
        
    Returns:
        HTTP response dict
    """
    # CORS headers
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }
    
    # Handle OPTIONS (CORS preflight)
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }
    
    try:
        # Parse request - support both POST body and GET query parameters
        if event.get("httpMethod") == "GET":
            # GET request - use query parameters
            params = event.get("queryStringParameters", {})
            body = params  # Use query params as body
        else:
            # POST request - parse JSON body
            body = json.loads(event.get("body", "{}"))
        
        # Validate request
        request = SearchRequest(**body)
        
        logger.info(
            "search_request_received",
            query=request.query,
            search_type=request.search_type,
            sources=request.sources,
            limit=request.limit
        )
        
        # Perform search
        response = asyncio.run(perform_search(request))
        
        logger.info(
            "search_request_success",
            query=request.query,
            total_results=response.total_results,
            total_sanctioned=response.total_sanctioned,
            sources_succeeded=response.sources_succeeded,
            sources_failed=response.sources_failed
        )
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": response.model_dump_json()
        }
        
    except ValidationError as e:
        logger.warning(
            "search_validation_error",
            errors=e.errors()
        )
        
        error_response = ErrorResponse(
            error="ValidationError",
            message="Invalid request parameters",
            details=json.dumps(e.errors())
        )
        
        return {
            "statusCode": 400,
            "headers": headers,
            "body": error_response.model_dump_json()
        }
        
    except Exception as e:
        logger.error(
            "search_unexpected_error",
            error=str(e),
            error_type=type(e).__name__
        )
        
        error_response = ErrorResponse(
            error="InternalError",
            message="An unexpected error occurred",
            details=str(e) if logger.level == "DEBUG" else None
        )
        
        return {
            "statusCode": 500,
            "headers": headers,
            "body": error_response.model_dump_json()
        }
