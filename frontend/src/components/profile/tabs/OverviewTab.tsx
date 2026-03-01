import type { EntityProfile } from '../../../types/profile';
import AISummarySection from '../AISummarySection';
import SourcesList from '../SourcesList';
import CheckDetails from '../CheckDetails';
import RiskFactorsCard from '../cards/RiskFactorsCard';
import EntityIdentityCard from '../cards/EntityIdentityCard';
import RecommendationsCard from '../cards/RecommendationsCard';

interface OverviewTabProps {
  profile: EntityProfile;
}

export default function OverviewTab({ profile }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <AISummarySection
        summary={profile.ai_summary}
        keyFindings={profile.ai_key_findings}
        recommendation={profile.ai_recommendation}
        modelUsed={profile.ai_model_used}
        generationTimeMs={profile.ai_generation_time_ms}
      />

      {/* Risk Factors */}
      {profile.risk_factors.length > 0 && (
        <RiskFactorsCard factors={profile.risk_factors} />
      )}

      {/* Entity Identity */}
      <EntityIdentityCard profile={profile} />

      {/* AI Recommendations */}
      {profile.ai_recommendation && (
        <RecommendationsCard
          recommendation={profile.ai_recommendation}
          keyFindings={profile.ai_key_findings}
        />
      )}

      {/* Sources & References */}
      <SourcesList sources={profile.sources} />

      {/* Check Details */}
      <CheckDetails
        entityType={profile.entity.entity_type}
        country={profile.entity.country}
        createdAt={profile.check_created_at}
        status={profile.check_status}
        sourcesFailed={profile.sources_failed}
      />
    </div>
  );
}
