const RISK_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  HIGH: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
  MEDIUM: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  LOW: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  UNKNOWN: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
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
