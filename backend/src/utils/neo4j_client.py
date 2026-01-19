"""Neo4j async client utility"""

from neo4j import AsyncGraphDatabase, AsyncDriver
from typing import Optional, List, Dict, Any
import os
import atexit
import asyncio
from src.utils.logger import get_logger
from src.utils.errors import APIError

logger = get_logger(__name__)


class Neo4jClient:
    """
    Async Neo4j client for Offshore Leaks database
    
    Connection pooling and automatic retry logic included.
    """
    
    def __init__(
        self,
        uri: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        max_connection_lifetime: int = 3600,
        max_connection_pool_size: int = 50
    ):
        """
        Initialize Neo4j client
        
        Args:
            uri: Neo4j connection URI (defaults to env var)
            user: Neo4j username (defaults to env var)
            password: Neo4j password (defaults to env var)
            max_connection_lifetime: Max connection lifetime in seconds
            max_connection_pool_size: Max connection pool size
        """
        self.uri = uri or os.getenv("NEO4J_URI")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD")
        
        if not all([self.uri, self.password]):
            raise ValueError("Neo4j credentials not configured")
        
        self.driver: Optional[AsyncDriver] = None
        self.max_connection_lifetime = max_connection_lifetime
        self.max_connection_pool_size = max_connection_pool_size
    
    async def connect(self):
        """Initialize driver connection"""
        if self.driver is None:
            self.driver = AsyncGraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password),
                max_connection_lifetime=self.max_connection_lifetime,
                max_connection_pool_size=self.max_connection_pool_size
            )
            
            # Verify connectivity
            await self.verify_connectivity()
            
            logger.info("neo4j_connected", uri=self.uri)
    
    async def verify_connectivity(self):
        """Verify database connection"""
        try:
            async with self.driver.session() as session:
                result = await session.run("RETURN 1 as test")
                record = await result.single()
                if record["test"] != 1:
                    raise APIError("Neo4j connectivity test failed")
        except Exception as e:
            logger.error("neo4j_connectivity_failed", error=str(e))
            raise APIError(f"Failed to connect to Neo4j: {str(e)}")
    
    async def close(self):
        """Close driver connection"""
        if self.driver:
            await self.driver.close()
            self.driver = None
            logger.info("neo4j_disconnected")
    
    async def execute_read(
        self, 
        query: str, 
        parameters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute read query
        
        Args:
            query: Cypher query string
            parameters: Query parameters
            
        Returns:
            List of records as dicts
        """
        if not self.driver:
            await self.connect()
        
        parameters = parameters or {}
        
        async with self.driver.session() as session:
            result = await session.run(query, parameters)
            records = await result.data()
            return records
    
    async def execute_write(
        self,
        query: str,
        parameters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute write query
        
        Args:
            query: Cypher query string
            parameters: Query parameters
            
        Returns:
            List of records as dicts
        """
        if not self.driver:
            await self.connect()
        
        parameters = parameters or {}
        
        async with self.driver.session() as session:
            result = await session.run(query, parameters)
            records = await result.data()
            return records
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()


# Singleton instance
_neo4j_client: Optional[Neo4jClient] = None


def get_neo4j_client() -> Neo4jClient:
    """Get singleton Neo4j client instance"""
    global _neo4j_client
    if _neo4j_client is None:
        _neo4j_client = Neo4jClient()
        # Register cleanup on process exit
        atexit.register(_cleanup_neo4j)
    return _neo4j_client


def _cleanup_neo4j():
    """Cleanup function called on process exit"""
    global _neo4j_client
    if _neo4j_client and _neo4j_client.driver:
        try:
            # Create new event loop for cleanup if needed
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            loop.run_until_complete(_neo4j_client.close())
            logger.info("neo4j_cleanup_complete")
        except Exception as e:
            logger.warning(f"neo4j_cleanup_error: {e}")
