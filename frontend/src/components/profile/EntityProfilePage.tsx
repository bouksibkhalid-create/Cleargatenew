import { useEffect, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import ProfileHeader from './ProfileHeader';
import RiskScoreGauge from './RiskScoreGauge';
import HitSummaryCards from './HitSummaryCards';
import ProfileLoadingState from './ProfileLoadingState';
import ReportDownloadButton from '../report/ReportDownloadButton';
import MonitorToggle from '../monitor/MonitorToggle';
import ProfileTabs, { type ProfileTabId } from './tabs/ProfileTabs';
import { AlertTriangle, RotateCcw, Info } from 'lucide-react';

interface EntityProfilePageProps {
  entityName: string;
  entityType: string;
  country?: string;
  onBack: () => void;
}

export default function EntityProfilePage({
  entityName,
  entityType,
  country,
  onBack,
}: EntityProfilePageProps) {
  const { profile, loading, error, generateProfile } = useProfile();

  useEffect(() => {
    generateProfile({
      name: entityName,
      entity_type: entityType as 'individual' | 'organization',
      country,
    });
  }, [entityName, entityType, country]);

  // Loading state
  if (loading) {
    return <ProfileLoadingState entityName={entityName} />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1419]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white cursor-pointer mb-8 transition-colors"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-[#1A1F2E] rounded-xl border border-red-500/30 p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">
              Failed to Generate Profile
            </h2>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={() =>
                generateProfile({
                  name: entityName,
                  entity_type: entityType as 'individual' | 'organization',
                  country,
                })
              }
              className="inline-flex items-center gap-2 bg-white/10 text-white rounded-full px-6 py-2 text-sm font-medium hover:bg-white/20 border border-white/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No profile yet (shouldn't happen but guard)
  if (!profile) return null;

  return (
    <EntityProfileContent
      profile={profile}
      onBack={onBack}
    />
  );
}

function EntityProfileContent({
  profile,
  onBack,
}: {
  profile: import('../../types/profile').EntityProfile;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1419] to-[#1A1F2E]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Zone A: Fixed Header */}
        <ProfileHeader
          entity={profile.entity}
          riskLevel={profile.risk_level}
          onBack={onBack}
          onDownloadReport={() => {}}
          reportButton={
            <div className="flex items-center gap-2">
              <MonitorToggle entityName={profile.entity.name} entityData={profile.entity as any} />
              <ReportDownloadButton profile={profile as any} variant="secondary" />
            </div>
          }
        />

        {/* Risk Gauge + Hit Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RiskScoreGauge
              score={profile.risk_score}
              riskColor={profile.risk_color}
            />
          </div>
          <div className="lg:col-span-2">
            <HitSummaryCards
              sanctionsHits={profile.sanctions_hits}
              pepHits={profile.pep_hits}
              adverseNewsCount={profile.adverse_news_count}
              onSanctionsClick={() => setActiveTab('sanctions')}
              onPepClick={() => setActiveTab('pep')}
              onAdverseClick={() => setActiveTab('adverse-media')}
            />
          </div>
        </div>

        {/* Data source warning if any source failed */}
        {profile.sources_failed.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-400">
                {profile.check_status === 'partial' ? 'Partial Results' : 'Data Source Issues'}
              </p>
              <p className="text-amber-400/80 mt-0.5">
                The following data sources could not be reached:{' '}
                {profile.sources_failed.map((s) =>
                  s === 'adverse_media' ? 'Adverse Media' :
                  s === 'sanctions' ? 'Sanctions' :
                  s === 'offshore' ? 'Offshore Leaks' : s
                ).join(', ')}.
                Results may be incomplete.
              </p>
            </div>
          </div>
        )}

        {/* Zone B + C: Tab System */}
        <ProfileTabs
          profile={profile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}
