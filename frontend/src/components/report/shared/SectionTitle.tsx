import { View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';

interface SectionTitleProps {
  watermark: string;
  title: string;
  theme: ReportTheme;
}

export default function SectionTitle({ watermark, title, theme }: SectionTitleProps) {
  const s = createStyles(theme);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.sectionTitleLarge}>{watermark}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}
