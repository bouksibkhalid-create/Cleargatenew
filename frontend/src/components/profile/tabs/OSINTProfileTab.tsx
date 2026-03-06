import { Globe, ExternalLink, ShieldCheck, AlertTriangle, Info, User, Newspaper, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { EntityProfile } from '../../../types/profile';
import StatusBanner from '../shared/StatusBanner';

interface OSINTProfileTabProps {
  profile: EntityProfile;
}

const RISK_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  low: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: 'text-green-500' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-500' },
  high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-500' },
};

export default function OSINTProfileTab({ profile }: OSINTProfileTabProps) {
  const { t } = useTranslation();
  const hasOSINT = !!(profile.osint_biography || profile.osint_adverse_summary);
  const risk = profile.osint_risk_assessment || 'low';
  const riskStyle = RISK_COLORS[risk] || RISK_COLORS.low;
  const sources = profile.osint_sources_investigated || [];

  // No OSINT data at all
  if (!hasOSINT && sources.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-8 text-center">
        <Globe className="w-10 h-10 text-slate-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {t('osintProfile.noData', 'No Intelligence Data Available')}
        </h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md mx-auto">
          {t('osintProfile.noDataDesc', 'Intelligence profiling is only available for entities not found on sanctions lists.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Not Sanctioned Banner */}
      <StatusBanner
        status="clear"
        icon={ShieldCheck}
        title={t('osintProfile.clearStatus', 'NOT SANCTIONED — No Matches Found on Watchlists')}
        subtitle={t('osintProfile.clearSubtitle', 'Screened against OFAC SDN, EU Consolidated, UN Security Council, UK Sanctions, Canada SEMA')}
      />

      {/* OSINT Risk Assessment */}
      <div className={`rounded-xl border p-5 ${riskStyle.bg} ${riskStyle.border}`}>
        <div className="flex items-center gap-3 mb-3">
          <Scale className={`w-5 h-5 ${riskStyle.icon}`} />
          <h3 className={`text-sm font-semibold uppercase tracking-wider ${riskStyle.text}`}>
            {t('osintProfile.riskAssessment', 'Risk Assessment')}: {risk.toUpperCase()}
          </h3>
        </div>
        {profile.osint_risk_rationale && (
          <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">
            {profile.osint_risk_rationale}
          </p>
        )}
      </div>

      {/* Biography */}
      {profile.osint_biography && (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#9E59EF]" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
              {t('osintProfile.biography', 'Biography')}
            </p>
          </div>
          <p className="text-sm text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
            {profile.osint_biography}
          </p>
        </div>
      )}

      {/* Adverse Media / Reputation Summary */}
      {profile.osint_adverse_summary && (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
              {t('osintProfile.adverseSummary', 'Adverse Media & Reputation')}
            </p>
          </div>
          <p className="text-sm text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
            {profile.osint_adverse_summary}
          </p>
        </div>
      )}

      {/* Synthesis Error */}
      {profile.osint_synthesis_error && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-400">{t('osintProfile.analysisWarning', 'Analysis Warning')}</p>
            <p className="text-amber-400/80 mt-0.5">{profile.osint_synthesis_error}</p>
          </div>
        </div>
      )}

      {/* Sources Investigated */}
      {sources.length > 0 && (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-[#9E59EF]" />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
              {t('osintProfile.sourcesInvestigated', 'Sources Investigated')} ({sources.length})
            </p>
          </div>
          <div className="space-y-2">
            {sources.map((src, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-white/5 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${src.success ? 'bg-green-500' : 'bg-red-400'}`} />
                  <span className="text-sm text-slate-700 dark:text-gray-300 truncate">
                    {src.title || new URL(src.url).hostname}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {src.success ? (
                    <span className="text-xs text-slate-400 dark:text-gray-500">
                      {src.text_length > 0 ? `${Math.round(src.text_length / 1000)}k chars` : '—'}
                    </span>
                  ) : (
                    <span className="text-xs text-red-400">{t('osintProfile.failed', 'failed')}</span>
                  )}
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9E59EF] hover:text-[#B57FF5] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model info */}
      {profile.osint_synthesis_model && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500">
          <Info className="w-3.5 h-3.5" />
          <span>{t('osintProfile.generatedBy', 'Generated by')}: {profile.osint_synthesis_model}</span>
        </div>
      )}
    </div>
  );
}
