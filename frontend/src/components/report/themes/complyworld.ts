import type { ReportTheme } from '../types/theme';

export const complyWorldTheme: ReportTheme = {
  name: 'Comply World',
  logo: '',
  logoWidth: 100,
  logoHeight: 35,
  colors: {
    primary: '#D4A843',
    primaryLight: '#F5E6B8',
    secondary: '#4A4A4A',
    text: '#333333',
    textLight: '#888888',
    textInverse: '#FFFFFF',
    background: '#FFFFFF',
    backgroundAlt: '#F5F5F5',
    border: '#E0E0E0',
    coverOverlay: '#E8E8E8',

    statusClear: '#2E7D32',
    statusFound: '#C62828',
    statusWarning: '#F57F17',
    statusInfo: '#1565C0',

    riskLow: '#2E7D32',
    riskMedium: '#F57F17',
    riskHigh: '#E65100',
    riskCritical: '#C62828',

    nodeOfficer: '#1565C0',
    nodeEntity: '#2E7D32',
    nodeIntermediary: '#F57F17',
    nodeAddress: '#757575',
  },
  fonts: {
    heading: 'Montserrat',
    body: 'OpenSans',
    mono: 'RobotoMono',
  },
  layout: {
    coverStyle: 'split',
    headerStyle: 'line',
    pageMargin: 40,
  },
};
