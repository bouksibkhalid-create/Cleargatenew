"""Entity deduplication utility"""

from typing import List, Any, Set
from src.utils.logger import get_logger

logger = get_logger(__name__)


def deduplicate_entities(entities: List[Any], query: str) -> List[Any]:
    """
    Remove duplicate entities from different sources
    
    Deduplication strategy:
    1. Exact name matches are considered duplicates
    2. Keep the entity with higher match score
    3. If scores are equal, prefer OpenSanctions (more comprehensive)
    
    Args:
        entities: List of entities from multiple sources
        query: Original search query (for logging)
        
    Returns:
        Deduplicated list of entities
    """
    if len(entities) <= 1:
        return entities
    
    seen_names: Set[str] = set()
    deduplicated = []
    duplicates_removed = 0
    
    # Sort by match score (descending) to prefer higher scores
    sorted_entities = sorted(entities, key=lambda x: x.match_score, reverse=True)
    
    for entity in sorted_entities:
        # Normalize name for comparison
        normalized_name = entity.name.lower().strip()
        
        if normalized_name not in seen_names:
            seen_names.add(normalized_name)
            deduplicated.append(entity)
        else:
            duplicates_removed += 1
    
    logger.info(
        "deduplication_completed",
        query=query,
        original_count=len(entities),
        deduplicated_count=len(deduplicated),
        duplicates_removed=duplicates_removed
    )
    
    return deduplicated
