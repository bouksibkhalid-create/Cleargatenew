import { type ReactNode } from 'react';

interface CgCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function CgCard({ title, subtitle, action, children, className = '', noPadding }: CgCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden transition-colors duration-200 ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}
