/**
 * Connections Tab - Shows all connections grouped by type
 * Displays in the NodeDetailsSidebar
 */

import { useState } from 'react';
import { ChevronDown, ArrowRight, User, Building2, MapPin, DollarSign, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Node } from 'reactflow';

interface ConnectionsTabProps {
    node: Node;
    allNodes: Node[];
    allEdges: any[];
    onNodeFocus?: (nodeId: string) => void;
}

interface Connection {
    id: string;
    targetId: string;
    targetName: string;
    targetType: string;
    relationshipType: string;
    isSanctioned: boolean;
    isPEP: boolean;
}

export default function ConnectionsTab({ node, allNodes, allEdges, onNodeFocus }: ConnectionsTabProps) {
    // Find all connections for this node
    const connections: Connection[] = allEdges
        .filter((edge) => edge.source === node.id || edge.target === node.id)
        .map((edge) => {
            const targetId = edge.source === node.id ? edge.target : edge.source;
            const targetNode = allNodes.find((n) => n.id === targetId);

            if (!targetNode) return null;

            return {
                id: edge.id,
                targetId,
                targetName: targetNode.data.label,
                targetType: targetNode.data.type,
                relationshipType: edge.label || 'Connected',
                isSanctioned: targetNode.data.isSanctioned || false,
                isPEP: targetNode.data.isPEP || false,
            };
        })
        .filter(Boolean) as Connection[];

    // Group by relationship type
    const grouped = connections.reduce((acc, conn) => {
        const type = conn.relationshipType;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(conn);
        return acc;
    }, {} as Record<string, Connection[]>);

    if (connections.length === 0) {
        return (
            <div className="empty-state">
                <Users className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No connections found for this node.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">{connections.length} Total Connections</p>
                <p className="text-xs text-gray-500">
                    Click any connection to focus it in the graph
                </p>
            </div>

            <div className="space-y-2">
                {Object.entries(grouped).map(([type, conns]) => (
                    <ConnectionGroup
                        key={type}
                        type={type}
                        connections={conns}
                        onNodeFocus={onNodeFocus}
                    />
                ))}
            </div>
        </div>
    );
}

function ConnectionGroup({
    type,
    connections,
    onNodeFocus,
}: {
    type: string;
    connections: Connection[];
    onNodeFocus?: (nodeId: string) => void;
}) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="connection-group">
            <button
                onClick={() => setExpanded(!expanded)}
                className="group-header"
            >
                <div className="group-title">
                    {getRelationshipIcon(type)}
                    <span className="font-medium text-sm">{type}</span>
                    <Badge variant="secondary" className="text-xs">
                        {connections.length}
                    </Badge>
                </div>
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                />
            </button>

            {expanded && (
                <div className="group-items">
                    {connections.map((conn) => (
                        <ConnectionItem
                            key={conn.id}
                            connection={conn}
                            onFocus={onNodeFocus}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ConnectionItem({
    connection,
    onFocus,
}: {
    connection: Connection;
    onFocus?: (nodeId: string) => void;
}) {
    const Icon = getIconForType(connection.targetType);

    return (
        <button
            onClick={() => onFocus?.(connection.targetId)}
            className="connection-item"
        >
            <div className="connection-icon">
                <Icon className="w-4 h-4" />
            </div>

            <div className="connection-info">
                <div className="connection-name">
                    {connection.targetName}
                    {connection.isSanctioned && (
                        <span className="ml-1 text-xs">⚠️</span>
                    )}
                    {connection.isPEP && (
                        <span className="ml-1 text-xs">👑</span>
                    )}
                </div>
                <div className="connection-meta">
                    {getTypeLabelShort(connection.targetType)}
                </div>
            </div>

            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
    );
}

function getRelationshipIcon(type: string) {
    const iconMap: Record<string, any> = {
        'Family Member': Users,
        'Business Associate': Building2,
        'Company Director': Building2,
        'Shared Address': MapPin,
        'Financial Link': DollarSign,
    };
    return iconMap[type] ? iconMap[type]({ className: 'w-4 h-4 text-gray-600' }) : null;
}

function getIconForType(type: string) {
    const iconMap: Record<string, any> = {
        family: Users,
        associate: Building2,
        company: Building2,
        location: MapPin,
        transaction: DollarSign,
        person: User,
    };
    return iconMap[type] || User;
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
