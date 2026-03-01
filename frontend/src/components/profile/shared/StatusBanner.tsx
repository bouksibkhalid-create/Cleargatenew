import type { LucideIcon } from 'lucide-react';

interface StatusBannerProps {
  status: 'clear' | 'found';
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export default function StatusBanner({ status, icon: Icon, title, subtitle }: StatusBannerProps) {
  const styles =
    status === 'found'
      ? 'bg-red-50 border-red-200 text-red-900'
      : 'bg-emerald-50 border-emerald-200 text-emerald-900';

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${styles}`}>
      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-xs mt-0.5 opacity-80">{subtitle}</p>}
      </div>
    </div>
  );
}
