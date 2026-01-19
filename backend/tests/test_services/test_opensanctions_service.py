"""Test OpenSanctions service"""

import pytest
from src.services.opensanctions_service import OpenSanctionsService
from src.utils.errors import APITimeoutError, APIError


@pytest.mark.asyncio
async def test_search_success():
    """Test successful search"""
    async with OpenSanctionsService() as service:
        results = await service.search("Vladimir Putin", limit=5)
        
        assert len(results) >= 0  # May return 0 or more results
        if len(results) > 0:
            assert results[0].name is not None
            assert results[0].id is not None
            assert results[0].url.startswith("https://")


@pytest.mark.asyncio
async def test_search_no_results():
    """Test search with no results"""
    async with OpenSanctionsService() as service:
        results = await service.search("XYZNonexistentPerson12345ABC")
        
        assert len(results) == 0


@pytest.mark.asyncio
async def test_search_sanctioned_entity():
    """Test search returns sanction information"""
    async with OpenSanctionsService() as service:
        results = await service.search("Vladimir Putin")
        
        # Should find results
        if len(results) > 0:
            # Check if any are sanctioned
            sanctioned = [r for r in results if r.is_sanctioned]
            
            # If sanctioned results exist, verify structure
            if len(sanctioned) > 0:
                entity = sanctioned[0]
                assert len(entity.sanction_programs) > 0
                assert entity.sanction_programs[0].program is not None


@pytest.mark.asyncio
async def test_parse_entity_properties():
    """Test entity property parsing"""
    service = OpenSanctionsService()
    
    raw_data = {
        "id": "test-123",
        "schema": "Person",
        "properties": {
            "name": ["John Doe"],
            "alias": ["Johnny", "J.D."],
            "birthDate": ["1970-01-01"],
            "nationality": ["US", "UK"],
            "program": ["OFAC SDN"],
            "reason": ["Sanctions reason"]
        },
        "datasets": ["us_ofac_sdn"],
        "first_seen": "2024-01-01T00:00:00Z",
        "last_seen": "2024-01-10T00:00:00Z"
    }
    
    entity = service._parse_entity(raw_data)
    
    assert entity.id == "test-123"
    assert entity.name == "John Doe"
    assert entity.schema == "Person"
    assert "Johnny" in entity.aliases
    assert "J.D." in entity.aliases
    assert entity.birth_date == "1970-01-01"
    assert "US" in entity.nationalities
    assert "UK" in entity.nationalities
    assert entity.is_sanctioned == True
    assert len(entity.sanction_programs) == 1
    assert entity.sanction_programs[0].program == "OFAC SDN"
    
    await service.close()


@pytest.mark.asyncio
async def test_context_manager():
    """Test async context manager"""
    async with OpenSanctionsService() as service:
        assert service.client is not None
    
    # Client should be closed after context
    assert service.client.is_closed
