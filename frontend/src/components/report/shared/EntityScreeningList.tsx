import { View, Text, Svg, Circle } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import type { ScreenedEntity } from '../types/reportData';
import { createStyles } from '../styles/createStyles';

interface EntityScreeningListProps {
  entities: ScreenedEntity[];
  theme: ReportTheme;
}

export default function EntityScreeningList({ entities, theme }: EntityScreeningListProps) {
  const s = createStyles(theme);

  if (entities.length === 0) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={s.bodyTextLight}>No entities screened.</Text>
      </View>
    );
  }

  return (
    <View>
      {entities.map((entity, idx) => (
        <View key={idx} style={s.screeningRow}>
          {/* Match indicator */}
          <Svg width={12} height={12} viewBox="0 0 12 12">
            {entity.has_match ? (
              <Circle cx={6} cy={6} r={5} fill={theme.colors.statusFound} />
            ) : (
              <Circle cx={6} cy={6} r={5} fill={theme.colors.statusClear} />
            )}
          </Svg>
          <Text
            style={[
              s.screeningName,
              {
                color: entity.has_match ? theme.colors.statusFound : theme.colors.text,
                fontWeight: entity.has_match ? 'bold' : 'normal',
                marginLeft: 8,
              },
            ]}
          >
            {entity.name}
          </Text>
          {entity.match_type && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Svg width={8} height={8} viewBox="0 0 8 8">
                {entity.match_type === 'exact' ? (
                  <Circle cx={4} cy={4} r={3.5} fill={theme.colors.statusFound} />
                ) : (
                  <Circle cx={4} cy={4} r={3} stroke={theme.colors.statusWarning} strokeWidth={1} fill="none" />
                )}
              </Svg>
              <Text style={{ fontSize: 7, color: theme.colors.textLight, marginLeft: 3 }}>
                {entity.match_type === 'exact' ? 'Exact' : 'Potential'}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
