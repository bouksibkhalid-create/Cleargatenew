import { Check, Lock, Sparkles, Search, Shield } from 'lucide-react';
import type { TierDefinition } from '../../types/order';

interface TierCardProps {
  tier: TierDefinition;
  onSelect?: () => void;
  disabled?: boolean;
}

const TIER_ICONS: Record<string, typeof Search> = {
  scan: Search,
  investigation: Shield,
  due_diligence: Sparkles,
};

export default function TierCard({ tier, onSelect, disabled }: TierCardProps) {
  const Icon = TIER_ICONS[tier.id] ?? Search;
  const isScan = tier.id === 'scan';
  const isDueDiligence = tier.id === 'due_diligence';

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all duration-200 ${
        isScan
          ? 'border-slate-200 dark:border-slate-700 opacity-60 bg-slate-50 dark:bg-slate-800/40'
          : isDueDiligence
            ? 'border-[#8B5CF6] bg-white dark:bg-slate-800 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/15'
            : 'border-[#00D4AA] bg-white dark:bg-slate-800 shadow-lg shadow-teal-500/10 hover:shadow-xl hover:shadow-teal-500/15'
      }`}
    >
      {/* Badge */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            isScan
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              : isDueDiligence
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
          }`}
        >
          {isDueDiligence && <Sparkles className="w-3 h-3" />}
          {tier.badge}
        </div>
      </div>

      {/* Icon + Name */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${tier.accentColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: tier.accentColor }} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tier.name}</h3>
      </div>

      {/* Price */}
      <div className="mb-1">
        {tier.price ? (
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{tier.price}</span>
        ) : (
          <span className="text-lg font-semibold text-slate-400 dark:text-slate-500">Inclus</span>
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        Livraison en {tier.turnaround.toLowerCase()}
      </p>

      <hr className="border-slate-200 dark:border-slate-700 mb-5" />

      {/* Features */}
      <ul className="flex-1 space-y-2.5 mb-6">
        {tier.features.map((f) => (
          <li key={f.label} className="flex items-start gap-2 text-sm">
            <Check
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: f.isNew ? tier.accentColor : '#94A3B8' }}
            />
            <span
              className={`${
                f.isNew
                  ? 'text-slate-900 dark:text-white font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {tier.isPurchasable ? (
        <button
          onClick={onSelect}
          disabled={disabled}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isDueDiligence
              ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white focus-visible:ring-[#8B5CF6]'
              : 'bg-[#00D4AA] hover:bg-[#00BF99] text-white focus-visible:ring-[#00D4AA]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Sélectionner
        </button>
      ) : (
        <div className="w-full py-3 rounded-xl text-sm font-medium text-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-2 min-h-[44px]">
          <Lock className="w-3.5 h-3.5" />
          Niveau actuel
        </div>
      )}
    </div>
  );
}
