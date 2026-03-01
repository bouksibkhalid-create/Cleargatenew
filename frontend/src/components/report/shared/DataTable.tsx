import { View, Text } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';

interface DataTableColumn {
  key: string;
  header: string;
  width: string;
}

interface DataTableProps {
  columns: DataTableColumn[];
  rows: Record<string, string>[];
  theme: ReportTheme;
}

export default function DataTable({ columns, rows, theme }: DataTableProps) {
  const s = createStyles(theme);
  return (
    <View style={s.table}>
      {/* Header row */}
      <View style={s.tableHeaderRow}>
        {columns.map((col) => (
          <Text key={col.key} style={[s.tableHeaderCell, { width: col.width }]}>
            {col.header}
          </Text>
        ))}
      </View>
      {/* Data rows */}
      {rows.map((row, idx) => (
        <View key={idx} style={idx % 2 === 1 ? s.tableRowAlt : s.tableRow}>
          {columns.map((col) => (
            <Text key={col.key} style={[s.tableCell, { width: col.width }]}>
              {row[col.key] || '—'}
            </Text>
          ))}
        </View>
      ))}
      {rows.length === 0 && (
        <View style={s.tableRow}>
          <Text style={[s.tableCell, { width: '100%', textAlign: 'center' }]}>
            No data available
          </Text>
        </View>
      )}
    </View>
  );
}
