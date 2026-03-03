import { Clock, AlertCircle, CheckCircle, FileEdit, RefreshCw, Search, Newspaper, Crown } from 'lucide-react';
import type { EntityProfile } from '../../../types/profile';
import { buildTimeline, type TimelineEvent } from '../utils/timelineBuilder';
import EmptyState from '../shared/EmptyState';

interface TimelineTabProps {
  profile: EntityProfile;
}

const EVENT_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  listed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' },
  delisted: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  amended: { icon: FileEdit, color: 'text-amber-500', bg: 'bg-amber-100' },
  updated: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100' },
  screened: { icon: Search, color: 'text-gray-500', bg: 'bg-gray-100' },
  media: { icon: Newspaper, color: 'text-purple-500', bg: 'bg-purple-100' },
  pep_event: { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-100' },
};

export default function TimelineTab({ profile }: TimelineTabProps) {
  const events = buildTimeline(profile);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No Timeline Data Available"
        description="No chronological events were found for this entity. Timeline data becomes available when entities have listing history, amendments, or dated media findings."
      />
    );
  }

  return (
    <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500 mb-6">
        Timeline
      </p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" />

        <div className="space-y-6">
          {events.map((event, idx) => (
            <TimelineEventRow key={idx} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineEventRow({ event }: { event: TimelineEvent }) {
  const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.screened;
  const Icon = config.icon;

  return (
    <div className="relative flex items-start gap-4 pl-0">
      {/* Dot / Icon */}
      <div className={`relative z-10 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 -mt-0.5">
        <p className="text-xs text-slate-500 dark:text-gray-500 mb-0.5">{formatDate(event.date)}</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400 mb-0.5">
          {event.title}
        </p>
        <p className="text-sm text-slate-700 dark:text-gray-300">{event.description}</p>
        {event.source && (
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Source: {event.source}</p>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
