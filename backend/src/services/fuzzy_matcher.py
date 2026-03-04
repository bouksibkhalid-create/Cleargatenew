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
        
        Uses a weighted approach:
        - token_sort_ratio: primary scorer, handles word-order differences
        - token_set_ratio: handles extra/missing tokens
        - partial_ratio: only trusted when query/candidate lengths are similar
          (prevents "khalid" matching "pio abogne de vera" at 50%+)
        
        Args:
            query: Search query string
            candidate: Candidate string to compare against
            
        Returns:
            Similarity score (0-100)
        """
        # Normalize strings
        query_normalized = self._normalize(query)
        candidate_normalized = self._normalize(candidate)
        
        if not query_normalized or not candidate_normalized:
            return 0
        
        # Primary: token_sort_ratio — handles word order (e.g. "Putin Vladimir" vs "Vladimir Putin")
        token_sort = fuzz.token_sort_ratio(query_normalized, candidate_normalized)
        
        # Secondary: token_set_ratio — handles extra/missing words
        token_set = fuzz.token_set_ratio(query_normalized, candidate_normalized)
        
        # Tertiary: partial_ratio — only trust it when lengths are comparable
        # This prevents short queries from inflating scores on long unrelated names
        partial = fuzz.partial_ratio(query_normalized, candidate_normalized)
        
        len_q = len(query_normalized)
        len_c = len(candidate_normalized)
        length_ratio = min(len_q, len_c) / max(len_q, len_c) if max(len_q, len_c) > 0 else 0
        
        # Penalize partial_ratio when lengths differ a lot
        # e.g. "khalid bouksib" (14 chars) vs "pio abogne de vera" (18 chars) → ratio ~0.78 → mild penalty
        # e.g. "khalid" (6 chars) vs "khalid al-barnawi" (17 chars) → ratio ~0.35 → heavy penalty
        adjusted_partial = int(partial * length_ratio)
        
        # Take the best of the reliable scores
        score = max(token_sort, token_set, adjusted_partial)
        
        logger.debug(
            "fuzzy_score_calculated",
            query=query,
            candidate=candidate,
            token_sort=token_sort,
            token_set=token_set,
            partial=partial,
            adjusted_partial=adjusted_partial,
            length_ratio=round(length_ratio, 2),
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
