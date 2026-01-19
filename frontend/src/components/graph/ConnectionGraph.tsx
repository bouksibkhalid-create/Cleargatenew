/**
 * Main connection graph visualization component
 */

import { useCallback, useMemo } from 'react';
import ReactFlow, {
    type Node,
    type Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { ConnectionGraph as GraphData } from '../../types/graph';
import { getNodeColor, formatRelationshipType } from '../../utils/graphUtils';

interface ConnectionGraphProps {
    data: GraphData;
    onNodeClick?: (nodeId: string) => void;
}

export default function ConnectionGraph({ data, onNodeClick }: ConnectionGraphProps) {
    // Convert to ReactFlow format
    const initialNodes: Node[] = useMemo(() => {
        return data.nodes.map((node, index) => {
            const angle = (index * 2 * Math.PI) / data.nodes.length;
            const radius = 300;
            const x = 400 + radius * Math.cos(angle);
            const y = 300 + radius * Math.sin(angle);

            return {
                id: node.id,
                type: undefined, // Use default React Flow node
                position: { x, y },
                data: {
                    label: node.label,
                },
                style: {
                    background: getNodeColor(node.node_type),
                    color: '#ffffff',
                    border: node.id === data.center_node_id ? '3px solid #1976d2' : '2px solid #333',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    minWidth: '120px',
                    textAlign: 'center',
                },
            };
        });
    }, [data.nodes, data.edges, data.center_node_id]);

    const initialEdges: Edge[] = useMemo(() => {
        return data.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: formatRelationshipType(edge.relationship_type),
            type: 'smoothstep',
            animated: edge.animated || false,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
            },
            style: {
                stroke: '#94a3b8',
                strokeWidth: 2,
            },
            labelStyle: {
                fontSize: 10,
                fill: '#64748b',
            },
            labelBgStyle: {
                fill: '#ffffff',
                fillOpacity: 0.8,
            },
        }));
    }, [data.edges]);

    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    const handleNodeClick: NodeMouseHandler = useCallback(
        (_event, node) => {
            if (onNodeClick) {
                onNodeClick(node.id);
            }
        },
        [onNodeClick]
    );

    return (
        <div className="h-[600px] relative bg-card border rounded-lg shadow-md">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                fitView
                minZoom={0.1}
                maxZoom={2}
            >
                <Background color="#e2e8f0" gap={16} />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        const nodeType = node.data.nodeType;
                        return getNodeColor(nodeType);
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                />
            </ReactFlow>

            {/* Legend */}
            <div className="absolute bottom-3 right-3 bg-background p-3 rounded-md shadow-md">
                <div className="text-xs font-semibold mb-1">Legend</div>
                {Object.entries({ Officer: '👤', Entity: '🏢', Intermediary: '🏦', Address: '📍' }).map(([type, icon]) => (
                    <div key={type} className="flex items-center gap-1 text-xs">
                        <span>{icon}</span>
                        <span>{type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
