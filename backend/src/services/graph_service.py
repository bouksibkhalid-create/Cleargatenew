"""Graph service for connection traversal"""

from typing import List, Set
from src.models.graph_models import ConnectionGraph, GraphNode, GraphEdge
from src.utils.neo4j_client import get_neo4j_client
from src.utils.logger import get_logger
from src.utils.errors import APIError

logger = get_logger(__name__)


class GraphService:
    """
    Service for graph traversal and connection queries
    """
    
    # Node type colors
    NODE_COLORS = {
        "Officer": "#3B82F6",      # Blue
        "Entity": "#10B981",       # Green
        "Intermediary": "#F59E0B", # Orange
        "Address": "#6B7280"       # Gray
    }
    
    def __init__(self):
        """Initialize service"""
        self.client = get_neo4j_client()
    
    async def get_connections(
        self,
        node_id: int,
        depth: int = 2,
        max_nodes: int = 50
    ) -> ConnectionGraph:
        """
        Get connection graph for a node
        
        Args:
            node_id: Central node ID
            depth: Traversal depth (1-3 hops)
            max_nodes: Maximum nodes to return
            
        Returns:
            ConnectionGraph with nodes and edges
            
        Raises:
            APIError: If query fails
        """
        logger.info(
            "graph_connections_started",
            node_id=node_id,
            depth=depth,
            max_nodes=max_nodes
        )
        
        try:
            # Variable-length pattern matching
            cypher = f"""
            MATCH (start)
            WHERE id(start) = $node_id
            
            MATCH path = (start)-[*1..{depth}]-(connected)
            WITH path, connected
            LIMIT $max_nodes
            
            WITH collect(path) as paths
            
            // Extract all unique nodes
            UNWIND paths as p
            UNWIND nodes(p) as n
            WITH DISTINCT n, paths
            
            // Get node properties
            WITH collect(DISTINCT {{
                id: toString(id(n)),
                label: n.name,
                node_type: labels(n)[0],
                properties: properties(n)
            }}) as nodes, paths
            
            // Extract all unique relationships
            UNWIND paths as p
            UNWIND relationships(p) as r
            WITH nodes, r
            
            WITH nodes, collect(DISTINCT {{
                id: toString(id(r)),
                source: toString(id(startNode(r))),
                target: toString(id(endNode(r))),
                relationship_type: type(r),
                properties: properties(r)
            }}) as edges
            
            RETURN nodes, edges
            """
            
            records = await self.client.execute_read(
                cypher,
                {
                    "node_id": node_id,
                    "max_nodes": max_nodes
                }
            )
            
            if not records or not records[0].get("nodes"):
                logger.warning("graph_no_connections", node_id=node_id)
                return ConnectionGraph(
                    nodes=[],
                    edges=[],
                    center_node_id=str(node_id),
                    depth=depth,
                    node_count=0,
                    edge_count=0
                )
            
            # Parse nodes and edges
            nodes_data = records[0]["nodes"]
            edges_data = records[0]["edges"]
            
            # Build graph nodes
            nodes = []
            for node_data in nodes_data:
                # Convert Neo4j types to JSON-serializable types
                properties = self._serialize_properties(node_data["properties"])
                
                node = GraphNode(
                    id=node_data["id"],
                    label=node_data["label"] or "Unknown",
                    node_type=node_data["node_type"],
                    properties=properties,
                    color=self.NODE_COLORS.get(
                        node_data["node_type"], 
                        "#6B7280"
                    )
                )
                nodes.append(node)
            
            # Build graph edges
            edges = []
            for edge_data in edges_data:
                # Convert Neo4j types in edge properties too
                properties = self._serialize_properties(edge_data.get("properties", {}))
                
                edge = GraphEdge(
                    id=edge_data["id"],
                    source=edge_data["source"],
                    target=edge_data["target"],
                    relationship_type=edge_data["relationship_type"],
                    properties=properties
                )
                edges.append(edge)
            
            # Deduplicate
            nodes = self._deduplicate_nodes(nodes)
            edges = self._deduplicate_edges(edges)
            
            logger.info(
                "graph_connections_success",
                node_id=node_id,
                node_count=len(nodes),
                edge_count=len(edges)
            )
            
            return ConnectionGraph(
                nodes=nodes,
                edges=edges,
                center_node_id=str(node_id),
                depth=depth,
                node_count=len(nodes),
                edge_count=len(edges)
            )
            
        except Exception as e:
            logger.error(
                "graph_connections_error",
                node_id=node_id,
                error=str(e),
                error_type=type(e).__name__
            )
            raise APIError(f"Graph query failed: {str(e)}", status_code=500)
    
    def _deduplicate_nodes(self, nodes: List[GraphNode]) -> List[GraphNode]:
        """Remove duplicate nodes by ID"""
        seen: Set[str] = set()
        unique = []
        
        for node in nodes:
            if node.id not in seen:
                seen.add(node.id)
                unique.append(node)
        
        return unique
    
    def _deduplicate_edges(self, edges: List[GraphEdge]) -> List[GraphEdge]:
        """Remove duplicate edges by source-target-type"""
        seen: Set[tuple] = set()
        unique = []
        
        for edge in edges:
            key = (edge.source, edge.target, edge.relationship_type)
            if key not in seen:
                seen.add(key)
                unique.append(edge)
        
        return unique
    
    def _serialize_properties(self, properties: dict) -> dict:
        """Convert Neo4j types to JSON-serializable types"""
        from neo4j.time import DateTime, Date, Time
        
        serialized = {}
        for key, value in properties.items():
            if isinstance(value, (DateTime, Date, Time)):
                serialized[key] = value.iso_format()
            elif isinstance(value, list):
                serialized[key] = [
                    v.iso_format() if isinstance(v, (DateTime, Date, Time)) else v
                    for v in value
                ]
            else:
                serialized[key] = value
        
        return serialized
