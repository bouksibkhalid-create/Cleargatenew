import type { ReportTheme } from '../types/theme';

export const clearGateTheme: ReportTheme = {
  name: 'ClearGate Default',
  logo: '',
  logoWidth: 120,
  logoHeight: 40,
  colors: {
    primary: '#0F172A',
    primaryLight: '#1E293B',
    secondary: '#10B981',
    text: '#1F2937',
    textLight: '#6B7280',
    textInverse: '#FFFFFF',
    background: '#FFFFFF',
    backgroundAlt: '#F9FAFB',
    border: '#E5E7EB',
    coverOverlay: '#F1F5F9',

    statusClear: '#10B981',
    statusFound: '#EF4444',
    statusWarning: '#F59E0B',
    statusInfo: '#3B82F6',

    riskLow: '#10B981',
    riskMedium: '#F59E0B',
    riskHigh: '#F97316',
    riskCritical: '#EF4444',

    nodeOfficer: '#3B82F6',
    nodeEntity: '#10B981',
    nodeIntermediary: '#F59E0B',
    nodeAddress: '#6B7280',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
    mono: 'RobotoMono',
  },
  layout: {
    coverStyle: 'split',
    headerStyle: 'bar',
    pageMargin: 40,
  },
};
