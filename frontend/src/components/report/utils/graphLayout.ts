import dagre from 'dagre';
import type { ConnectionGraph, DagreLayoutResult, DagreLayoutNode, DagreLayoutEdge } from '../types/reportData';

const MAX_NODES = 30;

export function computeGraphLayout(graph: ConnectionGraph): DagreLayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: 80,
    ranksep: 100,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Limit nodes to top 30 by connection count
  const sortedNodes = [...graph.nodes].sort((a, b) => {
    const aConns = graph.edges.filter((e) => e.source === a.id || e.target === a.id).length;
    const bConns = graph.edges.filter((e) => e.source === b.id || e.target === b.id).length;
    return bConns - aConns;
  });

  const visibleNodeIds = new Set(sortedNodes.slice(0, MAX_NODES).map((n) => n.id));

  // Always include center node
  if (graph.center_node_id) {
    visibleNodeIds.add(graph.center_node_id);
  }

  const visibleNodes = graph.nodes.filter((n) => visibleNodeIds.has(n.id));
  const visibleEdges = graph.edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  visibleNodes.forEach((node) => {
    g.setNode(node.id, {
      width: 180,
      height: 50,
      label: node.label,
    });
  });

  visibleEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target, {
      label: edge.relationship_type,
    });
  });

  dagre.layout(g);

  const layoutNodes: DagreLayoutNode[] = visibleNodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      id: node.id,
      label: node.label,
      node_type: node.node_type,
      x: dagreNode?.x ?? 0,
      y: dagreNode?.y ?? 0,
      width: 180,
      height: 50,
      color: node.color,
    };
  });

  const layoutEdges: DagreLayoutEdge[] = visibleEdges.map((edge) => {
    const dagreEdge = g.edge(edge.source, edge.target);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationship_type: edge.relationship_type,
      points: dagreEdge?.points ?? [],
    };
  });

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: (g.graph().width ?? 500) + 40,
    height: (g.graph().height ?? 400) + 40,
  };
}
