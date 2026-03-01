import { LayoutDashboard, Shield, Crown, Newspaper, Network, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { EntityProfile } from '../../../types/profile';
import OverviewTab from './OverviewTab';
import SanctionsTab from './SanctionsTab';
import PEPTab from './PEPTab';
import AdverseMediaTab from './AdverseMediaTab';
import RelationshipsTab from './RelationshipsTab';
import TimelineTab from './TimelineTab';

export type ProfileTabId =
  | 'overview'
  | 'sanctions'
  | 'pep'
  | 'adverse-media'
  | 'relationships'
  | 'timeline';

interface ProfileTabsProps {
  profile: EntityProfile;
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
}

export default function ProfileTabs({ profile, activeTab, onTabChange }: ProfileTabsProps) {
  const offshoreCount = (profile.offshore_results ?? []).length;
  const hasTimeline =
    (profile.adverse_media_hits ?? []).some((h) => h.published_date) ||
    profile.is_sanctioned ||
    profile.is_pep;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as ProfileTabId)}
      className="w-full"
    >
      {/* Tab Bar */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <TabsList className="w-full h-auto justify-start bg-transparent border-b border-gray-200 rounded-none p-0 overflow-x-auto">
          <TabTriggerWithBadge id="overview" icon={LayoutDashboard} label="Overview" />
          <TabTriggerWithBadge
            id="sanctions"
            icon={Shield}
            label="Sanctions"
            count={profile.sanctions_hits}
          />
          <TabTriggerWithBadge
            id="pep"
            icon={Crown}
            label="PEP"
            count={profile.pep_hits}
          />
          <TabTriggerWithBadge
            id="adverse-media"
            icon={Newspaper}
            label="Adverse Media"
            count={profile.adverse_news_count}
          />
          {offshoreCount > 0 && (
            <TabTriggerWithBadge
              id="relationships"
              icon={Network}
              label="Relationships"
              count={offshoreCount}
              variant="neutral"
            />
          )}
          {hasTimeline && (
            <TabTriggerWithBadge
              id="timeline"
              icon={Clock}
              label="Timeline"
              variant="neutral"
            />
          )}
        </TabsList>
      </div>

      {/* Tab Content */}
      <TabsContent value="overview" className="mt-6">
        <OverviewTab profile={profile} />
      </TabsContent>
      <TabsContent value="sanctions" className="mt-6">
        <SanctionsTab profile={profile} />
      </TabsContent>
      <TabsContent value="pep" className="mt-6">
        <PEPTab profile={profile} />
      </TabsContent>
      <TabsContent value="adverse-media" className="mt-6">
        <AdverseMediaTab profile={profile} />
      </TabsContent>
      {offshoreCount > 0 && (
        <TabsContent value="relationships" className="mt-6">
          <RelationshipsTab profile={profile} />
        </TabsContent>
      )}
      {hasTimeline && (
        <TabsContent value="timeline" className="mt-6">
          <TimelineTab profile={profile} />
        </TabsContent>
      )}
    </Tabs>
  );
}

function TabTriggerWithBadge({
  id,
  icon: Icon,
  label,
  count,
  variant,
}: {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  count?: number;
  variant?: 'neutral';
}) {
  const hasBadge = count !== undefined;

  let badgeClass = 'bg-gray-100 text-gray-500';
  if (hasBadge && count > 0 && variant !== 'neutral') {
    badgeClass = 'bg-red-100 text-red-700';
  } else if (hasBadge && count === 0 && variant !== 'neutral') {
    badgeClass = 'bg-emerald-100 text-emerald-700';
  } else if (variant === 'neutral') {
    badgeClass = 'bg-gray-100 text-gray-600';
  }

  return (
    <TabsTrigger
      value={id}
      className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent rounded-none data-[state=active]:border-emerald-500 data-[state=active]:text-gray-900 data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:text-gray-700 transition-colors whitespace-nowrap"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {hasBadge && (
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none ${badgeClass}`}>
          {count > 0 ? count : 'Clear'}
        </span>
      )}
    </TabsTrigger>
  );
}
