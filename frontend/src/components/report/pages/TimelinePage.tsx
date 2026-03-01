import { Page, View, Text } from '@react-pdf/renderer';
import type { ReportData } from '../types/reportData';
import type { ReportTheme } from '../types/theme';
import { createStyles } from '../styles/createStyles';
import { LABELS } from '../types/reportData';
import PageHeader from '../shared/PageHeader';
import PageFooter from '../shared/PageFooter';
import SectionTitle from '../shared/SectionTitle';
import { formatShortDate } from '../utils/dateFormatter';

interface TimelinePageProps {
  data: ReportData;
  theme: ReportTheme;
}

function getEventColor(type: string, theme: ReportTheme): string {
  switch (type.toLowerCase()) {
    case 'listed': return theme.colors.statusFound;
    case 'delisted': return theme.colors.statusClear;
    case 'amended': return theme.colors.statusWarning;
    case 'updated': return theme.colors.statusInfo;
    default: return theme.colors.textLight;
  }
}

export default function TimelinePage({ data, theme }: TimelinePageProps) {
  const s = createStyles(theme);
  const { profile, metadata } = data;
  const labels = LABELS[metadata.language];
  const events = profile.timeline_events || [];

  if (events.length === 0) return null;

  return (
    <Page size="A4" style={s.page}>
      <PageHeader title={labels.timeline} theme={theme} />

      <SectionTitle watermark="TIMELINE" title={labels.timeline} theme={theme} />

      {events.map((event, idx) => {
        const color = getEventColor(event.type, theme);
        return (
          <View key={idx} style={{ flexDirection: 'row', marginBottom: 12 }}>
            {/* Left: date marker */}
            <View style={{ width: 80, alignItems: 'flex-end', paddingRight: 12 }}>
              <Text style={{ fontFamily: theme.fonts.mono, fontSize: 7, color: theme.colors.textLight }}>
                {formatShortDate(event.date)}
              </Text>
            </View>

            {/* Center: line + dot */}
            <View style={{ width: 20, alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              {idx < events.length - 1 && (
                <View style={{ width: 1, flex: 1, backgroundColor: theme.colors.border, marginTop: 2 }} />
              )}
            </View>

            {/* Right: content */}
            <View style={{ flex: 1, paddingLeft: 12, paddingBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <View style={{ backgroundColor: color, borderRadius: 3, paddingVertical: 1, paddingHorizontal: 6, marginRight: 6 }}>
                  <Text style={{ fontFamily: theme.fonts.heading, fontSize: 6, fontWeight: 'bold', color: theme.colors.textInverse, textTransform: 'uppercase' }}>
                    {event.type}
                  </Text>
                </View>
                {event.regulation_id && (
                  <Text style={{ fontFamily: theme.fonts.mono, fontSize: 6, color: theme.colors.textLight }}>
                    {event.regulation_id}
                  </Text>
                )}
              </View>
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 8, color: theme.colors.text, lineHeight: 1.4 }}>
                {event.description}
              </Text>
              {event.source && (
                <Text style={{ fontFamily: theme.fonts.body, fontSize: 6, color: theme.colors.textLight, marginTop: 2, fontStyle: 'italic' }}>
                  Source: {event.source}
                </Text>
              )}
            </View>
          </View>
        );
      })}

      <PageFooter classification={metadata.classification} theme={theme} />
    </Page>
  );
}
