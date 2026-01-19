/**
 * Graph data types for Neo4j visualization
 */

export interface GraphNode {
    id: string;
    label: string;
    node_type: 'Officer' | 'Entity' | 'Intermediary' | 'Address';
    x?: number;
    y?: number;
    size?: number;
    color?: string;
    properties: Record<string, any>;
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    relationship_type: string;
    properties: Record<string, any>;
    animated?: boolean;
}

export interface ConnectionGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    center_node_id?: string;
    depth: number;
    node_count: number;
    edge_count: number;
}

export interface ConnectionRequest {
    node_id: number;
    depth?: number;
    max_nodes?: number;
}

export interface ConnectionResponse {
    node_id: number;
    node_name: string;
    graph: ConnectionGraph;
    timestamp: string;
}
