
import pytest
import json
from unittest.mock import AsyncMock, patch
from netlify.functions.connections import handler
from src.models.graph_models import ConnectionGraph, OffshoreEntity, GraphNode, GraphEdge
from src.utils.errors import APIError

@pytest.fixture
def mock_offshore_service():
    with patch("netlify.functions.connections.OffshoreLeaksService") as service_cls:
        service_mock = AsyncMock()
        service_cls.return_value = service_mock
        yield service_mock

@pytest.fixture
def mock_graph_service():
    with patch("netlify.functions.connections.GraphService") as service_cls:
        service_mock = AsyncMock()
        service_cls.return_value = service_mock
        yield service_mock

def test_handler_options():
    """Test OPTIONS request"""
    event = {"httpMethod": "OPTIONS"}
    response = handler(event, {})
    assert response["statusCode"] == 200
    assert "Access-Control-Allow-Origin" in response["headers"]

def test_handler_success(mock_offshore_service, mock_graph_service):
    """Test successful request"""
    # Mock data
    mock_offshore_service.get_by_id.return_value = OffshoreEntity(
        node_id=123, name="Entity", node_type="Entity", 
        countries=[], match_score=100, connections=[], connections_count=0
    )
    
    mock_graph_service.get_connections.return_value = ConnectionGraph(
        nodes=[], edges=[], center_node_id="123", depth=1, node_count=0, edge_count=0
    )
    
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "node_id": 123,
            "depth": 1,
            "max_nodes": 10
        })
    }
    
    response = handler(event, {})
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["node_id"] == 123
    assert "graph" in body

def test_handler_validation_error():
    """Test validation error"""
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            # Missing node_id
            "depth": 1
        })
    }
    
    response = handler(event, {})
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["error"] == "ValidationError"

def test_handler_not_found(mock_offshore_service, mock_graph_service):
    """Test node not found"""
    mock_offshore_service.get_by_id.return_value = None
    
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "node_id": 999,
            "depth": 1,
            "max_nodes": 10
        })
    }
    
    response = handler(event, {})
    assert response["statusCode"] == 404
    body = json.loads(response["body"])
    assert "not found" in body["message"]

def test_handler_api_error(mock_offshore_service, mock_graph_service):
    """Test API error from service"""
    mock_offshore_service.get_by_id.side_effect = APIError("DB Fail", status_code=503)
    
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "node_id": 123,
            "depth": 1,
            "max_nodes": 10
        })
    }
    
    response = handler(event, {})
    assert response["statusCode"] == 503
