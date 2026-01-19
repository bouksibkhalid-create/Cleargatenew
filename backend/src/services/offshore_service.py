"""Offshore Leaks service for searching ICIJ data in Neo4j"""

from typing import List, Optional
from src.models.graph_models import OffshoreEntity, OffshoreConnection
from src.utils.neo4j_client import get_neo4j_client
from src.utils.logger import get_logger
from src.utils.errors import APIError, APITimeoutError

logger = get_logger(__name__)


class OffshoreLeaksService:
    """
    Service for searching ICIJ Offshore Leaks data in Neo4j
    """
    
    def __init__(self):
        """Initialize service"""
        self.client = get_neo4j_client()
    
    async def search(
        self, 
        query: str,
        limit: int = 10
    ) -> List[OffshoreEntity]:
        """
        Search offshore leaks database using full-text search
        
        Args:
            query: Name to search for
            limit: Maximum number of results
            
        Returns:
            List of matching offshore entities
            
        Raises:
            APIError: If Neo4j query fails
            APITimeoutError: If query times out
        """
        logger.info(
            "offshore_search_started",
            query=query,
            limit=limit
        )
        
        try:
            # Try fulltext search first (requires index)
            records = await self._fulltext_search(query, limit)
            
        except Exception as e:
            error_str = str(e).lower()
            
            # Check if it's a missing index error
            if "no such index" in error_str or "index not found" in error_str:
                logger.warning(
                    "offshore_fulltext_index_missing",
                    query=query,
                    error=str(e),
                    fallback="standard_search"
                )
                # Fall back to standard search
                records = await self._standard_search(query, limit)
            else:
                logger.error(
                    "offshore_search_error",
                    query=query,
                    error=str(e),
                    error_type=type(e).__name__
                )
                raise APIError(f"Offshore search failed: {str(e)}")
        
        logger.info(
            "offshore_search_success",
            query=query,
            results_count=len(records)
        )
        
        # Parse records into entities
        entities = []
        for record in records:
            entity = self._parse_record(record)
            entities.append(entity)
        
        return entities
    
    async def _fulltext_search(self, query: str, limit: int) -> list:
        """Full-text search using Neo4j fulltext index"""
        cypher = """
        CALL db.index.fulltext.queryNodes('offshore_fulltext', $query)
        YIELD node, score
        WHERE score > 0.3
        WITH node, score
        ORDER BY score DESC
        LIMIT $limit
        
        // Get connection count
        OPTIONAL MATCH (node)-[r]-()
        WITH node, score, count(DISTINCT r) as conn_count
        
        // Get sample connections (max 5)
        OPTIONAL MATCH (node)-[rel]-(connected)
        WITH node, score, conn_count, 
             collect(DISTINCT {
                 entity_id: toString(id(connected)),
                 entity_name: connected.name,
                 entity_type: labels(connected)[0],
                 relationship: type(rel),
                 jurisdiction: connected.jurisdiction
             })[0..5] as connections
        
        RETURN 
            id(node) as node_id,
            node.name as name,
            labels(node)[0] as node_type,
            node.countries as countries,
            node.jurisdiction as jurisdiction,
            node.jurisdiction_description as jurisdiction_description,
            node.incorporation_date as incorporation_date,
            node.service_provider as service_provider,
            node.company_type as company_type,
            node.status as status,
            node.address as address,
            node.sourceID as source_dataset,
            score,
            conn_count,
            connections
        """
        
        return await self.client.execute_read(
            cypher,
            {"query": query, "limit": limit}
        )
    
    async def _standard_search(self, query: str, limit: int) -> list:
        """Fallback search using CONTAINS (slower but no index required)"""
        cypher = """
        MATCH (node)
        WHERE node.name CONTAINS $query
           OR node.address CONTAINS $query
        WITH node, 
             CASE WHEN node.name CONTAINS $query THEN 1.0 ELSE 0.5 END as score
        ORDER BY score DESC
        LIMIT $limit
        
        // Get connection count
        OPTIONAL MATCH (node)-[r]-()
        WITH node, score, count(DISTINCT r) as conn_count
        
        // Get sample connections (max 5)
        OPTIONAL MATCH (node)-[rel]-(connected)
        WITH node, score, conn_count, 
             collect(DISTINCT {
                 entity_id: toString(id(connected)),
                 entity_name: connected.name,
                 entity_type: labels(connected)[0],
                 relationship: type(rel),
                 jurisdiction: connected.jurisdiction
             })[0..5] as connections
        
        RETURN 
            id(node) as node_id,
            node.name as name,
            labels(node)[0] as node_type,
            node.countries as countries,
            node.jurisdiction as jurisdiction,
            node.jurisdiction_description as jurisdiction_description,
            node.incorporation_date as incorporation_date,
            node.service_provider as service_provider,
            node.company_type as company_type,
            node.status as status,
            node.address as address,
            node.sourceID as source_dataset,
            score,
            conn_count,
            connections
        """
        
        return await self.client.execute_read(
            cypher,
            {"query": query, "limit": limit}
        )

    
    def _parse_record(self, record: dict) -> OffshoreEntity:
        """
        Parse Neo4j record into OffshoreEntity
        
        Args:
            record: Record dict from Neo4j
            
        Returns:
            OffshoreEntity object
        """
        # Parse countries (semicolon-separated string to list)
        countries = []
        if record.get("countries"):
            countries = record["countries"].split(";")
            countries = [c.strip() for c in countries if c.strip()]
        
        # Parse connections
        connections = []
        for conn_data in record.get("connections", []):
            if conn_data and conn_data.get("entity_name"):
                connection = OffshoreConnection(
                    entity_id=conn_data["entity_id"],
                    entity_name=conn_data["entity_name"],
                    entity_type=conn_data["entity_type"],
                    relationship=conn_data["relationship"],
                    jurisdiction=conn_data.get("jurisdiction")
                )
                connections.append(connection)
        
        # Calculate match score from Neo4j relevance score
        # Neo4j scores are typically 0-10+, normalize to 0-100
        raw_score = record.get("score", 0)
        match_score = min(100, int(raw_score * 10))
        
        return OffshoreEntity(
            node_id=record["node_id"],
            name=record.get("name") or "Unknown Entity",
            node_type=record["node_type"],
            countries=countries,
            jurisdiction=record.get("jurisdiction"),
            jurisdiction_description=record.get("jurisdiction_description"),
            incorporation_date=record.get("incorporation_date"),
            service_provider=record.get("service_provider"),
            company_type=record.get("company_type"),
            status=record.get("status"),
            address=record.get("address"),
            source_dataset=record.get("source_dataset", "Unknown"),
            connections_count=record.get("conn_count", 0),
            connections=connections,
            match_score=match_score
        )
    
    async def get_by_id(self, node_id: int) -> Optional[OffshoreEntity]:
        """
        Get entity by Neo4j node ID
        
        Args:
            node_id: Neo4j internal node ID
            
        Returns:
            OffshoreEntity or None if not found
        """
        logger.info("offshore_get_by_id", node_id=node_id)
        
        try:
            cypher = """
            MATCH (node)
            WHERE id(node) = $node_id
            
            OPTIONAL MATCH (node)-[r]-()
            WITH node, count(DISTINCT r) as conn_count
            
            OPTIONAL MATCH (node)-[rel]-(connected)
            WITH node, conn_count,
                 collect(DISTINCT {
                     entity_id: toString(id(connected)),
                     entity_name: connected.name,
                     entity_type: labels(connected)[0],
                     relationship: type(rel),
                     jurisdiction: connected.jurisdiction
                 })[0..5] as connections
            
            RETURN 
                id(node) as node_id,
                node.name as name,
                labels(node)[0] as node_type,
                node.countries as countries,
                node.jurisdiction as jurisdiction,
                node.jurisdiction_description as jurisdiction_description,
                node.incorporation_date as incorporation_date,
                node.service_provider as service_provider,
                node.company_type as company_type,
                node.status as status,
                node.address as address,
                node.sourceID as source_dataset,
                conn_count,
                connections
            """
            
            records = await self.client.execute_read(
                cypher,
                {"node_id": node_id}
            )
            
            if not records:
                return None
            
            # Add dummy score for parsing
            records[0]["score"] = 10.0
            
            return self._parse_record(records[0])
            
        except Exception as e:
            logger.error(
                "offshore_get_by_id_error",
                node_id=node_id,
                error=str(e)
            )
            raise APIError(f"Failed to get entity by ID: {str(e)}")
