
import pytest
from unittest.mock import AsyncMock, patch
from src.services.graph_service import GraphService
from src.utils.errors import APIError
from src.models.graph_models import ConnectionGraph

@pytest.fixture
def mock_neo4j_client():
    with patch("src.services.graph_service.get_neo4j_client") as mock_get:
        client_mock = AsyncMock()
        mock_get.return_value = client_mock
        yield client_mock

@pytest.fixture
def sample_graph_data():
    return {
        "nodes": [
            {
                "id": "1",
                "label": "Center Node",
                "node_type": "Entity",
                "properties": {"country": "USA"}
            },
            {
                "id": "2",
                "label": "Connected Node",
                "node_type": "Officer",
                "properties": {"role": "Director"}
            }
        ],
        "edges": [
            {
                "id": "101",
                "source": "1",
                "target": "2",
                "relationship_type": "DIRECTOR_OF",
                "properties": {"date": "2020"}
            }
        ]
    }

@pytest.mark.asyncio
async def test_get_connections_success(mock_neo4j_client, sample_graph_data):
    """Test successful graph retrieval"""
    service = GraphService()
    
    mock_neo4j_client.execute_read.return_value = [sample_graph_data]
    
    graph = await service.get_connections(node_id=1)
    
    assert isinstance(graph, ConnectionGraph)
    assert len(graph.nodes) == 2
    assert len(graph.edges) == 1
    assert graph.center_node_id == "1"
    
    # Verify node properties
    center = next(n for n in graph.nodes if n.id == "1")
    assert center.label == "Center Node"
    assert center.color == service.NODE_COLORS["Entity"]
    
    # Verify query params
    args = mock_neo4j_client.execute_read.call_args
    query, params = args[0]
    assert "MATCH (start)" in query
    assert params["node_id"] == 1
    assert params["max_nodes"] == 50

@pytest.mark.asyncio
async def test_get_connections_empty(mock_neo4j_client):
    """Test empty results"""
    service = GraphService()
    
    mock_neo4j_client.execute_read.return_value = []
    
    graph = await service.get_connections(node_id=999)
    
    assert len(graph.nodes) == 0
    assert len(graph.edges) == 0
    assert graph.node_count == 0

@pytest.mark.asyncio
async def test_deduplication(mock_neo4j_client, sample_graph_data):
    """Test node and edge deduplication"""
    service = GraphService()
    
    # Duplicate data
    data_with_dupes = {
        "nodes": sample_graph_data["nodes"] * 2,
        "edges": sample_graph_data["edges"] * 2
    }
    
    mock_neo4j_client.execute_read.return_value = [data_with_dupes]
    
    graph = await service.get_connections(node_id=1)
    
    assert len(graph.nodes) == 2  # Should remain 2 unique nodes
    assert len(graph.edges) == 1  # Should remain 1 unique edge

@pytest.mark.asyncio
async def test_graph_error(mock_neo4j_client):
    """Test graph service error handling"""
    service = GraphService()
    
    mock_neo4j_client.execute_read.side_effect = Exception("Graph fail")
    
    with pytest.raises(APIError, match="Graph query failed"):
        await service.get_connections(node_id=1)
