"""Fuzzy string matching service using RapidFuzz"""

from rapidfuzz import fuzz, process
from typing import List, Tuple, Optional
from src.utils.logger import get_logger

logger = get_logger(__name__)


class FuzzyMatcher:
    """
    Service for fuzzy string matching using RapidFuzz
    
    Uses token_sort_ratio algorithm which handles:
    - Different word orders (Putin Vladimir vs Vladimir Putin)
    - Extra/missing words
    - Typos and misspellings
    - Partial matches
    """
    
    def __init__(self, threshold: int = 80):
        """
        Initialize fuzzy matcher
        
        Args:
            threshold: Minimum similarity score (0-100) for a match
                      80 = good balance between precision and recall
                      90 = high precision, may miss some valid matches
                      70 = high recall, may include false positives
        """
        self.threshold = threshold
        logger.info("fuzzy_matcher_initialized", threshold=threshold)
    
    def calculate_score(self, query: str, candidate: str) -> int:
        """
        Calculate fuzzy match score between query and candidate
        
        Args:
            query: Search query string
            candidate: Candidate string to compare against
            
        Returns:
            Similarity score (0-100)
        """
        # Normalize strings
        query_normalized = self._normalize(query)
        candidate_normalized = self._normalize(candidate)
        
        # Calculate multiple scores and take the best one:
        # 1. token_sort_ratio - handles word order differences
        # 2. partial_ratio - handles partial/substring matches like "putin" in "vladimir putin"
        token_score = fuzz.token_sort_ratio(query_normalized, candidate_normalized)
        partial_score = fuzz.partial_ratio(query_normalized, candidate_normalized)
        
        # Use the higher of the two scores
        score = max(token_score, partial_score)
        
        logger.debug(
            "fuzzy_score_calculated",
            query=query,
            candidate=candidate,
            token_score=token_score,
            partial_score=partial_score,
            final_score=score
        )
        
        return score
    
    def is_match(self, query: str, candidate: str) -> Tuple[bool, int]:
        """
        Check if candidate matches query above threshold
        
        Args:
            query: Search query
            candidate: Candidate to test
            
        Returns:
            Tuple of (is_match, score)
        """
        score = self.calculate_score(query, candidate)
        is_match = score >= self.threshold
        
        return (is_match, score)
    
    def filter_matches(
        self, 
        query: str, 
        candidates: List[str],
        limit: Optional[int] = None
    ) -> List[Tuple[str, int, int]]:
        """
        Filter candidates that match query above threshold
        
        Args:
            query: Search query
            candidates: List of candidate strings
            limit: Optional limit on number of results
            
        Returns:
            List of (candidate, score, index) tuples sorted by score descending
        """
        query_normalized = self._normalize(query)
        
        # Use RapidFuzz's optimized extract function
        matches = process.extract(
            query_normalized,
            [self._normalize(c) for c in candidates],
            scorer=fuzz.token_sort_ratio,
            score_cutoff=self.threshold,
            limit=limit
        )
        
        # Map back to original candidates with scores
        results = []
        for match in matches:
            normalized_candidate, score, index = match
            original_candidate = candidates[index]
            results.append((original_candidate, score, index))
        
        logger.info(
            "fuzzy_matches_filtered",
            query=query,
            candidates_count=len(candidates),
            matches_count=len(results)
        )
        
        return results
    
    def _normalize(self, text: str) -> str:
        """
        Normalize text for matching
        
        Normalization steps:
        1. Convert to lowercase
        2. Remove common titles (Mr., Dr., etc.)
        3. Remove extra whitespace
        4. Remove special characters (keep letters, numbers, spaces)
        
        Args:
            text: Text to normalize
            
        Returns:
            Normalized text
        """
        # Lowercase
        text = text.lower()
        
        # Remove common titles
        titles = [
            "mr.", "mrs.", "ms.", "miss", "dr.", "prof.", "professor",
            "sir", "lord", "lady", "hon.", "rev.", "fr.", "sr."
        ]
        for title in titles:
            text = text.replace(title, "")
        
        # Remove common suffixes
        suffixes = ["jr.", "sr.", "ii", "iii", "iv", "esq."]
        for suffix in suffixes:
            text = text.replace(suffix, "")
        
        # Keep only alphanumeric and spaces
        text = ''.join(char if char.isalnum() or char.isspace() else ' ' for char in text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
    def get_best_match(
        self, 
        query: str, 
        candidates: List[str]
    ) -> Optional[Tuple[str, int]]:
        """
        Get single best matching candidate
        
        Args:
            query: Search query
            candidates: List of candidates
            
        Returns:
            Tuple of (best_candidate, score) or None if no match above threshold
        """
        if not candidates:
            return None
        
        matches = self.filter_matches(query, candidates, limit=1)
        
        if matches:
            candidate, score, _ = matches[0]
            return (candidate, score)
        
        return None
