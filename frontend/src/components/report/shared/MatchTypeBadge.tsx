import { View, Text, Svg, Circle } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';

interface MatchTypeBadgeProps {
  matchType: 'exact' | 'potential';
  theme: ReportTheme;
}

export default function MatchTypeBadge({ matchType, theme }: MatchTypeBadgeProps) {
  const label = matchType === 'exact' ? 'Exact' : 'Potential';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Svg width={10} height={10} viewBox="0 0 10 10">
        {matchType === 'exact' ? (
          <Circle cx={5} cy={5} r={4} fill={theme.colors.statusFound} />
        ) : (
          <Circle cx={5} cy={5} r={3.5} stroke={theme.colors.statusWarning} strokeWidth={1} fill="none" />
        )}
      </Svg>
      <Text style={{ fontSize: 7, color: theme.colors.textLight, marginLeft: 3 }}>{label}</Text>
    </View>
  );
}
