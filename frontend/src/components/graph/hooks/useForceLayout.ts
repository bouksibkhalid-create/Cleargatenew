/**
 * Force-Directed Layout Hook
 * Manages D3 force simulation lifecycle for automatic node positioning
 */

import { useEffect, useRef, useCallback } from 'react';
import {
    forceSimulation,
    forceManyBody,
    forceLink,
    forceCollide,
    forceCenter,
    type Simulation,
    type SimulationNodeDatum,
    type SimulationLinkDatum
} from 'd3-force';
import type { Node, Edge } from 'reactflow';

interface ForceLayoutOptions {
    chargeStrength?: number;      // Default: -400 (repulsion)
    linkDistance?: number;         // Default: 150
    collideRadius?: number;        // Default: 60
    centerStrength?: number;       // Default: 0.05
    alphaDecay?: number;           // Default: 0.02
    enabled?: boolean;             // Default: true
}

interface D3Node extends SimulationNodeDatum {
    id: string;
    x: number;
    y: number;
}

interface D3Link extends SimulationLinkDatum<D3Node> {
    source: string | D3Node;
    target: string | D3Node;
}

export function useForceLayout(
    nodes: Node[],
    edges: Edge[],
    onUpdate: (nodes: Node[]) => void,
    options: ForceLayoutOptions = {}
) {
    const simulationRef = useRef<Simulation<D3Node, D3Link> | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const {
        chargeStrength = -400,
        linkDistance = 150,
        collideRadius = 60,
        centerStrength = 0.05,
        alphaDecay = 0.02,
        enabled = true
    } = options;

    // Initialize and run simulation
    useEffect(() => {
        if (!enabled || nodes.length === 0) {
            return;
        }

        // Create D3 nodes with initial positions
        const d3Nodes: D3Node[] = nodes.map(node => ({
            id: node.id,
            x: node.position.x,
            y: node.position.y,
        }));

        // Create D3 links
        const d3Links: D3Link[] = edges.map(edge => ({
            source: edge.source,
            target: edge.target,
        }));

        // Initialize force simulation
        const simulation = forceSimulation(d3Nodes)
            .force('charge', forceManyBody().strength(chargeStrength))
            .force(
                'link',
                forceLink<D3Node, D3Link>(d3Links)
                    .id((d) => d.id)
                    .distance(linkDistance)
            )
            .force('collide', forceCollide<D3Node>().radius(collideRadius))
            .force('center', forceCenter(0, 0).strength(centerStrength))
            .alphaDecay(alphaDecay);

        // Update React Flow nodes on each tick
        simulation.on('tick', () => {
            // Cancel any pending animation frame
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            // Use requestAnimationFrame for smooth updates
            animationFrameRef.current = requestAnimationFrame(() => {
                const updatedNodes = nodes.map((node) => {
                    const d3Node = d3Nodes.find((n) => n.id === node.id);
                    if (d3Node) {
                        return {
                            ...node,
                            position: {
                                x: d3Node.x ?? node.position.x,
                                y: d3Node.y ?? node.position.y,
                            },
                        };
                    }
                    return node;
                });
                onUpdate(updatedNodes);
            });
        });

        simulationRef.current = simulation;

        // Cleanup
        return () => {
            simulation.stop();
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [nodes.length, edges.length, enabled]); // Re-run when graph structure changes

    // Restart simulation
    const restart = useCallback(() => {
        if (simulationRef.current) {
            simulationRef.current.alpha(1).restart();
        }
    }, []);

    // Stop simulation
    const stop = useCallback(() => {
        if (simulationRef.current) {
            simulationRef.current.stop();
        }
    }, []);

    // Update simulation forces
    const updateForces = useCallback((newOptions: Partial<ForceLayoutOptions>) => {
        if (!simulationRef.current) return;

        if (newOptions.chargeStrength !== undefined) {
            simulationRef.current.force(
                'charge',
                forceManyBody().strength(newOptions.chargeStrength)
            );
        }

        if (newOptions.linkDistance !== undefined) {
            const linkForce = simulationRef.current.force('link') as ReturnType<typeof forceLink>;
            if (linkForce) {
                linkForce.distance(newOptions.linkDistance);
            }
        }

        if (newOptions.collideRadius !== undefined) {
            simulationRef.current.force(
                'collide',
                forceCollide<D3Node>().radius(newOptions.collideRadius)
            );
        }

        restart();
    }, [restart]);

    return {
        restart,
        stop,
        updateForces,
        isRunning: simulationRef.current ? simulationRef.current.alpha() > 0 : false,
    };
}
