/**
 * Graph utility functions
 */

import type { GraphEdge } from '../types/graph';

// Node type colors
export const NODE_COLORS = {
    Officer: '#3B82F6',      // Blue
    Entity: '#10B981',       // Green
    Intermediary: '#F59E0B', // Orange
    Address: '#6B7280',      // Gray
} as const;

// Node type icons/emojis
export const NODE_ICONS = {
    Officer: '👤',
    Entity: '🏢',
    Intermediary: '🏦',
    Address: '📍',
} as const;

/**
 * Get color for node type
 */
export function getNodeColor(nodeType: string): string {
    return NODE_COLORS[nodeType as keyof typeof NODE_COLORS] || '#6B7280';
}

/**
 * Get icon for node type
 */
export function getNodeIcon(nodeType: string): string {
    return NODE_ICONS[nodeType as keyof typeof NODE_ICONS] || '●';
}

/**
 * Format relationship type for display
 */
export function formatRelationshipType(relType: string): string {
    return relType
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Calculate node size based on connections
 */
export function calculateNodeSize(
    nodeId: string,
    edges: GraphEdge[],
    minSize: number = 30,
    maxSize: number = 60
): number {
    const connections = edges.filter(
        (e) => e.source === nodeId || e.target === nodeId
    ).length;

    const size = minSize + Math.min(connections * 5, maxSize - minSize);
    return size;
}
