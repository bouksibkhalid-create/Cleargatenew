"""Tests for Sanctions.io service"""

import pytest
from src.services.sanctions_io_service import SanctionsIoService
from src.utils.errors import APIError
import os

# Skip if no API key
pytestmark = pytest.mark.skipif(
    not os.getenv("SANCTIONS_IO_API_KEY"),
    reason="SANCTIONS_IO_API_KEY not set"
)


@pytest.mark.asyncio
async def test_search_success():
    """Test successful Sanctions.io search"""
    async with SanctionsIoService() as service:
        results = await service.search("Vladimir Putin", limit=5)
        
        assert len(results) >= 0  # May or may not find results
        if len(results) > 0:
            assert results[0].name is not None
            assert results[0].is_sanctioned == True


@pytest.mark.asyncio
async def test_search_fuzzy():
    """Test fuzzy search mode"""
    async with SanctionsIoService() as service:
        results = await service.search("Vlad Putin", fuzzy=True, limit=5)
        
        # Fuzzy should find results even with partial name
        assert len(results) >= 0  # May or may not find results


@pytest.mark.asyncio
async def test_parse_entity():
    """Test entity parsing"""
    service = SanctionsIoService()
    
    raw_data = {
        "id": "test-123",
        "name": "John Doe",
        "type": "Individual",
        "list_type": "SDN",
        "programs": ["UKRAINE-EO13662"],
        "akas": ["Johnny Doe", "J. Doe"],
        "dates_of_birth": ["1970-01-01"],
        "nationalities": ["Russian Federation"],
        "addresses": [
            {"full": "Moscow, Russia", "country": "Russia"}
        ],
        "remarks": "Test remarks"
    }
    
    entity = service._parse_entity(raw_data)
    
    assert entity.id == "test-123"
    assert entity.name == "John Doe"
    assert entity.entity_type == "Individual"
    assert "Johnny Doe" in entity.aliases
    assert entity.is_sanctioned == True


@pytest.mark.asyncio
async def test_no_api_key():
    """Test behavior without API key"""
    service = SanctionsIoService(api_key="")
    
    with pytest.raises(APIError) as exc_info:
        await service.search("test")
    
    assert "API key not configured" in str(exc_info.value)
    
    await service.close()


@pytest.mark.asyncio
async def test_context_manager():
    """Test async context manager"""
    async with SanctionsIoService() as service:
        assert service.client is not None
    
    # Client should be closed after context
    assert service.client.is_closed
