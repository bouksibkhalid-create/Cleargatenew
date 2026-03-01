import { Shield, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import type { EntityProfile } from '../../../types/profile';
import StatusBanner from '../shared/StatusBanner';
import EmptyState from '../shared/EmptyState';

interface SanctionsTabProps {
  profile: EntityProfile;
}

export default function SanctionsTab({ profile }: SanctionsTabProps) {
  const isSanctioned = profile.is_sanctioned;
  const results = profile.sanctions_results ?? [];
  const listsMatched = profile.sanctions_lists_matched ?? [];

  if (!isSanctioned && results.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No Sanctions Found"
        description="This entity was screened against international sanctions lists and no active designations were identified."
        details={`Lists screened: OFAC SDN, UN Security Council, EU Consolidated, UK Sanctions, Canada SEMA · Last checked: ${formatDate(profile.check_created_at)}`}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <StatusBanner
        status={isSanctioned ? 'found' : 'clear'}
        icon={isSanctioned ? AlertTriangle : CheckCircle}
        title={
          isSanctioned
            ? `SANCTIONED — Active designations on ${listsMatched.length || 1} list(s)`
            : 'NO ACTIVE SANCTIONS'
        }
        subtitle={
          isSanctioned && listsMatched.length > 0
            ? listsMatched.join(' · ')
            : undefined
        }
      />

      {/* Designation Cards */}
      {results.map((result, idx) => (
        <DesignationCard key={idx} result={result} index={idx + 1} />
      ))}

      {/* Sanctions Lists Matrix */}
      {listsMatched.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
            Sanctions Lists Matched
          </p>
          <div className="space-y-2">
            {listsMatched.map((list, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-gray-800">{list}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DesignationCard({ result, index }: { result: Record<string, any>; index: number }) {
  const name = result.name || result.full_name || result.caption || 'Sanctions Match';
  const programs = result.programs || result.sanction_lists || result.datasets || [];
  const source = result.source || result.source_url || '';
  const reason = result.sanctions_reason || result.reason || result.remarks || '';
  const props = result.properties || {};
  const topics = props.topics || result.topics || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Designation #{index}
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Name" value={name} />
          {programs.length > 0 && (
            <InfoRow label="Programme(s)" value={programs.join(', ')} />
          )}
          {topics.length > 0 && (
            <InfoRow label="Topics" value={topics.join(', ')} />
          )}
          {result.first_seen && <InfoRow label="First Seen" value={result.first_seen} />}
          {result.last_seen && <InfoRow label="Last Updated" value={result.last_seen} />}
        </div>

        {reason && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Designation Reasoning
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 italic">
              "{reason}"
            </p>
          </div>
        )}

        {source && (
          <a
            href={source}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
