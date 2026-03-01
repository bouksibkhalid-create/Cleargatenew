import { View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';

interface GraphLegendProps {
  theme: ReportTheme;
}

export default function GraphLegend({ theme }: GraphLegendProps) {
  const s = createStyles(theme);
  const items = [
    { label: 'Officer', color: theme.colors.nodeOfficer },
    { label: 'Entity', color: theme.colors.nodeEntity },
    { label: 'Intermediary', color: theme.colors.nodeIntermediary },
    { label: 'Address', color: theme.colors.nodeAddress },
  ];

  return (
    <View style={s.graphLegend}>
      {items.map((item) => (
        <View key={item.label} style={s.graphLegendItem}>
          <View style={[s.graphLegendDot, { backgroundColor: item.color }]} />
          <Text style={s.graphLegendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
