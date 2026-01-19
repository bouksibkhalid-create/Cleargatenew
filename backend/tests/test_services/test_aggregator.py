"""Tests for result aggregator service"""

import pytest
from src.services.aggregator import ResultAggregator
from src.models.responses import OpenSanctionsEntity, SanctionsIoEntity, SanctionProgram


def test_aggregate_both_sources():
    """Test aggregating results from both sources"""
    aggregator = ResultAggregator(fuzzy_threshold=80)
    
    opensanctions_results = [
        OpenSanctionsEntity(
            id="os-1",
            name="Vladimir Putin",
            schema="Person",
            is_sanctioned=True,
            sanction_programs=[],
            url="https://example.com/1"
        )
    ]
    
    sanctions_io_results = [
        SanctionsIoEntity(
            id="sio-1",
            name="Putin, Vladimir",
            entity_type="Individual",
            list_type="SDN",
            programs=["OFAC"]
        )
    ]
    
    response = aggregator.aggregate(
        query="Vladimir Putin",
        search_type="fuzzy",
        opensanctions_results=opensanctions_results,
        sanctions_io_results=sanctions_io_results,
        sources_requested=["opensanctions", "sanctions_io"]
    )
    
    assert response.total_results == 2
    assert response.total_sanctioned == 2
    assert len(response.sources_succeeded) == 2
    assert len(response.all_results) == 2


def test_aggregate_with_errors():
    """Test aggregation when one source fails"""
    aggregator = ResultAggregator()
    
    response = aggregator.aggregate(
        query="Test",
        search_type="exact",
        opensanctions_results=[],
        sanctions_io_results=[],
        opensanctions_error="API timeout",
        sanctions_io_error=None,
        sources_requested=["opensanctions", "sanctions_io"]
    )
    
    assert "opensanctions" in response.sources_failed
    assert "sanctions_io" in response.sources_succeeded
    assert response.total_results == 0


def test_exact_mode_filtering():
    """Test exact mode only returns 100% matches"""
    aggregator = ResultAggregator(fuzzy_threshold=80)
    
    opensanctions_results = [
        OpenSanctionsEntity(
            id="os-1",
            name="Vladimir Putin",
            schema="Person",
            is_sanctioned=True,
            sanction_programs=[],
            url="https://example.com/1"
        ),
        OpenSanctionsEntity(
            id="os-2",
            name="Vlad Putin",  # Not exact match
            schema="Person",
            is_sanctioned=False,
            sanction_programs=[],
            url="https://example.com/2"
        )
    ]
    
    response = aggregator.aggregate(
        query="Vladimir Putin",
        search_type="exact",
        opensanctions_results=opensanctions_results,
        sanctions_io_results=[],
        sources_requested=["opensanctions"]
    )
    
    # Only exact match should be returned
    assert response.total_results == 1
    assert response.all_results[0].name == "Vladimir Putin"


def test_fuzzy_mode_filtering():
    """Test fuzzy mode returns matches above threshold"""
    aggregator = ResultAggregator(fuzzy_threshold=80)
    
    opensanctions_results = [
        OpenSanctionsEntity(
            id="os-1",
            name="Vladimir Putin",
            schema="Person",
            is_sanctioned=True,
            sanction_programs=[],
            url="https://example.com/1"
        ),
        OpenSanctionsEntity(
            id="os-2",
            name="John Smith",  # Below threshold
            schema="Person",
            is_sanctioned=False,
            sanction_programs=[],
            url="https://example.com/2"
        )
    ]
    
    response = aggregator.aggregate(
        query="Vladimir Putin",
        search_type="fuzzy",
        opensanctions_results=opensanctions_results,
        sanctions_io_results=[],
        sources_requested=["opensanctions"]
    )
    
    # Only fuzzy matches above threshold
    assert response.total_results >= 1
    assert all(r.match_score >= 80 for r in response.all_results)


def test_match_score_sorting():
    """Test results are sorted by match score"""
    aggregator = ResultAggregator(fuzzy_threshold=70)
    
    opensanctions_results = [
        OpenSanctionsEntity(
            id="os-1",
            name="Vlad Putin",
            schema="Person",
            is_sanctioned=False,
            sanction_programs=[],
            url="https://example.com/1"
        ),
        OpenSanctionsEntity(
            id="os-2",
            name="Vladimir Putin",
            schema="Person",
            is_sanctioned=True,
            sanction_programs=[],
            url="https://example.com/2"
        )
    ]
    
    response = aggregator.aggregate(
        query="Vladimir Putin",
        search_type="fuzzy",
        opensanctions_results=opensanctions_results,
        sanctions_io_results=[],
        sources_requested=["opensanctions"]
    )
    
    # Results should be sorted by score (descending)
    scores = [r.match_score for r in response.all_results]
    assert scores == sorted(scores, reverse=True)


def test_alias_matching():
    """Test matching against aliases"""
    aggregator = ResultAggregator(fuzzy_threshold=80)
    
    opensanctions_results = [
        OpenSanctionsEntity(
            id="os-1",
            name="John Doe",
            aliases=["Johnny Doe", "J. Doe"],
            schema="Person",
            is_sanctioned=False,
            sanction_programs=[],
            url="https://example.com/1"
        )
    ]
    
    response = aggregator.aggregate(
        query="Johnny Doe",
        search_type="exact",
        opensanctions_results=opensanctions_results,
        sanctions_io_results=[],
        sources_requested=["opensanctions"]
    )
    
    # Should match via alias
    assert response.total_results >= 1
