import { View, Text, Svg, Path } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';
import { REPORT_ICONS } from '../utils/svgIcons';
import { createStyles } from '../styles/createStyles';

interface IconItem {
  key: string;
  label: string;
}

interface ScreeningCategoryIconsProps {
  icons: IconItem[];
  theme: ReportTheme;
}

export default function ScreeningCategoryIcons({ icons, theme }: ScreeningCategoryIconsProps) {
  const s = createStyles(theme);
  return (
    <View style={s.iconGrid}>
      {icons.map((item) => {
        const icon = REPORT_ICONS[item.key];
        return (
          <View key={item.key} style={s.iconGridItem}>
            {icon ? (
              <Svg width={24} height={24} viewBox={icon.viewBox}>
                <Path d={icon.path} fill={theme.colors.textLight} />
              </Svg>
            ) : (
              <View style={{ width: 24, height: 24 }} />
            )}
            <Text style={s.iconGridLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}
