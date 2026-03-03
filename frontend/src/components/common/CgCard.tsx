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
    <div className={`bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            {title && <h3 className="text-base font-semibold text-[#111827]">{title}</h3>}
            {subtitle && <p className="text-xs text-[#9CA3AF] mt-0.5">{subtitle}</p>}
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
