import { Crown } from 'lucide-react';
import type { EntityProfile } from '../../../types/profile';
import StatusBanner from '../shared/StatusBanner';
import EmptyState from '../shared/EmptyState';

interface PEPTabProps {
  profile: EntityProfile;
}

const PEP_CATEGORIES = [
  'Executive',
  'Legislative',
  'Judicial',
  'Diplomatic',
  'Military',
  "Int'l Orgs",
  'Central Banks',
  'Regulatory',
];

export default function PEPTab({ profile }: PEPTabProps) {
  const isPep = profile.is_pep;
  const pepDetails = profile.pep_details;

  if (!isPep) {
    return (
      <EmptyState
        icon={Crown}
        title="No PEP Status Identified"
        description="This entity was screened against PEP databases and no Politically Exposed Person classification was identified."
        details="Databases checked: OpenSanctions PEP, national PEP registries"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <StatusBanner
        status="found"
        icon={Crown}
        title="POLITICALLY EXPOSED PERSON"
        subtitle={pepDetails ? `Details: ${pepDetails}` : undefined}
      />

      {/* PEP Category Grid */}
      <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500 mb-4">
          PEP Category Mapping
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PEP_CATEGORIES.map((cat) => {
            const isActive =
              pepDetails?.toLowerCase().includes(cat.toLowerCase().replace("'", '')) ?? false;
            return (
              <div
                key={cat}
                className={`rounded-lg border p-3 text-center text-sm font-medium transition-colors ${isActive
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400'
                  }`}
              >
                {cat}
                {isActive && <span className="ml-1 text-amber-400">●</span>}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-3">● = This entity's category</p>
      </div>

      {/* PEP Risk Narrative */}
      {pepDetails && (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500 mb-4">
            PEP Risk Narrative
          </p>
          <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed italic">
            "{pepDetails}"
          </p>
        </div>
      )}

    </div>
  );
}
