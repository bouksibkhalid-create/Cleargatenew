import { clearGateTheme } from './cleargate';
import { complyWorldTheme } from './complyworld';
import type { ReportTheme } from '../types/theme';

export const themes: Record<string, ReportTheme> = {
  cleargate: clearGateTheme,
  complyworld: complyWorldTheme,
};

export { clearGateTheme, complyWorldTheme };
export type { ReportTheme };
