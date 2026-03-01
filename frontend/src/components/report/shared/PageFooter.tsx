import { View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';

interface PageFooterProps {
  classification: string;
  theme: ReportTheme;
}

export default function PageFooter({ classification, theme }: PageFooterProps) {
  const s = createStyles(theme);
  return (
    <View style={s.pageFooter} fixed>
      <Text style={s.pageFooterText}>{classification}</Text>
      <Text style={s.pageFooterText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      <Text style={s.pageFooterText}>ClearGate v1.0</Text>
    </View>
  );
}
