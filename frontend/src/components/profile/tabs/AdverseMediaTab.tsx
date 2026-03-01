import { Newspaper, ExternalLink } from 'lucide-react';
import type { EntityProfile, AdverseMediaHit } from '../../../types/profile';
import StatusBanner from '../shared/StatusBanner';
import EmptyState from '../shared/EmptyState';
import SeverityBadge from '../shared/SeverityBadge';

interface AdverseMediaTabProps {
  profile: EntityProfile;
}

const SOURCE_BADGE_COLORS: Record<string, string> = {
  news: 'bg-blue-100 text-blue-700',
  investigation: 'bg-red-100 text-red-700',
  regulatory: 'bg-purple-100 text-purple-700',
  blog: 'bg-gray-100 text-gray-600',
  social: 'bg-cyan-100 text-cyan-700',
};

export default function AdverseMediaTab({ profile }: AdverseMediaTabProps) {
  const hits = profile.adverse_media_hits ?? [];
  const totalHits = profile.adverse_news_count;
  const highCount = profile.adverse_media_high;
  const mediumCount = profile.adverse_media_medium;
  const lowCount = profile.adverse_media_low;

  if (totalHits === 0 && hits.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="No Adverse Media Found"
        description="Automated screening of news and investigative sources returned no adverse findings for this entity."
        details="Sources checked: Google News, ICIJ, Serper.dev · Coverage: Last 5 years"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <StatusBanner
        status="found"
        icon={Newspaper}
        title={`${totalHits} ADVERSE MEDIA FINDING${totalHits !== 1 ? 'S' : ''}`}
        subtitle={`${highCount} high · ${mediumCount} medium · ${lowCount} low severity`}
      />

      {/* Finding Cards */}
      {hits.map((hit, idx) => (
        <MediaFindingCard key={idx} hit={hit} index={idx + 1} />
      ))}

      {/* Source Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
          Source Breakdown
        </p>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>🔍</span>
            <span>Serper.dev / Google CSE — {hits.length} result(s)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaFindingCard({ hit, index }: { hit: AdverseMediaHit; index: number }) {
  const badgeClass = SOURCE_BADGE_COLORS.news;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
              News
            </span>
            <h4 className="text-sm font-semibold text-gray-900 leading-snug">
              {hit.title}
            </h4>
          </div>
          <span className="text-xs text-gray-400 shrink-0">#{index}</span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          {hit.source_name && <span>Source: <strong className="text-gray-700">{hit.source_name}</strong></span>}
          {hit.published_date && <span>Published: {hit.published_date}</span>}
          <SeverityBadge severity={hit.severity} />
        </div>

        {/* Snippet */}
        {hit.snippet && (
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 italic">
            "{hit.snippet}"
          </p>
        )}

        {/* Link */}
        {hit.url && (
          <a
            href={hit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            View Source <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
