import { useEffect, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import ProfileHeader from './ProfileHeader';
import RiskScoreGauge from './RiskScoreGauge';
import HitSummaryCards from './HitSummaryCards';
import ProfileLoadingState from './ProfileLoadingState';
import ReportDownloadButton from '../report/ReportDownloadButton';
import { adaptProfileForReport } from '../report/utils/profileAdapter';
import ProfileTabs, { type ProfileTabId } from './tabs/ProfileTabs';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer mb-8"
          >
            ← Back to Dashboard
          </button>

          <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Generate Profile
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
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
              className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-full px-6 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
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

  const reportProfile = adaptProfileForReport(profile);

  return (
    <EntityProfileContent
      profile={profile}
      reportProfile={reportProfile}
      onBack={onBack}
    />
  );
}

function EntityProfileContent({
  profile,
  reportProfile,
  onBack,
}: {
  profile: import('../../types/profile').EntityProfile;
  reportProfile: any;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Zone A: Fixed Header */}
        <ProfileHeader
          entity={profile.entity}
          riskLevel={profile.risk_level}
          onBack={onBack}
          onDownloadReport={() => {}}
          reportButton={
            <ReportDownloadButton profile={reportProfile} variant="secondary" />
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
