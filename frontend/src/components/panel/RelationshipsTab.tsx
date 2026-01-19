/**
 * Relationships Tab - Interactive Network Graph (Enhanced with Phase 2 & 3 Features)
 * Shows connections between entities with:
 * - Clickable nodes with details sidebar
 * - Double-click to expand connections
 * - Graph controls (zoom, layout, filters, export)
 * - Search functionality
 * - Performance optimizations
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
    type Node,
    type Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, Building2, User, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UnifiedEntity } from '@/types/entity';
import NodeDetailsSidebar from './NodeDetailsSidebar';
import GraphControls, { type GraphFilters } from './GraphControls';
import { AnimatePresence } from 'framer-motion';
import { downloadGraphAsImage, copyGraphToClipboard } from '@/utils/graphExport';
import ConnectionGraphModal from '../graph/ConnectionGraphModal';


interface RelationshipsTabProps {
    entity: UnifiedEntity;
}

// Node type definitions
const RELATIONSHIP_TYPES = [
    { type: 'family', label: 'Family Member', icon: User, color: '#ec4899' },
    { type: 'associate', label: 'Business Associate', icon: Building2, color: '#14b8a6' },
    { type: 'company', label: 'Company Director', icon: Building2, color: '#6366f1' },
    { type: 'location', label: 'Shared Address', icon: MapPin, color: '#6b7280' },
    { type: 'transaction', label: 'Financial Link', icon: DollarSign, color: '#f59e0b' },
];

// Layout algorithms
function applyLayout(nodes: Node[], edges: Edge[], layout: string): Node[] {

    switch (layout) {
        case 'radial':
            return applyRadialLayout(nodes);
        case 'circular':
            return applyCircularLayout(nodes);
        case 'hierarchical':
            return applyHierarchicalLayout(nodes);
        case 'force':
            return applyForceLayout(nodes, edges);
        default:
            return applyRadialLayout(nodes);
    }
}

function applyRadialLayout(nodes: Node[]): Node[] {
    const centerNode = nodes.find((n) => n.id === 'central');
    const otherNodes = nodes.filter((n) => n.id !== 'central');

    if (centerNode) {
        centerNode.position = { x: 400, y: 300 };
    }

    const radius = 280;
    const angleStep = (2 * Math.PI) / otherNodes.length;

    otherNodes.forEach((node, index) => {
        const angle = index * angleStep;
        node.position = {
            x: 400 + radius * Math.cos(angle),
            y: 300 + radius * Math.sin(angle),
        };
    });

    return nodes;
}

function applyCircularLayout(nodes: Node[]): Node[] {
    const radius = 250;
    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, index) => {
        const angle = index * angleStep;
        node.position = {
            x: 400 + radius * Math.cos(angle),
            y: 300 + radius * Math.sin(angle),
        };
    });

    return nodes;
}

function applyHierarchicalLayout(nodes: Node[]): Node[] {
    const centerNode = nodes.find((n) => n.id === 'central');
    const otherNodes = nodes.filter((n) => n.id !== 'central');

    if (centerNode) {
        centerNode.position = { x: 400, y: 100 };
    }

    const nodesPerRow = Math.ceil(Math.sqrt(otherNodes.length));
    otherNodes.forEach((node, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;
        node.position = {
            x: 200 + col * 200,
            y: 300 + row * 150,
        };
    });

    return nodes;
}

function applyForceLayout(nodes: Node[], edges: Edge[]): Node[] {
    // Simple force-directed layout simulation
    const iterations = 50;
    const k = 100; // Spring constant
    const repulsion = 5000;

    for (let iter = 0; iter < iterations; iter++) {
        // Apply repulsion between all nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].position.x - nodes[i].position.x;
                const dy = nodes[j].position.y - nodes[i].position.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = repulsion / (distance * distance);

                nodes[i].position.x -= (force * dx) / distance;
                nodes[i].position.y -= (force * dy) / distance;
                nodes[j].position.x += (force * dx) / distance;
                nodes[j].position.y += (force * dy) / distance;
            }
        }

        // Apply attraction along edges
        edges.forEach((edge) => {
            const source = nodes.find((n) => n.id === edge.source);
            const target = nodes.find((n) => n.id === edge.target);
            if (source && target) {
                const dx = target.position.x - source.position.x;
                const dy = target.position.y - source.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (distance * distance) / k;

                source.position.x += (force * dx) / distance / 10;
                source.position.y += (force * dy) / distance / 10;
                target.position.x -= (force * dx) / distance / 10;
                target.position.y -= (force * dy) / distance / 10;
            }
        });
    }

    return nodes;
}

// Generate realistic relationship graph
function generateRelationshipGraph(entity: UnifiedEntity): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Central node
    nodes.push({
        id: 'central',
        type: 'custom',
        position: { x: 400, y: 300 },
        data: {
            label: entity.name,
            type: 'person',
            isCentral: true,
            isSanctioned: entity.isSanctioned,
            isPEP: entity.isPEP,
        },
    });

    // Generate connected entities
    const relationshipCount = Math.min(entity.relationshipCount || 8, 12);
    const firstNames = ['John', 'Maria', 'David', 'Anna', 'Michael', 'Sofia', 'James', 'Elena', 'Robert', 'Olga'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Garcia', 'Martinez', 'Rodriguez', 'Lee', 'Kim', 'Chen', 'Ivanov'];
    const companies = ['Holdings Ltd', 'Investments Inc', 'Capital Partners', 'Trading Co', 'Ventures LLC', 'Group SA'];

    for (let i = 0; i < relationshipCount; i++) {
        const relType = RELATIONSHIP_TYPES[i % RELATIONSHIP_TYPES.length];
        const nodeId = `node-${i}`;

        let nodeName: string;
        if (relType.type === 'company') {
            nodeName = `${lastNames[i % lastNames.length]} ${companies[i % companies.length]}`;
        } else if (relType.type === 'location') {
            nodeName = `${Math.floor(Math.random() * 999) + 1} Main Street, City`;
        } else {
            nodeName = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
        }

        nodes.push({
            id: nodeId,
            type: 'custom',
            position: { x: 0, y: 0 }, // Will be set by layout
            data: {
                label: nodeName,
                type: relType.type,
                isCentral: false,
                isSanctioned: Math.random() > 0.8,
                isPEP: Math.random() > 0.85,
                expanded: false,
                details: {
                    jurisdiction: ['Cyprus', 'BVI', 'Panama', 'Delaware', 'Luxembourg'][Math.floor(Math.random() * 5)],
                    countries: ['Russia', 'UK', 'USA', 'Switzerland'].slice(0, Math.floor(Math.random() * 3) + 1),
                },
            },
        });

        edges.push({
            id: `edge-${i}`,
            source: 'central',
            target: nodeId,
            type: 'smoothstep',
            animated: false,
            label: relType.label,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: relType.color,
            },
            style: {
                strokeWidth: 2,
                stroke: relType.color,
            },
        });
    }

    return { nodes, edges };
}

// Custom node component
function CustomNode({ data }: { data: any }) {
    const Icon = data.isCentral ? Network : getIconForType(data.type);
    const isSanctioned = data.isSanctioned;
    const isPEP = data.isPEP;

    if (data.isCentral) {
        return (
            <div className="central-graph-node">
                <div className="central-node-icon">
                    <Icon className="w-6 h-6" />
                </div>
                <div className="central-node-content">
                    <div className="central-node-name">{data.label}</div>
                    <div className="central-node-badges">
                        {isSanctioned && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                SANCTIONED
                            </Badge>
                        )}
                        {isPEP && (
                            <Badge className="text-xs px-1.5 py-0 bg-amber-100 text-amber-700">
                                PEP
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`graph-node ${isSanctioned ? 'sanctioned' : ''}`}>
            <div className="graph-node-header">
                <div className="graph-node-icon-small">
                    <Icon className="w-3.5 h-3.5" />
                </div>
                {(isSanctioned || isPEP) && (
                    <div className="graph-node-badges-compact">
                        {isSanctioned && <span className="text-xs">⚠️</span>}
                        {isPEP && <span className="text-xs">👑</span>}
                    </div>
                )}
            </div>
            <div className="graph-node-name">{data.label}</div>
            <div className="graph-node-footer">
                <span className="graph-node-type-label">{getTypeLabelShort(data.type)}</span>
            </div>
        </div>
    );
}

function getIconForType(type: string) {
    const iconMap: Record<string, any> = {
        family: User,
        associate: Building2,
        company: Building2,
        location: MapPin,
        transaction: DollarSign,
        person: User,
    };
    return iconMap[type] || Network;
}

function getTypeLabelShort(type: string): string {
    const labels: Record<string, string> = {
        family: 'Family',
        associate: 'Business',
        company: 'Company',
        location: 'Address',
        transaction: 'Financial',
        person: 'Person',
    };
    return labels[type] || 'Entity';
}

const nodeTypes = {
    custom: CustomNode,
};

function RelationshipsTabInner({ entity }: RelationshipsTabProps) {
    const { nodes: initialNodes, edges: initialEdges } = useMemo(
        () => generateRelationshipGraph(entity),
        [entity]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [layout, setLayout] = useState('radial');
    const [filters, setFilters] = useState<GraphFilters>({
        showSanctioned: true,
        showPEP: true,
        showFamily: true,
        showBusiness: true,
        showCompany: true,
        showLocation: true,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);

    const { zoomIn, zoomOut, fitView } = useReactFlow();

    // Export handlers
    const handleExportImage = useCallback(async () => {
        try {
            await downloadGraphAsImage(nodes, entity.name);
        } catch (error) {
            console.error('Failed to export graph:', error);
        }
    }, [nodes, entity.name]);

    const handleCopyGraph = useCallback(async () => {
        try {
            await copyGraphToClipboard(nodes);
        } catch (error) {
            console.error('Failed to copy graph:', error);
        }
    }, [nodes]);

    // Apply layout when layout type changes
    useEffect(() => {
        const layoutedNodes = applyLayout([...nodes], edges, layout);
        setNodes(layoutedNodes);
    }, [layout]);

    // Filter nodes based on filters and search
    const filteredNodes = useMemo(() => {
        return nodes.filter((node) => {
            // Always show central node
            if (node.data.isCentral) return true;

            // Apply filters
            if (!filters.showSanctioned && node.data.isSanctioned) return false;
            if (!filters.showPEP && node.data.isPEP) return false;
            if (!filters.showFamily && node.data.type === 'family') return false;
            if (!filters.showBusiness && node.data.type === 'associate') return false;
            if (!filters.showCompany && node.data.type === 'company') return false;
            if (!filters.showLocation && node.data.type === 'location') return false;

            // Apply search
            if (searchQuery && !node.data.label.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            return true;
        });
    }, [nodes, filters, searchQuery]);

    // Filter edges to only show those connected to visible nodes
    const filteredEdges = useMemo(() => {
        const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
        return edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
    }, [edges, filteredNodes]);

    const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onNodeDoubleClick = useCallback(
        async (_event: React.MouseEvent, node: Node) => {
            if (node.data.isCentral || expandedNodes.has(node.id)) return;

            // Generate additional connections for this node
            const newNodeCount = 3;
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            for (let i = 0; i < newNodeCount; i++) {
                const newNodeId = `${node.id}-child-${i}`;
                const relType = RELATIONSHIP_TYPES[i % RELATIONSHIP_TYPES.length];

                newNodes.push({
                    id: newNodeId,
                    type: 'custom',
                    position: {
                        x: node.position.x + (Math.random() - 0.5) * 200,
                        y: node.position.y + (Math.random() - 0.5) * 200,
                    },
                    data: {
                        label: `Connected Entity ${i + 1}`,
                        type: relType.type,
                        isCentral: false,
                        isSanctioned: Math.random() > 0.9,
                        isPEP: false,
                    },
                });

                newEdges.push({
                    id: `edge-${node.id}-${i}`,
                    source: node.id,
                    target: newNodeId,
                    type: 'smoothstep',
                    label: relType.label,
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: relType.color,
                    },
                    style: {
                        strokeWidth: 2,
                        stroke: relType.color,
                    },
                });
            }

            setNodes((nds) => [...nds, ...newNodes]);
            setEdges((eds) => [...eds, ...newEdges]);
            setExpandedNodes((prev) => new Set([...prev, node.id]));
        },
        [expandedNodes, setNodes, setEdges]
    );

    if (entity.relationshipCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-lg border border-dashed">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Network className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Relationships Found</h3>
                <p className="text-gray-500 max-w-sm mt-2">
                    No known relationships or connections have been identified for this entity.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Info Banner */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold text-blue-900">Interactive Relationship Network</p>
                            <p className="text-blue-700 mt-1">
                                <strong>Click</strong> any node for details. <strong>Double-click</strong> to expand connections.
                                Use controls to filter and search.
                            </p>
                        </div>
                    </div>
                    {entity.hasOffshoreLeaksData && (
                        <Button
                            onClick={() => setIsFullScreenModalOpen(true)}
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
                        >
                            <Network className="w-4 h-4 mr-2" />
                            Full Screen
                        </Button>
                    )}
                </div>
            </Card>

            {/* Graph Visualization */}
            <div className="bg-white rounded-lg border shadow-sm relative" style={{ height: '600px' }}>
                <GraphControls
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onFitView={fitView}
                    onLayoutChange={setLayout}
                    onFilterChange={setFilters}
                    onSearch={setSearchQuery}
                    onExportImage={handleExportImage}
                    onCopyGraph={handleCopyGraph}
                    currentLayout={layout}
                />

                <ReactFlow
                    nodes={filteredNodes}
                    edges={filteredEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    minZoom={0.2}
                    maxZoom={2}
                >
                    <Background color="#e2e8f0" gap={16} />
                    <Controls />
                    <MiniMap
                        nodeColor={(node) => {
                            if (node.data.isCentral) return '#14b8a6';
                            if (node.data.isSanctioned) return '#ef4444';
                            return '#94a3b8';
                        }}
                        maskColor="rgb(240, 240, 240, 0.8)"
                    />
                </ReactFlow>

                {/* Details Sidebar */}
                <AnimatePresence>
                    {selectedNode && (
                        <NodeDetailsSidebar
                            node={selectedNode}
                            isOpen={!!selectedNode}
                            onClose={() => setSelectedNode(null)}
                            allNodes={nodes}
                            allEdges={edges}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Legend */}
            <Card className="p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-teal-500 border-2 border-teal-600"></div>
                        <span className="text-gray-600">Central Entity</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400 border-2 border-red-500"></div>
                        <span className="text-gray-600">Sanctioned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-300 border-2 border-gray-400"></div>
                        <span className="text-gray-600">Standard Entity</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs">👑</span>
                        <span className="text-gray-600">PEP</span>
                    </div>
                </div>
            </Card>

            {/* Full-Screen Graph Modal */}
            {entity.hasOffshoreLeaksData && (
                <ConnectionGraphModal
                    isOpen={isFullScreenModalOpen}
                    onClose={() => setIsFullScreenModalOpen(false)}
                    initialEntityId={String((entity.rawData as any)?.node_id || entity.id)}
                    initialEntityName={entity.name}
                />
            )}
        </div>
    );
}

// Wrapper component that provides ReactFlowProvider context
export default function RelationshipsTab({ entity }: RelationshipsTabProps) {
    return (
        <ReactFlowProvider>
            <RelationshipsTabInner entity={entity} />
        </ReactFlowProvider>
    );
}
