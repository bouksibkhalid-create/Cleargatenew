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
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  critical: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
};

const AVATAR_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-green-100', text: 'text-green-600' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-600' },
  high: { bg: 'bg-red-100', text: 'text-red-600' },
  critical: { bg: 'bg-red-200', text: 'text-red-700' },
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
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer mb-6"
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
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
              {entity.name}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {reportButton ?? (
            <button
              onClick={onDownloadReport}
              className="bg-white border border-gray-200 rounded-full px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
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
