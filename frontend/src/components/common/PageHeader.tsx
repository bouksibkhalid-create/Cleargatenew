import { type ReactNode } from 'react';

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ icon, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          {icon}
          {title}
        </h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
