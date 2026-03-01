import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';

interface RiskGaugeProps {
  score: number;
  riskLevel: string;
  theme: ReportTheme;
}

function getRiskColor(score: number, theme: ReportTheme): string {
  if (score >= 80) return theme.colors.riskCritical;
  if (score >= 60) return theme.colors.riskHigh;
  if (score >= 40) return theme.colors.riskMedium;
  return theme.colors.riskLow;
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export default function RiskGauge({ score, riskLevel, theme }: RiskGaugeProps) {
  const color = getRiskColor(score, theme);
  const cx = 60;
  const cy = 60;
  const r = 45;

  // Gauge arc from 135° to 405° (270° sweep)
  const startAngle = 135;
  const endAngle = 405;
  const sweepAngle = endAngle - startAngle;
  const scoreAngle = startAngle + (sweepAngle * score) / 100;

  const bgArc = describeArc(cx, cy, r, startAngle, endAngle);
  const scoreArc = score > 0 ? describeArc(cx, cy, r, startAngle, Math.min(scoreAngle, endAngle)) : '';

  const labels: Record<string, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={120} height={100} viewBox="0 0 120 100">
        {/* Background arc */}
        <Path d={bgArc} stroke="#E5E7EB" strokeWidth={8} fill="none" strokeLinecap="round" />
        {/* Score arc */}
        {score > 0 && (
          <Path d={scoreArc} stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" />
        )}
        {/* Score ticks at 0, 25, 50, 75, 100 */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = startAngle + (sweepAngle * tick) / 100;
          const rad = (angle * Math.PI) / 180;
          const ix = cx + (r - 12) * Math.cos(rad);
          const iy = cy + (r - 12) * Math.sin(rad);
          return <Circle key={tick} cx={ix} cy={iy} r={1.5} fill="#D1D5DB" />;
        })}
      </Svg>
      <Text style={{ fontFamily: theme.fonts.heading, fontSize: 24, fontWeight: 'bold', color, marginTop: -30 }}>
        {score}
      </Text>
      <Text style={{ fontFamily: theme.fonts.body, fontSize: 7, color: theme.colors.textLight, marginTop: 4 }}>
        {labels[riskLevel] || riskLevel}
      </Text>
    </View>
  );
}
