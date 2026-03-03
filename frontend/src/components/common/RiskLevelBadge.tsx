const RISK_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  CRITICAL: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  HIGH: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  MEDIUM: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  LOW: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  UNKNOWN: { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-500 dark:text-slate-400', dot: 'bg-gray-400' },
};

export default function RiskLevelBadge({ level }: { level: string }) {
  const key = (level || 'UNKNOWN').toUpperCase();
  const colors = RISK_COLORS[key] || RISK_COLORS.UNKNOWN;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {key}
    </span>
  );
}
