import { View, Text, Svg, Rect } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import type { DagreLayoutNode } from '../types/reportData';

interface GraphNodeProps {
  node: DagreLayoutNode;
  theme: ReportTheme;
}

function getNodeColor(nodeType: string, theme: ReportTheme): string {
  switch (nodeType) {
    case 'Officer': return theme.colors.nodeOfficer;
    case 'Entity': return theme.colors.nodeEntity;
    case 'Intermediary': return theme.colors.nodeIntermediary;
    case 'Address': return theme.colors.nodeAddress;
    default: return theme.colors.textLight;
  }
}

export default function GraphNode({ node, theme }: GraphNodeProps) {
  const color = node.color || getNodeColor(node.node_type, theme);
  const truncLabel = node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label;

  return (
    <View style={{ position: 'absolute', left: node.x - node.width / 2, top: node.y - node.height / 2 }}>
      <Svg width={node.width} height={node.height} viewBox={`0 0 ${node.width} ${node.height}`}>
        <Rect x={1} y={1} width={node.width - 2} height={node.height - 2} rx={6} fill="white" stroke={color} strokeWidth={1.5} />
        <Rect x={0} y={0} width={4} height={node.height} rx={2} fill={color} />
      </Svg>
      <View style={{ position: 'absolute', top: 8, left: 12, right: 8 }}>
        <Text style={{ fontFamily: theme.fonts.heading, fontSize: 7, fontWeight: 600, color: theme.colors.text }}>
          {truncLabel}
        </Text>
        <Text style={{ fontFamily: theme.fonts.body, fontSize: 6, color: theme.colors.textLight, marginTop: 2 }}>
          {node.node_type}
        </Text>
      </View>
    </View>
  );
}
