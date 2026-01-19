"""Graph data models for Neo4j visualization"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal
from datetime import datetime


class GraphNode(BaseModel):
    """
    Single node in the graph visualization
    """
    id: str = Field(..., description="Unique node identifier")
    label: str = Field(..., description="Display label for the node")
    node_type: Literal["Officer", "Entity", "Intermediary", "Address"] = Field(
        ..., 
        description="Type of node"
    )
    
    # Position (optional - can be calculated by frontend)
    x: Optional[float] = Field(None, description="X coordinate")
    y: Optional[float] = Field(None, description="Y coordinate")
    
    # Visual properties
    size: Optional[int] = Field(None, description="Node size based on connections")
    color: Optional[str] = Field(None, description="Node color")
    
    # Node data
    properties: Dict[str, Any] = Field(
        default_factory=dict,
        description="All node properties from Neo4j"
    )


class GraphEdge(BaseModel):
    """
    Single edge in the graph visualization
    """
    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    relationship_type: str = Field(..., description="Type of relationship")
    
    # Edge data
    properties: Dict[str, Any] = Field(
        default_factory=dict,
        description="Relationship properties"
    )
    
    # Visual properties
    animated: bool = Field(default=False, description="Whether edge is animated")


class ConnectionGraph(BaseModel):
    """
    Complete graph with nodes and edges
    """
    nodes: List[GraphNode] = Field(..., description="List of graph nodes")
    edges: List[GraphEdge] = Field(..., description="List of graph edges")
    
    # Metadata
    center_node_id: Optional[str] = Field(
        None, 
        description="ID of the central/query node"
    )
    depth: int = Field(..., description="Depth of graph traversal")
    node_count: int = Field(..., description="Total number of nodes")
    edge_count: int = Field(..., description="Total number of edges")


class OffshoreConnection(BaseModel):
    """
    Single connection to an offshore entity
    """
    entity_id: str = Field(..., description="Connected entity ID")
    entity_name: str = Field(..., description="Connected entity name")
    entity_type: str = Field(..., description="Type of connected entity")
    relationship: str = Field(..., description="Relationship type")
    jurisdiction: Optional[str] = Field(None, description="Jurisdiction if entity")


class OffshoreEntity(BaseModel):
    """
    Single entity from Offshore Leaks
    """
    node_id: int = Field(..., description="Neo4j internal node ID")
    name: Optional[str] = Field(default="Unknown", description="Entity name")
    node_type: Literal["Officer", "Entity", "Intermediary", "Address"] = Field(
        ...,
        description="Type of node"
    )
    
    # Officer-specific
    countries: List[str] = Field(
        default_factory=list,
        description="Associated countries"
    )
    
    # Entity-specific
    jurisdiction: Optional[str] = Field(None, description="Jurisdiction")
    jurisdiction_description: Optional[str] = Field(None, description="Jurisdiction name")
    incorporation_date: Optional[str] = Field(None, description="Date of incorporation")
    service_provider: Optional[str] = Field(None, description="Service provider")
    company_type: Optional[str] = Field(None, description="Type of company")
    status: Optional[str] = Field(None, description="Entity status")
    
    # Address-specific
    address: Optional[str] = Field(None, description="Full address")
    
    # Metadata
    source_dataset: str = Field(..., description="Source dataset (Panama Papers, etc)")
    connections_count: int = Field(default=0, description="Number of direct connections")
    
    # Connections preview
    connections: List[OffshoreConnection] = Field(
        default_factory=list,
        description="Preview of connections (limited)"
    )
    
    # Match score (from fuzzy matching)
    match_score: int = Field(
        default=100,
        ge=0,
        le=100,
        description="Match score for search query"
    )
    
    # Source identifier
    source: Literal["offshore_leaks"] = "offshore_leaks"


class ConnectionRequest(BaseModel):
    """Request for graph connections"""
    node_id: int = Field(..., description="Neo4j node ID to get connections for")
    depth: int = Field(
        default=2,
        ge=1,
        le=3,
        description="Depth of graph traversal (1-3)"
    )
    max_nodes: int = Field(
        default=50,
        ge=10,
        le=100,
        description="Maximum number of nodes to return"
    )


class ConnectionResponse(BaseModel):
    """Response with graph connections"""
    node_id: int = Field(..., description="Central node ID")
    node_name: str = Field(..., description="Central node name")
    graph: ConnectionGraph = Field(..., description="Connection graph")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
