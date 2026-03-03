import type { ReactNode } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import type { EntityInfo } from '../../types/profile';

interface ProfileHeaderProps {
  entity: EntityInfo;
  riskLevel: string;
  onBack: () => void;
  onDownloadReport: () => void;
  reportButton?: ReactNode;
}

const RISK_BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  low: { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-400' },
  medium: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400' },
  high: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400' },
  critical: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
};

const AVATAR_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-green-500/15', text: 'text-green-400' },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  high: { bg: 'bg-red-500/15', text: 'text-red-400' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

export default function ProfileHeader({
  entity,
  riskLevel,
  onBack,
  onDownloadReport,
  reportButton,
}: ProfileHeaderProps) {
  const badgeStyle = RISK_BADGE_STYLES[riskLevel] || RISK_BADGE_STYLES.low;
  const avatarStyle = AVATAR_STYLES[riskLevel] || AVATAR_STYLES.low;
  const initial = entity.name.charAt(0).toUpperCase();
  const riskLabel = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) + ' Risk';

  const subtitle = [
    entity.entity_type.charAt(0).toUpperCase() + entity.entity_type.slice(1),
    entity.country,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Avatar + Name */}
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${avatarStyle.bg} ${avatarStyle.text}`}
          >
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              {entity.name}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {reportButton ?? (
            <button
              onClick={onDownloadReport}
              className="bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-full px-5 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 flex items-center gap-2 transition-colors min-h-[36px]"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          )}

          <span
            className={`rounded-full px-4 py-1.5 text-sm font-medium border ${badgeStyle.bg} ${badgeStyle.border} ${badgeStyle.text}`}
          >
            {riskLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
