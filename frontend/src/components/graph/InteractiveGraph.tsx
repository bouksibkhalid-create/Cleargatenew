/**
 * Interactive Graph Component
 * Main graph visualization with pan/zoom controls and force-directed layout
 */

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    type Node,
    type Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    type NodeMouseHandler,
    BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { formatRelationshipType } from '../../utils/graphUtils';
import { useForceLayout } from './hooks/useForceLayout';
import GraphControlPanel from './GraphControlPanel';
import { useReactFlow } from 'reactflow';

interface InteractiveGraphProps {
    initialEntityId: string;
    initialEntityName: string;
}

// Color coding for different relationship types
function getRelationshipColor(type: string): string {
    const colors: Record<string, string> = {
        'OFFICER_OF': '#3b82f6',           // Blue
        'SHAREHOLDER_OF': '#10b981',       // Green
        'REGISTERED_ADDRESS': '#6b7280',   // Gray
        'INTERMEDIARY_OF': '#f59e0b',      // Amber
        'CONNECTED_TO': '#8b5cf6',         // Purple
        'BENEFICIAL_OWNER': '#ec4899',     // Pink
        'DIRECTOR_OF': '#3b82f6',          // Blue
    };
    return colors[type] || '#94a3b8'; // Default slate-400
}

export default function InteractiveGraph({
    initialEntityId,
    initialEntityName
}: InteractiveGraphProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { fitView } = useReactFlow();
    const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
    console.log(hoveredEdge); // Prevent unused variable error

    // Fetch initial graph data
    useEffect(() => {
        const fetchInitialGraph = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/connections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        node_id: parseInt(initialEntityId),
                        depth: 1,
                        max_nodes: 20
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch graph data');
                }

                const data = await response.json();

                // Transform backend data to React Flow format
                const transformedNodes: Node[] = data.graph.nodes.map((node: any, index: number) => {
                    // Circular layout for initial positioning
                    const angle = (index * 2 * Math.PI) / data.graph.nodes.length;
                    const radius = 300;
                    const x = 400 + radius * Math.cos(angle);
                    const y = 300 + radius * Math.sin(angle);

                    const isCentral = node.id === data.graph.center_node_id;

                    return {
                        id: node.id,
                        type: 'default',
                        position: { x, y },
                        data: {
                            label: node.label,
                            type: isCentral ? 'central' : 'standard',
                            nodeType: node.node_type,
                            properties: node.properties,
                        },
                        style: {
                            background: isCentral ? '#10b981' : '#64748b',
                            color: '#ffffff',
                            border: isCentral ? '3px solid #059669' : '2px solid #475569',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontWeight: 600,
                            minWidth: '180px',
                            textAlign: 'center',
                            cursor: 'pointer',
                        },
                    };
                });

                const transformedEdges: Edge[] = data.graph.edges.map((edge: any) => {
                    const relationshipColor = getRelationshipColor(edge.relationship_type);

                    return {
                        id: edge.id,
                        source: edge.source,
                        target: edge.target,
                        label: formatRelationshipType(edge.relationship_type),
                        type: 'smoothstep',
                        animated: false,
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            width: 24,
                            height: 24,
                            color: relationshipColor,
                        },
                        style: {
                            stroke: relationshipColor,
                            strokeWidth: 2,
                            cursor: 'pointer',
                        },
                        labelStyle: {
                            fontSize: 12,
                            fill: '#1e293b',
                            fontWeight: 600,
                            fontFamily: 'Inter, system-ui, sans-serif',
                        },
                        labelBgStyle: {
                            fill: '#ffffff',
                            fillOpacity: 0.95,
                            rx: 6,
                            ry: 6,
                        },
                        labelBgPadding: [4, 8] as [number, number],
                        labelBgBorderRadius: 6,
                    };
                });

                setNodes(transformedNodes);
                setEdges(transformedEdges);
            } catch (err) {
                console.error('Error fetching graph:', err);
                setError(err instanceof Error ? err.message : 'Failed to load graph');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialGraph();
    }, [initialEntityId, setNodes, setEdges]);

    // Apply force-directed layout
    const { restart: restartSimulation, stop: stopSimulation } = useForceLayout(
        nodes,
        edges,
        setNodes,
        {
            chargeStrength: -400,
            linkDistance: 150,
            collideRadius: 60,
            centerStrength: 0.05,
            enabled: !isLoading && !error,
        }
    );

    const handleNodeClick: NodeMouseHandler = useCallback(
        (_event, node) => {
            console.log('Node clicked:', node);
            // TODO: Show node details in sidebar
        },
        []
    );

    const handleNodeDoubleClick: NodeMouseHandler = useCallback(
        async (_event, node) => {
            console.log('Node double-clicked:', node);
            // TODO: Implement expansion in Phase 4
        },
        []
    );

    // Edge hover handlers
    const handleEdgeMouseEnter = useCallback((_event: React.MouseEvent, edge: Edge) => {
        setHoveredEdge(edge.id);
    }, []);

    const handleEdgeMouseLeave = useCallback(() => {
        setHoveredEdge(null);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Loading relationship graph...</p>
                    <p className="text-slate-500 text-sm mt-1">{initialEntityName}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load Graph</h3>
                    <p className="text-slate-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full graph-canvas">
            {/* Graph Control Panel */}
            <GraphControlPanel
                onRestart={restartSimulation}
                onStop={stopSimulation}
                onFitView={() => fitView({ padding: 0.2, duration: 800 })}
            />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onEdgeMouseEnter={handleEdgeMouseEnter}
                onEdgeMouseLeave={handleEdgeMouseLeave}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                panOnDrag={true}
                zoomOnScroll={true}
                selectionOnDrag={false}
                className="bg-slate-50"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={16}
                    size={1}
                    color="#cbd5e1"
                />
                <Controls
                    className="bg-white border border-slate-200 rounded-lg shadow-lg"
                    showInteractive={false}
                />
            </ReactFlow>

            {/* Graph Legend */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-lg shadow-lg border border-slate-200 z-10">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-500 border-2 border-emerald-600" />
                        <span className="text-slate-700">Central Entity</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-slate-500 border-2 border-slate-600" />
                        <span className="text-slate-700">Connected Entity</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-600">→</span>
                        <span className="text-slate-700">Relationship Direction</span>
                    </div>
                    <div className="text-slate-500 italic">
                        Double-click to explore connections
                    </div>
                </div>
            </div>

            {/* Custom CSS for cursor */}
            <style>{`
                .graph-canvas .react-flow__pane {
                    cursor: grab;
                }
                .graph-canvas .react-flow__pane:active {
                    cursor: grabbing;
                }
            `}</style>
        </div>
    );
}
