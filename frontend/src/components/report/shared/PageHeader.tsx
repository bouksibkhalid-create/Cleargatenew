import { View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';

interface PageHeaderProps {
  title: string;
  theme: ReportTheme;
}

export default function PageHeader({ title, theme }: PageHeaderProps) {
  const s = createStyles(theme);
  return (
    <View style={s.pageHeader} fixed>
      <Text style={s.pageHeaderText}>{title}</Text>
      <Text style={s.pageHeaderText}>ClearGate Intelligence</Text>
    </View>
  );
}
