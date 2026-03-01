import { Svg, Path, Text as SvgText } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import type { DagreLayoutEdge } from '../types/reportData';

interface GraphEdgeProps {
  edge: DagreLayoutEdge;
  theme: ReportTheme;
  svgWidth: number;
  svgHeight: number;
}

export default function GraphEdge({ edge, theme, svgWidth, svgHeight }: GraphEdgeProps) {
  if (!edge.points || edge.points.length < 2) return null;

  const pathParts = edge.points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  );
  const pathD = pathParts.join(' ');

  // Label position: midpoint of the path
  const mid = edge.points[Math.floor(edge.points.length / 2)];
  const truncLabel = edge.relationship_type.length > 18
    ? edge.relationship_type.slice(0, 16) + '…'
    : edge.relationship_type;

  return (
    <Svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ position: 'absolute', top: 0, left: 0 }}>
      <Path d={pathD} stroke={theme.colors.border} strokeWidth={1} fill="none" />
      {mid && (
        <SvgText
          x={mid.x}
          y={mid.y - 4}
          fill={theme.colors.textLight}
          textAnchor="middle"
          style={{ fontSize: 5 }}
        >
          {truncLabel}
        </SvgText>
      )}
    </Svg>
  );
}
