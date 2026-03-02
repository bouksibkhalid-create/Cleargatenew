interface SeverityBadgeProps {
  severity: 'high' | 'medium' | 'low' | 'critical' | string;
  label?: string;
}

const SEVERITY_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  critical: { dot: 'bg-red-500', text: 'text-red-400', label: 'CRITICAL' },
  high: { dot: 'bg-red-500', text: 'text-red-400', label: 'HIGH' },
  medium: { dot: 'bg-amber-500', text: 'text-amber-400', label: 'MEDIUM' },
  low: { dot: 'bg-green-500', text: 'text-green-400', label: 'LOW' },
};

export default function SeverityBadge({ severity, label }: SeverityBadgeProps) {
  const style = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.low;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      <span className={`text-xs font-semibold uppercase ${style.text}`}>
        {label ?? style.label}
      </span>
    </span>
  );
}
