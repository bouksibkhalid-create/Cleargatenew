/**
 * Graph Export Utilities
 * Export graph as PNG image
 */

import { toPng } from 'html-to-image';
import { getRectOfNodes, getTransformForBounds } from 'reactflow';
import type { Node } from 'reactflow';

const imageWidth = 1920;
const imageHeight = 1080;

export async function downloadGraphAsImage(
    nodes: Node[],
    entityName: string
): Promise<void> {
    const nodesBounds = getRectOfNodes(nodes);
    const transform = getTransformForBounds(
        nodesBounds,
        imageWidth,
        imageHeight,
        0.5,
        2
    );

    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;

    if (!viewport) {
        throw new Error('Could not find graph viewport');
    }

    try {
        const dataUrl = await toPng(viewport, {
            backgroundColor: '#ffffff',
            width: imageWidth,
            height: imageHeight,
            style: {
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
            },
        });

        const link = document.createElement('a');
        link.download = `${entityName.replace(/\s+/g, '_')}_relationship_graph.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Failed to export graph:', error);
        throw error;
    }
}

export function copyGraphToClipboard(nodes: Node[]): Promise<void> {
    // Generate a text representation of the graph
    const graphText = generateGraphText(nodes);
    return navigator.clipboard.writeText(graphText);
}

function generateGraphText(nodes: Node[]): string {
    const centralNode = nodes.find((n) => n.data.isCentral);
    const otherNodes = nodes.filter((n) => !n.data.isCentral);

    let text = `Relationship Graph for ${centralNode?.data.label || 'Unknown'}\n`;
    text += `${'='.repeat(60)}\n\n`;
    text += `Total Connections: ${otherNodes.length}\n\n`;

    // Group by type
    const byType = otherNodes.reduce((acc, node) => {
        const type = node.data.type || 'unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push(node);
        return acc;
    }, {} as Record<string, Node[]>);

    Object.entries(byType).forEach(([type, typeNodes]) => {
        text += `${type.toUpperCase()} (${typeNodes.length}):\n`;
        typeNodes.forEach((node) => {
            const flags = [];
            if (node.data.isSanctioned) flags.push('⚠️ SANCTIONED');
            if (node.data.isPEP) flags.push('👑 PEP');
            const flagText = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
            text += `  - ${node.data.label}${flagText}\n`;
        });
        text += '\n';
    });

    return text;
}
