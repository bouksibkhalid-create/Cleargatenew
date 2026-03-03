import { User } from 'lucide-react';
import type { EntityProfile } from '../../../types/profile';

interface EntityIdentityCardProps {
  profile: EntityProfile;
}

export default function EntityIdentityCard({ profile }: EntityIdentityCardProps) {
  const entity = profile.entity;
  const aliases = entity.aliases ?? [];
  const hasAnyData = aliases.length > 0 || entity.country;

  if (!hasAnyData) return null;

  return (
    <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-slate-400 dark:text-gray-400" />
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
          Entity Identity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <InfoRow label="Full Name" value={entity.name} />
        <InfoRow label="Entity Type" value={capitalize(entity.entity_type)} />
        {entity.country && <InfoRow label="Country" value={entity.country} />}
        {aliases.length > 0 && (
          <InfoRow label="Aliases" value={aliases.join(', ')} />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-gray-500">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white font-medium">{value}</p>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
