export interface ReportTheme {
  name: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;

  colors: {
    primary: string;
    primaryLight: string;
    secondary: string;
    text: string;
    textLight: string;
    textInverse: string;
    background: string;
    backgroundAlt: string;
    border: string;
    coverOverlay: string;

    statusClear: string;
    statusFound: string;
    statusWarning: string;
    statusInfo: string;

    riskLow: string;
    riskMedium: string;
    riskHigh: string;
    riskCritical: string;

    nodeOfficer: string;
    nodeEntity: string;
    nodeIntermediary: string;
    nodeAddress: string;
  };

  fonts: {
    heading: string;
    body: string;
    mono: string;
  };

  layout: {
    coverStyle: 'split' | 'full';
    headerStyle: 'bar' | 'line';
    pageMargin: number;
  };
}
