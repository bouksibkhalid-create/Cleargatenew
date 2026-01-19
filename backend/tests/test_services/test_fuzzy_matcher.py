"""Tests for fuzzy matching service"""

import pytest
from src.services.fuzzy_matcher import FuzzyMatcher


def test_exact_match():
    """Test exact name matching"""
    matcher = FuzzyMatcher(threshold=80)
    score = matcher.calculate_score("Vladimir Putin", "Vladimir Putin")
    assert score == 100


def test_reversed_name():
    """Test reversed name order"""
    matcher = FuzzyMatcher(threshold=80)
    score = matcher.calculate_score("Putin Vladimir", "Vladimir Putin")
    assert score >= 90  # Should be high but maybe not 100


def test_with_title():
    """Test matching with titles"""
    matcher = FuzzyMatcher(threshold=80)
    score = matcher.calculate_score("Mr. John Smith", "John Smith")
    assert score >= 95


def test_typo_handling():
    """Test handling of typos"""
    matcher = FuzzyMatcher(threshold=70)
    score = matcher.calculate_score("Vlad Putin", "Vladimir Putin")
    assert score >= 60  # Should still match but lower score


def test_filter_matches():
    """Test filtering multiple candidates"""
    matcher = FuzzyMatcher(threshold=80)
    candidates = [
        "Vladimir Putin",
        "Vladimir Vladimirovich Putin",
        "John Smith",
        "Putin, Vladimir"
    ]
    
    matches = matcher.filter_matches("Vladimir Putin", candidates)
    
    assert len(matches) >= 2  # Should match multiple Putin variations
    assert matches[0][1] >= 80  # All matches should be above threshold


def test_no_matches():
    """Test when no candidates match"""
    matcher = FuzzyMatcher(threshold=90)
    candidates = ["John Smith", "Jane Doe"]
    
    matches = matcher.filter_matches("Vladimir Putin", candidates)
    
    assert len(matches) == 0


def test_normalization():
    """Test text normalization"""
    matcher = FuzzyMatcher(threshold=80)
    
    # Test title removal
    normalized = matcher._normalize("Mr. John Smith Jr.")
    assert "mr" not in normalized.lower()
    assert "jr" not in normalized.lower()
    
    # Test special character removal
    normalized = matcher._normalize("John-Smith (CEO)")
    assert "john" in normalized.lower()
    assert "smith" in normalized.lower()


def test_is_match():
    """Test is_match method"""
    matcher = FuzzyMatcher(threshold=85)
    
    is_match, score = matcher.is_match("Vladimir Putin", "Vladimir Putin")
    assert is_match is True
    assert score == 100
    
    is_match, score = matcher.is_match("Vladimir Putin", "John Smith")
    assert is_match is False
    assert score < 85


def test_get_best_match():
    """Test get_best_match method"""
    matcher = FuzzyMatcher(threshold=80)
    candidates = [
        "John Smith",
        "Vladimir Putin",
        "Vladimir Vladimirovich Putin"
    ]
    
    best = matcher.get_best_match("Vladimir Putin", candidates)
    
    assert best is not None
    assert "Putin" in best[0]
    assert best[1] >= 80


def test_get_best_match_no_results():
    """Test get_best_match with no matches"""
    matcher = FuzzyMatcher(threshold=95)
    candidates = ["John Smith", "Jane Doe"]
    
    best = matcher.get_best_match("Vladimir Putin", candidates)
    
    assert best is None
