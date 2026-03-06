import { Newspaper, ExternalLink } from 'lucide-react';
import type { EntityProfile, AdverseMediaHit } from '../../../types/profile';
import StatusBanner from '../shared/StatusBanner';
import EmptyState from '../shared/EmptyState';
import SeverityBadge from '../shared/SeverityBadge';

interface AdverseMediaTabProps {
  profile: EntityProfile;
}

const SOURCE_BADGE_COLORS: Record<string, string> = {
  news: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  investigation: 'bg-red-500/15 text-red-400 border border-red-500/30',
  regulatory: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  blog: 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/10',
  social: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
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
      <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500 mb-4">
          Source Breakdown
        </p>
        <div className="space-y-2 text-sm text-slate-500 dark:text-gray-400">
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
    <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
      <div className="p-6 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
              News
            </span>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
              {hit.title}
            </h4>
          </div>
          <span className="text-xs text-slate-400 dark:text-gray-500 shrink-0">#{index}</span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-gray-400">
          {hit.source_name && <span>Source: <strong className="text-slate-700 dark:text-gray-300">{hit.source_name}</strong></span>}
          {hit.published_date && <span>Published: {hit.published_date}</span>}
          <SeverityBadge severity={hit.severity} />
        </div>

        {/* Snippet */}
        {hit.snippet && (
          <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed bg-slate-50 dark:bg-white/5 rounded-lg p-3 italic">
            "{hit.snippet}"
          </p>
        )}

        {/* Link */}
        {hit.url && (
          <a
            href={hit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#9E59EF] hover:text-[#B57FF5] hover:underline"
          >
            View Source <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
