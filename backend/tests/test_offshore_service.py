
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.services.offshore_service import OffshoreLeaksService
from src.utils.errors import APIError
from src.models.graph_models import OffshoreEntity

@pytest.fixture
def mock_neo4j_client():
    with patch("src.services.offshore_service.get_neo4j_client") as mock_get:
        client_mock = AsyncMock()
        mock_get.return_value = client_mock
        yield client_mock

@pytest.mark.asyncio
async def test_search_success(mock_neo4j_client):
    """Test successful search"""
    service = OffshoreLeaksService()
    
    # Mock data return
    mock_record = {
        "node_id": 123,
        "name": "Test Entity",
        "node_type": "Entity",
        "countries": "USA;UK",
        "jurisdiction": "BVI",
        "source_dataset": "Pandora Papers",
        "score": 8.5,
        "conn_count": 5,
        "connections": [
            {
                "entity_id": "456",
                "entity_name": "Officer 1",
                "entity_type": "Officer",
                "relationship": "DIRECTOR_OF"
            }
        ]
    }
    
    mock_neo4j_client.execute_read.return_value = [mock_record]
    
    results = await service.search("Test", limit=10)
    
    assert len(results) == 1
    entity = results[0]
    assert isinstance(entity, OffshoreEntity)
    assert entity.name == "Test Entity"
    assert entity.match_score == 85  # 8.5 * 10
    assert entity.countries == ["USA", "UK"]
    assert len(entity.connections) == 1
    
    # Verify Cypher execution
    args = mock_neo4j_client.execute_read.call_args
    assert args is not None
    query, params = args[0]
    assert "CALL db.index.fulltext.queryNodes" in query
    assert params["query"] == "Test"
    assert params["limit"] == 10

@pytest.mark.asyncio
async def test_search_error(mock_neo4j_client):
    """Test search error handling"""
    service = OffshoreLeaksService()
    
    mock_neo4j_client.execute_read.side_effect = Exception("DB Error")
    
    with pytest.raises(APIError, match="Offshore search failed"):
        await service.search("Test")

@pytest.mark.asyncio
async def test_get_by_id_success(mock_neo4j_client):
    """Test get_by_id success"""
    service = OffshoreLeaksService()
    
    mock_record = {
        "node_id": 123,
        "name": "Test Entity",
        "node_type": "Entity",
        "countries": "USA",
        "conn_count": 0,
        "connections": []
    }
    
    mock_neo4j_client.execute_read.return_value = [mock_record]
    
    entity = await service.get_by_id(123)
    
    assert entity is not None
    assert entity.name == "Test Entity"
    # verify injected score for get_by_id is handled (usually code sets it to 10.0 if missing, or we mock it)
    # The code sets it: records[0]["score"] = 10.0
    
    args = mock_neo4j_client.execute_read.call_args
    query, params = args[0]
    assert "MATCH (node)" in query
    assert params["node_id"] == 123

@pytest.mark.asyncio
async def test_get_by_id_not_found(mock_neo4j_client):
    """Test get_by_id returns None when not found"""
    service = OffshoreLeaksService()
    
    mock_neo4j_client.execute_read.return_value = []
    
    entity = await service.get_by_id(999)
    assert entity is None
