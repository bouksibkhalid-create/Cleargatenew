import { View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';

interface InfoGridItem {
  label: string;
  value: string;
}

interface InfoGridProps {
  items: InfoGridItem[];
  theme: ReportTheme;
  columns?: 2 | 3;
}

export default function InfoGrid({ items, theme, columns = 2 }: InfoGridProps) {
  const s = createStyles(theme);
  const width = columns === 3 ? '33.33%' : '50%';
  return (
    <View style={s.infoGrid}>
      {items.map((item, idx) => (
        <View key={idx} style={[s.infoGridItem, { width }]}>
          <Text style={s.infoGridLabel}>{item.label}</Text>
          <Text style={s.infoGridValue}>{item.value || '—'}</Text>
        </View>
      ))}
    </View>
  );
}
