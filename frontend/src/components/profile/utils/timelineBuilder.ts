import type { EntityProfile, AdverseMediaHit } from '../../../types/profile';

export interface TimelineEvent {
  date: string;
  type: 'screened' | 'media' | 'listed' | 'delisted' | 'amended' | 'updated' | 'pep_event';
  title: string;
  description: string;
  source?: string;
}

export function buildTimeline(profile: EntityProfile): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Current screening event
  events.push({
    date: profile.check_created_at,
    type: 'screened',
    title: 'SCREENED',
    description: 'Entity screened via ClearGate',
  });

  // Adverse media findings as timeline events
  const hits: AdverseMediaHit[] = profile.adverse_media_hits ?? [];
  for (const hit of hits) {
    if (hit.published_date) {
      events.push({
        date: hit.published_date,
        type: 'media',
        title: 'ADVERSE MEDIA',
        description: hit.title,
        source: hit.source_name,
      });
    }
  }

  // PEP event if applicable
  if (profile.is_pep && profile.pep_details) {
    events.push({
      date: profile.check_created_at,
      type: 'pep_event',
      title: 'PEP CLASSIFICATION',
      description: `Classified as Politically Exposed Person: ${profile.pep_details}`,
    });
  }

  // Sanctions listing event
  if (profile.is_sanctioned) {
    events.push({
      date: profile.check_created_at,
      type: 'listed',
      title: 'SANCTIONS MATCH',
      description: `Active match on ${profile.sanctions_lists_matched.length || 1} sanctions list(s)`,
    });
  }

  // Sort by date descending (newest first)
  events.sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return dateB - dateA;
  });

  return events;
}

function parseDate(d: string): number {
  try {
    return new Date(d).getTime();
  } catch {
    return 0;
  }
}
