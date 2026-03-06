import { LayoutDashboard, Shield, Crown, Newspaper, Network, Clock, Globe } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { EntityProfile } from '../../../types/profile';
import OverviewTab from './OverviewTab';
import SanctionsTab from './SanctionsTab';
import PEPTab from './PEPTab';
import AdverseMediaTab from './AdverseMediaTab';
import RelationshipsTab from './RelationshipsTab';
import TimelineTab from './TimelineTab';
import OSINTProfileTab from './OSINTProfileTab';

export type ProfileTabId =
  | 'overview'
  | 'sanctions'
  | 'pep'
  | 'adverse-media'
  | 'osint-profile'
  | 'relationships'
  | 'timeline';

interface ProfileTabsProps {
  profile: EntityProfile;
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
}

export default function ProfileTabs({ profile, activeTab, onTabChange }: ProfileTabsProps) {
  const offshoreCount = (profile.offshore_results ?? []).length;
  const hasOSINT = !profile.is_sanctioned;
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
      <div className="bg-white dark:bg-[#1A1F2E] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
        <TabsList className="w-full h-auto justify-start bg-transparent border-b border-slate-200 dark:border-white/10 rounded-none p-0 overflow-x-auto">
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
          {hasOSINT && (
            <TabTriggerWithBadge
              id="osint-profile"
              icon={Globe}
              label="OSINT Profile"
              variant="neutral"
            />
          )}
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
      {hasOSINT && (
        <TabsContent value="osint-profile" className="mt-6">
          <OSINTProfileTab profile={profile} />
        </TabsContent>
      )}
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

  let badgeClass = 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400';
  if (hasBadge && count > 0 && variant !== 'neutral') {
    badgeClass = 'bg-red-500/15 text-red-400';
  } else if (hasBadge && count === 0 && variant !== 'neutral') {
    badgeClass = 'bg-green-500/15 text-green-400';
  } else if (variant === 'neutral') {
    badgeClass = 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400';
  }

  return (
    <TabsTrigger
      value={id}
      className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-500 dark:text-gray-400 border-b-2 border-transparent rounded-none data-[state=active]:border-[#9E59EF] data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:text-slate-700 dark:hover:text-gray-300 transition-colors whitespace-nowrap"
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
