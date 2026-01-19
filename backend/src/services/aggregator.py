"""Result aggregation service"""

from typing import List, Union
from src.models.responses import (
    SearchResponse, 
    AggregatedResults, 
    SourceResults,
    OpenSanctionsEntity,
    SanctionsIoEntity
)
from src.services.fuzzy_matcher import FuzzyMatcher
from src.utils.logger import get_logger

logger = get_logger(__name__)


class ResultAggregator:
    """
    Service for aggregating and scoring results from multiple sources
    """
    
    def __init__(self, fuzzy_threshold: int = 80):
        """
        Initialize aggregator
        
        Args:
            fuzzy_threshold: Threshold for fuzzy matching
        """
        self.fuzzy_matcher = FuzzyMatcher(threshold=fuzzy_threshold)
        self.fuzzy_threshold = fuzzy_threshold
    
    def aggregate(
        self,
        query: str,
        search_type: str,
        opensanctions_results: List[OpenSanctionsEntity],
        sanctions_io_results: List[SanctionsIoEntity],
        opensanctions_error: str = None,
        sanctions_io_error: str = None,
        offshore_leaks_results: List = None,
        offshore_leaks_error: str = None,
        sources_requested: List[str] = None
    ) -> SearchResponse:
        """
        Aggregate results from all sources
        
        Args:
            query: Original search query
            search_type: "exact" or "fuzzy"
            opensanctions_results: Results from OpenSanctions
            sanctions_io_results: Results from Sanctions.io
            opensanctions_error: Error from OpenSanctions (if any)
            sanctions_io_error: Error from Sanctions.io (if any)
            sources_requested: List of sources that were requested
            
        Returns:
            Aggregated search response
        """
        logger.info(
            "aggregation_started",
            query=query,
            search_type=search_type,
            opensanctions_count=len(opensanctions_results),
            sanctions_io_count=len(sanctions_io_results),
            offshore_leaks_count=len(offshore_leaks_results or [])
        )
        
        # Handle offshore_leaks_results default
        if offshore_leaks_results is None:
            offshore_leaks_results = []
        
        # Calculate match scores for all results
        opensanctions_scored = self._score_results(
            query, 
            opensanctions_results, 
            search_type
        )
        
        sanctions_io_scored = self._score_results(
            query,
            sanctions_io_results,
            search_type
        )
        
        # Build source-specific results
        opensanctions_source = SourceResults(
            found=len(opensanctions_scored) > 0,
            count=len(opensanctions_scored),
            sanctioned_count=sum(1 for e in opensanctions_scored if e.is_sanctioned),
            error=opensanctions_error,
            results=opensanctions_scored
        )
        
        sanctions_io_source = SourceResults(
            found=len(sanctions_io_scored) > 0,
            count=len(sanctions_io_scored),
            sanctioned_count=sum(1 for e in sanctions_io_scored if e.is_sanctioned),
            error=sanctions_io_error,
            results=sanctions_io_scored
        )
        
        # Build offshore_leaks source results (no scoring needed - already scored by Neo4j)
        offshore_leaks_count = len(offshore_leaks_results)
        offshore_leaks_source = SourceResults(
            found=offshore_leaks_count > 0,
            count=offshore_leaks_count,
            sanctioned_count=0,  # Offshore Leaks entities aren't sanctions
            error=offshore_leaks_error,
            results=offshore_leaks_results
        )
        
        # Combine all results
        all_results: List[Union[OpenSanctionsEntity, SanctionsIoEntity]] = []
        all_results.extend(opensanctions_scored)
        all_results.extend(sanctions_io_scored)
        
        # Sort by: 1) sanctioned first, 2) match score (descending)
        all_results.sort(
            key=lambda x: (x.is_sanctioned, x.match_score), 
            reverse=True
        )

        
        # Calculate summary stats
        total_results = len(all_results)
        total_sanctioned = sum(1 for e in all_results if e.is_sanctioned)
        
        # Determine which sources succeeded/failed
        sources_searched = sources_requested or ["opensanctions", "sanctions_io", "offshore_leaks"]
        sources_succeeded = []
        sources_failed = []
        
        if "opensanctions" in sources_searched:
            if opensanctions_error:
                sources_failed.append("opensanctions")
            else:
                sources_succeeded.append("opensanctions")
        
        if "sanctions_io" in sources_searched:
            if sanctions_io_error:
                sources_failed.append("sanctions_io")
            else:
                sources_succeeded.append("sanctions_io")
        
        if "offshore_leaks" in sources_searched:
            if offshore_leaks_error:
                sources_failed.append("offshore_leaks")
            else:
                sources_succeeded.append("offshore_leaks")
        
        logger.info(
            "aggregation_completed",
            total_results=total_results,
            total_sanctioned=total_sanctioned,
            sources_succeeded=sources_succeeded,
            sources_failed=sources_failed
        )
        
        return SearchResponse(
            query=query,
            search_type=search_type,  # type: ignore
            results_by_source=AggregatedResults(
                opensanctions=opensanctions_source,
                sanctions_io=sanctions_io_source,
                offshore_leaks=offshore_leaks_source
            ),
            all_results=all_results,
            total_results=total_results,
            total_sanctioned=total_sanctioned,
            offshore_connections_found=False,
            sources_searched=sources_searched,
            sources_succeeded=sources_succeeded,
            sources_failed=sources_failed,
            fuzzy_threshold=self.fuzzy_threshold if search_type == "fuzzy" else None
        )
    
    def _score_results(
        self, 
        query: str, 
        results: List[Union[OpenSanctionsEntity, SanctionsIoEntity]],
        search_type: str
    ) -> List[Union[OpenSanctionsEntity, SanctionsIoEntity]]:
        """
        Calculate match scores and filter results based on search type
        
        Args:
            query: Search query
            results: List of entity results
            search_type: "exact" or "fuzzy"
            
        Returns:
            Filtered and scored results
        """
        scored_results = []
        
        for result in results:
            # Calculate match score
            score = self.fuzzy_matcher.calculate_score(query, result.name)
            
            # Apply filtering based on search type
            if search_type == "exact":
                # Exact mode: Only 100% matches
                if score < 100:
                    # Also check aliases for exact matches
                    alias_scores = [
                        self.fuzzy_matcher.calculate_score(query, alias)
                        for alias in result.aliases
                    ]
                    if not any(s == 100 for s in alias_scores):
                        continue
                    score = 100  # If alias matched exactly
            
            elif search_type == "fuzzy":
                # Fuzzy mode: Matches above threshold
                if score < self.fuzzy_threshold:
                    # Check aliases too
                    alias_scores = [
                        self.fuzzy_matcher.calculate_score(query, alias)
                        for alias in result.aliases
                    ]
                    if alias_scores:
                        score = max(alias_scores)
                    if score < self.fuzzy_threshold:
                        continue
            
            # Update match score
            result.match_score = score
            scored_results.append(result)
        
        # Sort by score
        scored_results.sort(key=lambda x: x.match_score, reverse=True)
        
        return scored_results
