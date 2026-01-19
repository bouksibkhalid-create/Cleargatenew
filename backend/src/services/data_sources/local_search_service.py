"""
Local Sanctions Search Service

Provides unified search across all downloaded sanctions sources.
Caches data locally and searches without API calls.
"""

from typing import Dict, List, Optional
from rapidfuzz import fuzz, process
from src.utils.logger import get_logger
from .ofac_downloader import OFACDownloader
from .eu_downloader import EUDownloader
from .uk_downloader import UKDownloader
from .un_downloader import UNDownloader
from .canada_downloader import CanadaDownloader
from .data_normalizer import SanctionsNormalizer

logger = get_logger(__name__)


class LocalSanctionsService:
    """
    Search sanctions data from local cache.
    
    Features:
    - Downloads from OFAC, EU, UK, UN, Canada
    - Normalizes to unified format
    - Fuzzy name matching
    - Caches locally, minimal API calls
    """
    
    def __init__(self, fuzzy_threshold: int = 70):
        self.fuzzy_threshold = fuzzy_threshold
        self.normalizer = SanctionsNormalizer()
        
        # Initialize downloaders
        self.downloaders = {
            'OFAC': OFACDownloader(),
            'EU': EUDownloader(),
            'UK': UKDownloader(),
            'UN': UNDownloader(),
            'Canada': CanadaDownloader(),
        }
        
        # Cached normalized entities
        self._cache: Dict[str, List[Dict]] = {}
    
    def _load_source(self, source: str, force_refresh: bool = False) -> List[Dict]:
        """Load and normalize entities from a source"""
        
        if source not in self.downloaders:
            return []
        
        if source in self._cache and not force_refresh:
            return self._cache[source]
        
        try:
            downloader = self.downloaders[source]
            raw_entities = downloader.get_entities(force_refresh=force_refresh)
            normalized = self.normalizer.normalize_all(raw_entities, source)
            self._cache[source] = normalized
            
            logger.info(
                "local_source_loaded",
                source=source,
                count=len(normalized)
            )
            
            return normalized
            
        except Exception as e:
            logger.error(
                "local_source_load_error",
                source=source,
                error=str(e)
            )
            return []
    
    def load_all_sources(self, force_refresh: bool = False) -> Dict[str, int]:
        """Load all sources into cache"""
        counts = {}
        for source in self.downloaders.keys():
            entities = self._load_source(source, force_refresh)
            counts[source] = len(entities)
        return counts
    
    def search(
        self,
        query: str,
        sources: List[str] = None,
        limit: int = 50,
        fuzzy: bool = True
    ) -> List[Dict]:
        """
        Search across all loaded sources.
        
        Args:
            query: Search query (name)
            sources: List of sources to search (default: all)
            limit: Max results to return
            fuzzy: Enable fuzzy matching
            
        Returns:
            List of matching entities with match scores
        """
        if sources is None:
            sources = list(self.downloaders.keys())
        
        # Load sources if not cached
        for source in sources:
            if source not in self._cache:
                self._load_source(source)
        
        # Collect all entities to search
        all_entities = []
        for source in sources:
            all_entities.extend(self._cache.get(source, []))
        
        if not all_entities:
            logger.warning("local_search_no_entities")
            return []
        
        # Search
        results = []
        query_lower = query.lower()
        
        for entity in all_entities:
            score = self._calculate_match_score(query_lower, entity, fuzzy)
            
            if score >= self.fuzzy_threshold:
                entity_with_score = entity.copy()
                entity_with_score['matchScore'] = score
                results.append(entity_with_score)
        
        # Sort by score
        results.sort(key=lambda x: x['matchScore'], reverse=True)
        
        logger.info(
            "local_search_complete",
            query=query,
            results=len(results[:limit])
        )
        
        return results[:limit]
    
    def _calculate_match_score(
        self,
        query: str,
        entity: Dict,
        fuzzy: bool
    ) -> int:
        """Calculate match score for an entity"""
        
        name = entity.get('name', '').lower()
        aliases = [a.lower() for a in entity.get('aliases', [])]
        
        # Exact match
        if query == name:
            return 100
        
        if query in aliases:
            return 100
        
        # Contains match
        if query in name:
            return 95
        
        if any(query in a for a in aliases):
            return 90
        
        # Fuzzy match
        if fuzzy:
            # Check primary name
            name_score = fuzz.ratio(query, name)
            
            # Check aliases
            alias_scores = [fuzz.ratio(query, a) for a in aliases]
            best_alias_score = max(alias_scores) if alias_scores else 0
            
            # Partial matching for multi-word names
            partial_score = fuzz.partial_ratio(query, name)
            
            return max(name_score, best_alias_score, partial_score)
        
        return 0
    
    def get_entity_by_id(self, entity_id: str) -> Optional[Dict]:
        """Get a specific entity by ID"""
        
        for source_entities in self._cache.values():
            for entity in source_entities:
                if entity.get('id') == entity_id:
                    return entity
        
        return None
    
    def get_stats(self) -> Dict[str, int]:
        """Get counts per source"""
        return {
            source: len(entities)
            for source, entities in self._cache.items()
        }


# Singleton instance
_local_service: Optional[LocalSanctionsService] = None


def get_local_sanctions_service() -> LocalSanctionsService:
    """Get singleton instance"""
    global _local_service
    if _local_service is None:
        _local_service = LocalSanctionsService()
    return _local_service
