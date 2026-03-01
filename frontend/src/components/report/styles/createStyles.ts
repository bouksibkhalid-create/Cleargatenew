import { StyleSheet } from '@react-pdf/renderer';
import type { ReportTheme } from '../types/theme';

export function createStyles(theme: ReportTheme) {
  const m = theme.layout.pageMargin;

  return StyleSheet.create({
    // ─── Page layouts ──────────────────────────────────────
    page: {
      fontFamily: theme.fonts.body,
      fontSize: 9,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      paddingTop: m,
      paddingBottom: m + 20,
      paddingHorizontal: m,
      position: 'relative',
    },
    coverPage: {
      fontFamily: theme.fonts.heading,
      padding: 0,
      flexDirection: 'row',
    },

    // ─── Page header / footer ──────────────────────────────
    pageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 8,
      borderBottomWidth: theme.layout.headerStyle === 'line' ? 1 : 0,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.layout.headerStyle === 'bar' ? theme.colors.primary : 'transparent',
      color: theme.layout.headerStyle === 'bar' ? theme.colors.textInverse : theme.colors.textLight,
      marginHorizontal: -m,
      marginTop: -m,
      paddingHorizontal: m,
      paddingTop: 10,
    },
    pageHeaderText: {
      fontFamily: theme.fonts.heading,
      fontSize: 8,
      fontWeight: 600,
      color: theme.layout.headerStyle === 'bar' ? theme.colors.textInverse : theme.colors.textLight,
    },
    pageFooter: {
      position: 'absolute',
      bottom: 12,
      left: m,
      right: m,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
      paddingTop: 6,
    },
    pageFooterText: {
      fontSize: 7,
      color: theme.colors.textLight,
    },

    // ─── Cover page ────────────────────────────────────────
    coverLeft: {
      width: '40%',
      backgroundColor: theme.colors.primary,
      padding: 40,
      justifyContent: 'space-between',
    },
    coverRight: {
      width: '60%',
      backgroundColor: theme.colors.coverOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    coverTitle: {
      fontFamily: theme.fonts.heading,
      fontSize: 12,
      fontWeight: 600,
      color: theme.colors.textInverse,
      letterSpacing: 3,
      textTransform: 'uppercase',
      marginBottom: 16,
    },
    coverEntityName: {
      fontFamily: theme.fonts.heading,
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.textInverse,
      lineHeight: 1.2,
      marginBottom: 12,
    },
    coverTypeBadge: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 4,
      paddingVertical: 4,
      paddingHorizontal: 10,
      alignSelf: 'flex-start',
      marginBottom: 32,
    },
    coverTypeBadgeText: {
      fontFamily: theme.fonts.heading,
      fontSize: 9,
      color: theme.colors.textInverse,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    coverDate: {
      fontFamily: theme.fonts.body,
      fontSize: 11,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 8,
    },
    coverConfidential: {
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
      borderRadius: 3,
      paddingVertical: 4,
      paddingHorizontal: 12,
      alignSelf: 'flex-start',
    },
    coverConfidentialText: {
      fontFamily: theme.fonts.heading,
      fontSize: 8,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: 2,
    },
    coverWatermark: {
      fontFamily: theme.fonts.heading,
      fontSize: 72,
      fontWeight: 'bold',
      color: theme.colors.border,
      textTransform: 'uppercase',
      opacity: 0.3,
    },

    // ─── Section titles ────────────────────────────────────
    sectionTitleLarge: {
      fontFamily: theme.fonts.heading,
      fontSize: 36,
      fontWeight: 'bold',
      color: theme.colors.primary,
      opacity: 0.12,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    sectionTitle: {
      fontFamily: theme.fonts.heading,
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    subsectionTitle: {
      fontFamily: theme.fonts.heading,
      fontSize: 12,
      fontWeight: 600,
      color: theme.colors.text,
      marginBottom: 10,
    },

    // ─── Status badges ─────────────────────────────────────
    statusBadgeClear: {
      backgroundColor: theme.colors.statusClear,
      borderRadius: 4,
      paddingVertical: 6,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
    },
    statusBadgeFound: {
      backgroundColor: theme.colors.statusFound,
      borderRadius: 4,
      paddingVertical: 6,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
    },
    statusBadgeText: {
      fontFamily: theme.fonts.heading,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.textInverse,
      textTransform: 'uppercase',
    },

    // ─── Status indicator cards ────────────────────────────
    statusCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 6,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusCardLabel: {
      fontFamily: theme.fonts.heading,
      fontSize: 10,
      fontWeight: 600,
      color: theme.colors.text,
    },
    statusCardValue: {
      fontFamily: theme.fonts.heading,
      fontSize: 10,
      fontWeight: 'bold',
    },

    // ─── Info grid (key-value pairs) ───────────────────────
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    infoGridItem: {
      width: '50%',
      marginBottom: 10,
    },
    infoGridLabel: {
      fontFamily: theme.fonts.body,
      fontSize: 7,
      color: theme.colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    infoGridValue: {
      fontFamily: theme.fonts.body,
      fontSize: 9,
      color: theme.colors.text,
      fontWeight: 500,
    },

    // ─── Data table ────────────────────────────────────────
    table: {
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.backgroundAlt,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    tableRowAlt: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.backgroundAlt,
    },
    tableHeaderCell: {
      fontFamily: theme.fonts.body,
      fontSize: 8,
      fontWeight: 600,
      color: theme.colors.text,
      padding: 6,
    },
    tableCell: {
      fontFamily: theme.fonts.body,
      fontSize: 8,
      color: theme.colors.text,
      padding: 6,
    },

    // ─── Entity screening list ─────────────────────────────
    screeningRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    screeningName: {
      fontFamily: theme.fonts.body,
      fontSize: 9,
      flex: 1,
    },

    // ─── Risk gauge ────────────────────────────────────────
    gaugeContainer: {
      alignItems: 'center',
      marginBottom: 12,
    },

    // ─── Category icon grid ────────────────────────────────
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 16,
    },
    iconGridItem: {
      width: 70,
      alignItems: 'center',
      marginBottom: 12,
      marginRight: 8,
    },
    iconGridLabel: {
      fontFamily: theme.fonts.body,
      fontSize: 6,
      color: theme.colors.textLight,
      textAlign: 'center',
      marginTop: 4,
    },

    // ─── Match type badges ─────────────────────────────────
    matchExact: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.statusFound,
      marginRight: 6,
    },
    matchPotential: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: theme.colors.statusWarning,
      marginRight: 6,
    },

    // ─── Risk bars ─────────────────────────────────────────
    riskBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    riskBarLabel: {
      fontFamily: theme.fonts.body,
      fontSize: 8,
      color: theme.colors.text,
      width: 140,
    },
    riskBarTrack: {
      flex: 1,
      height: 10,
      backgroundColor: theme.colors.backgroundAlt,
      borderRadius: 5,
      marginHorizontal: 8,
    },
    riskBarScore: {
      fontFamily: theme.fonts.heading,
      fontSize: 9,
      fontWeight: 'bold',
      width: 30,
      textAlign: 'right',
    },

    // ─── Card container ────────────────────────────────────
    card: {
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: 6,
      padding: 12,
      marginBottom: 12,
      backgroundColor: theme.colors.background,
    },

    // ─── Graph ─────────────────────────────────────────────
    graphLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
    },
    graphLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    graphLegendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 4,
    },
    graphLegendText: {
      fontFamily: theme.fonts.body,
      fontSize: 7,
      color: theme.colors.textLight,
    },

    // ─── Body text ─────────────────────────────────────────
    bodyText: {
      fontFamily: theme.fonts.body,
      fontSize: 9,
      color: theme.colors.text,
      lineHeight: 1.5,
      marginBottom: 8,
    },
    bodyTextLight: {
      fontFamily: theme.fonts.body,
      fontSize: 9,
      color: theme.colors.textLight,
      lineHeight: 1.5,
      fontStyle: 'italic',
    },
    caption: {
      fontFamily: theme.fonts.body,
      fontSize: 7,
      color: theme.colors.textLight,
      lineHeight: 1.3,
    },
    mono: {
      fontFamily: theme.fonts.mono,
      fontSize: 8,
      color: theme.colors.text,
    },

    // ─── Bullet list ───────────────────────────────────────
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    bulletDot: {
      width: 12,
      fontFamily: theme.fonts.body,
      fontSize: 9,
      color: theme.colors.textLight,
    },
    bulletText: {
      flex: 1,
      fontFamily: theme.fonts.body,
      fontSize: 9,
      color: theme.colors.text,
      lineHeight: 1.4,
    },

    // ─── Two-column layout ─────────────────────────────────
    row: {
      flexDirection: 'row',
    },
    col60: {
      width: '60%',
      paddingRight: 16,
    },
    col40: {
      width: '40%',
    },
    col50: {
      width: '50%',
    },
    col33: {
      width: '33.33%',
    },

    // ─── Spacing helpers ───────────────────────────────────
    spacerXs: { height: 4 },
    spacerSm: { height: 8 },
    spacerMd: { height: 12 },
    spacerLg: { height: 20 },
    spacerXl: { height: 32 },
  });
}
