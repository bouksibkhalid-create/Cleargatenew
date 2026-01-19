
import pytest
import json
from unittest.mock import AsyncMock, patch
from netlify.functions.health import handler

@pytest.fixture
def mock_neo4j_client():
    with patch("netlify.functions.health.get_neo4j_client") as mock_get:
        client_mock = AsyncMock()
        mock_get.return_value = client_mock
        yield client_mock

def test_health_success(mock_neo4j_client):
    """Test healthy status"""
    mock_neo4j_client.execute_read.return_value = [{"test": 1}]
    
    response = handler({}, {})
    
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["status"] == "healthy"
    assert body["services"]["neo4j"]["status"] == "healthy"

def test_health_degraded_db_fail(mock_neo4j_client):
    """Test degraded status on DB failure"""
    mock_neo4j_client.execute_read.side_effect = Exception("Connection refused")
    
    response = handler({}, {})
    
    assert response["statusCode"] == 503
    body = json.loads(response["body"])
    assert body["status"] == "degraded"
    assert body["services"]["neo4j"]["status"] == "unhealthy"
    assert "Connection refused" in body["services"]["neo4j"]["message"]

def test_health_degraded_db_invalid(mock_neo4j_client):
    """Test degraded status on invalid DB response"""
    mock_neo4j_client.execute_read.return_value = [{"test": 0}]
    
    response = handler({}, {})
    
    assert response["statusCode"] == 503
    body = json.loads(response["body"])
    assert body["status"] == "degraded"
    assert body["services"]["neo4j"]["status"] == "unhealthy"
