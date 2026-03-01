import { useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import ProfileHeader from './ProfileHeader';
import RiskScoreGauge from './RiskScoreGauge';
import HitSummaryCards from './HitSummaryCards';
import AISummarySection from './AISummarySection';
import SourcesList from './SourcesList';
import CheckDetails from './CheckDetails';
import ProfileLoadingState from './ProfileLoadingState';
import ReportDownloadButton from '../report/ReportDownloadButton';
import { adaptProfileForReport } from '../report/utils/profileAdapter';
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <ProfileHeader
          entity={profile.entity}
          riskLevel={profile.risk_level}
          riskColor={profile.risk_color}
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
              riskLevel={profile.risk_level}
              riskColor={profile.risk_color}
            />
          </div>
          <div className="lg:col-span-2">
            <HitSummaryCards
              sanctionsHits={profile.sanctions_hits}
              pepHits={profile.pep_hits}
              adverseNewsCount={profile.adverse_news_count}
            />
          </div>
        </div>

        {/* AI Summary */}
        <AISummarySection
          summary={profile.ai_summary}
          keyFindings={profile.ai_key_findings}
          recommendation={profile.ai_recommendation}
          modelUsed={profile.ai_model_used}
          generationTimeMs={profile.ai_generation_time_ms}
        />

        {/* Sources & References */}
        <SourcesList sources={profile.sources} />

        {/* Check Details */}
        <CheckDetails
          entityType={profile.entity.entity_type}
          country={profile.entity.country}
          createdAt={profile.check_created_at}
          status={profile.check_status}
          durationMs={profile.check_duration_ms}
          sourcesFailed={profile.sources_failed}
        />
      </div>
    </div>
  );
}
