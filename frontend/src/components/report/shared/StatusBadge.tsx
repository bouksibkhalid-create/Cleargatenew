import { View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';

interface StatusBadgeProps {
  status: 'clear' | 'found';
  label: string;
  theme: ReportTheme;
}

export default function StatusBadge({ status, label, theme }: StatusBadgeProps) {
  const s = createStyles(theme);
  const style = status === 'found' ? s.statusBadgeFound : s.statusBadgeClear;
  return (
    <View style={style}>
      <Text style={s.statusBadgeText}>{label}</Text>
    </View>
  );
}
