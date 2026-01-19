
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import os
from src.utils.neo4j_client import Neo4jClient, get_neo4j_client
from src.utils.errors import APIError

# Mock environment variables
@pytest.fixture
def mock_env_credentials():
    with patch.dict(os.environ, {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "password"
    }):
        yield

@pytest.fixture
def mock_driver():
    driver_mock = AsyncMock()
    # session() is not async, it returns an async context manager
    driver_mock.session = MagicMock()
    
    session_mock = AsyncMock()
    result_mock = AsyncMock()
    
    # Setup session context manager
    driver_mock.session.return_value.__aenter__.return_value = session_mock
    driver_mock.session.return_value.__aexit__.return_value = None
    
    # Setup result behavior
    session_mock.run.return_value = result_mock
    result_mock.data.return_value = [{"test": 1}]
    result_mock.single.return_value = {"test": 1}
    
    return driver_mock

@pytest.mark.asyncio
async def test_initialization_env(mock_env_credentials):
    """Test initialization with environment variables"""
    # Reset singleton if it exists
    from src.utils import neo4j_client
    neo4j_client._neo4j_client = None
    
    client = Neo4jClient()
    assert client.uri == "bolt://localhost:7687"
    assert client.user == "neo4j"
    assert client.password == "password"

@pytest.mark.asyncio
async def test_initialization_args():
    """Test initialization with arguments"""
    client = Neo4jClient(
        uri="bolt://remote:7687",
        user="admin",
        password="secure",
        max_connection_lifetime=100
    )
    assert client.uri == "bolt://remote:7687"
    assert client.user == "admin"
    assert client.password == "secure"
    assert client.max_connection_lifetime == 100

def test_missing_credentials():
    """Test error on missing credentials"""
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ValueError, match="Neo4j credentials not configured"):
            Neo4jClient()

@pytest.mark.asyncio
async def test_connect(mock_env_credentials, mock_driver):
    """Test connection establishment"""
    client = Neo4jClient()
    
    with patch("neo4j.AsyncGraphDatabase.driver", return_value=mock_driver) as driver_factory:
        await client.connect()
        
        driver_factory.assert_called_once()
        assert client.driver == mock_driver
        # Verify connectivity check was called (implied by session creation)
        mock_driver.session.assert_called()

@pytest.mark.asyncio
async def test_verify_connectivity_success(mock_env_credentials, mock_driver):
    """Test successful connectivity check"""
    client = Neo4jClient()
    client.driver = mock_driver
    
    await client.verify_connectivity()
    
    # Verify correct query
    mock_driver.session.return_value.__aenter__.return_value.run.assert_called_with("RETURN 1 as test")

@pytest.mark.asyncio
async def test_verify_connectivity_failure(mock_env_credentials, mock_driver):
    """Test failed connectivity check (wrong result)"""
    client = Neo4jClient()
    client.driver = mock_driver
    
    # Mock invalid result
    mock_driver.session.return_value.__aenter__.return_value.run.return_value.single.return_value = {"test": 0}
    
    with pytest.raises(APIError, match="Neo4j connectivity test failed"):
        await client.verify_connectivity()

@pytest.mark.asyncio
async def test_execute_read(mock_env_credentials, mock_driver):
    """Test execute_read method"""
    client = Neo4jClient()
    client.driver = mock_driver
    
    # Mock data return
    expected_data = [{"name": "Entity 1"}]
    mock_driver.session.return_value.__aenter__.return_value.run.return_value.data.return_value = expected_data
    
    result = await client.execute_read("MATCH (n) RETURN n", {"limit": 1})
    
    assert result == expected_data
    mock_driver.session.return_value.__aenter__.return_value.run.assert_called_with("MATCH (n) RETURN n", {"limit": 1})

@pytest.mark.asyncio
async def test_context_manager(mock_env_credentials, mock_driver):
    """Test using client as context manager"""
    with patch("neo4j.AsyncGraphDatabase.driver", return_value=mock_driver):
        async with Neo4jClient() as client:
            assert client.driver is not None
            await client.execute_read("RETURN 1")
            
        # Verify close called on exit
        mock_driver.close.assert_called_once()

def test_singleton(mock_env_credentials):
    """Test singleton usage"""
    from src.utils import neo4j_client
    neo4j_client._neo4j_client = None
    
    client1 = get_neo4j_client()
    client2 = get_neo4j_client()
    
    assert client1 is client2
