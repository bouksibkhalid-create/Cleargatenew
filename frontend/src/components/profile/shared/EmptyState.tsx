import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  details?: string;
}

export default function EmptyState({ icon: Icon, title, description, details }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-base font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      {details && (
        <p className="text-xs text-gray-400 mt-3 max-w-md mx-auto">{details}</p>
      )}
    </div>
  );
}
