import React from 'react';
import type { ReportTheme } from '../types/theme';
import { clearGateTheme } from '../themes/cleargate';

export const ReportThemeContext = React.createContext<ReportTheme>(clearGateTheme);
