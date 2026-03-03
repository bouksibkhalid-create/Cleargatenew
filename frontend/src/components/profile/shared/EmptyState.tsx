import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  details?: string;
}

export default function EmptyState({ icon: Icon, title, description, details }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-12 text-center">
      <Icon className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto mb-4" />
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md mx-auto">{description}</p>
      {details && (
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-3 max-w-md mx-auto">{details}</p>
      )}
    </div>
  );
}
