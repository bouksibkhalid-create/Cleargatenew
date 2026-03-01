import { View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import type { DagreLayoutResult } from '../types/reportData';
import GraphNode from './GraphNode';
import GraphEdge from './GraphEdge';
import GraphLegend from './GraphLegend';
import { LABELS } from '../types/reportData';

interface StaticGraphRendererProps {
  layout: DagreLayoutResult;
  theme: ReportTheme;
  totalNodeCount?: number;
  language?: 'en' | 'fr';
}

export default function StaticGraphRenderer({ layout, theme, totalNodeCount, language = 'en' }: StaticGraphRendererProps) {
  const labels = LABELS[language];
  const maxDisplayed = 30;
  const hasMore = totalNodeCount !== undefined && totalNodeCount > maxDisplayed;

  // Scale graph to fit within page content area (~515 x 500 points max)
  const maxW = 515;
  const maxH = 500;
  const scaleX = layout.width > maxW ? maxW / layout.width : 1;
  const scaleY = layout.height > maxH ? maxH / layout.height : 1;
  const scale = Math.min(scaleX, scaleY, 1);

  const scaledW = layout.width * scale;
  const scaledH = layout.height * scale;

  return (
    <View>
      <View style={{ width: scaledW, height: scaledH, position: 'relative' }}>
        {/* Edges first (below nodes) */}
        {layout.edges.map((edge) => {
          const scaledEdge = {
            ...edge,
            points: edge.points.map((p) => ({ x: p.x * scale, y: p.y * scale })),
          };
          return (
            <GraphEdge
              key={edge.id}
              edge={scaledEdge}
              theme={theme}
              svgWidth={scaledW}
              svgHeight={scaledH}
            />
          );
        })}

        {/* Nodes */}
        {layout.nodes.map((node) => {
          const scaledNode = {
            ...node,
            x: node.x * scale,
            y: node.y * scale,
            width: node.width * scale,
            height: node.height * scale,
          };
          return <GraphNode key={node.id} node={scaledNode} theme={theme} />;
        })}
      </View>

      {hasMore && (
        <Text style={{ fontFamily: theme.fonts.body, fontSize: 7, color: theme.colors.textLight, textAlign: 'center', marginTop: 8 }}>
          {labels.additionalConnections}
        </Text>
      )}

      <GraphLegend theme={theme} />
    </View>
  );
}
