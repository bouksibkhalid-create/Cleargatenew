import { ExternalLink } from 'lucide-react';
import type { SourceItem as SourceItemType } from '../../types/profile';

const BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  news: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'News' },
  sanctions: { bg: 'bg-red-100', text: 'text-red-700', label: 'Sanctions' },
  pep: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'PEP' },
  offshore: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Offshore' },
};

interface SourceItemProps {
  source: SourceItemType;
}

export default function SourceItemRow({ source }: SourceItemProps) {
  const badge = BADGE_STYLES[source.type] || BADGE_STYLES.news;

  return (
    <div className="flex items-start gap-4 px-6 py-4">
      {/* Type badge */}
      <span
        className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200">{source.title}</p>
        {source.snippet && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{source.snippet}</p>
        )}
      </div>

      {/* External link */}
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
