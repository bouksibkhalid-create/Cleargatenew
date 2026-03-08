import { Globe, Brain, Scale, Building2, Network, Languages, UserCheck } from 'lucide-react';
import CgCard from '../common/CgCard';
import type { InvestigationReport as IReport } from '../../types/order';

interface InvestigationReportProps {
  report: IReport;
  tier: 'investigation' | 'due_diligence';
}

const RELEVANCE_COLORS: Record<string, string> = {
  high: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  medium: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  low: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

export default function InvestigationReportView({ report, tier }: InvestigationReportProps) {
  return (
    <div className="space-y-6">
      {/* Risk Score Banner */}
      <div className={`rounded-xl p-5 flex items-center gap-4 ${
        report.riskScore >= 80
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          : report.riskScore >= 50
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-extrabold ${
          report.riskScore >= 80
            ? 'bg-red-500 text-white'
            : report.riskScore >= 50
              ? 'bg-amber-500 text-white'
              : 'bg-green-500 text-white'
        }`}>
          {report.riskScore}
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            Niveau de risque : {report.riskLevel}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Rapport complété le {new Date(report.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Sanctions */}
      <CgCard title="Sanctions" action={
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          report.sanctions.isSanctioned
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
          {report.sanctions.isSanctioned ? 'SANCTIONNÉ' : 'NON SANCTIONNÉ'}
        </span>
      }>
        {report.sanctions.isSanctioned ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {report.sanctions.programs.map((p) => (
                <span key={p} className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
                  {p}
                </span>
              ))}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Date de désignation :</span> {report.sanctions.designationDate}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{report.sanctions.reason}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">{report.sanctions.reason}</p>
        )}
      </CgCard>

      {/* Adverse Media */}
      <CgCard
        title="Analyse des médias défavorables"
        action={
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {report.adverseMedia.totalArticles} articles · {report.adverseMedia.highRelevance} haute pertinence
          </span>
        }
      >
        <div className="space-y-3">
          {report.adverseMedia.summary.map((article, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${RELEVANCE_COLORS[article.relevance]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{article.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs opacity-80">
                    <span>{article.source}</span>
                    <span>·</span>
                    <span>{article.date}</span>
                    <span>·</span>
                    <span className="font-medium">{article.allegationType}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  article.relevance === 'high' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                  article.relevance === 'medium' ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200' :
                  'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                }`}>
                  {article.relevance}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CgCard>

      {/* UBO Chain */}
      <CgCard title="Chaîne UBO (Bénéficiaire effectif)">
        <div className="space-y-0">
          {report.uboChain.map((node, i) => (
            <div key={i} className="flex items-start gap-3">
              {/* Connector */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  node.type === 'Person'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
                }`}>
                  {node.type === 'Person' ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                </div>
                {i < report.uboChain.length - 1 && (
                  <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700" />
                )}
              </div>

              {/* Node details */}
              <div className="pb-4 flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{node.entity}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <Globe className="w-3 h-3" />
                  {node.jurisdiction}
                  <span>·</span>
                  <span>{node.role}</span>
                  {node.ownership && (
                    <>
                      <span>·</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{node.ownership}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CgCard>

      {/* Jurisdictional Risk */}
      <CgCard title="Risque juridictionnel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Juridiction</th>
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Statut GAFI</th>
                <th className="text-center py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">CPI</th>
                <th className="text-right py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Risque</th>
              </tr>
            </thead>
            <tbody>
              {report.jurisdictionalRisk.map((jr) => (
                <tr key={jr.jurisdiction} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2.5 font-medium text-slate-900 dark:text-white">{jr.jurisdiction}</td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-300">{jr.fatfStatus}</td>
                  <td className="py-2.5 text-center">
                    <span className={`inline-block font-bold ${
                      jr.cpiScore < 30 ? 'text-red-600' : jr.cpiScore < 60 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {jr.cpiScore}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      jr.riskLevel.includes('élevé') || jr.riskLevel.includes('Critique')
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : jr.riskLevel.includes('Modéré')
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}>
                      {jr.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CgCard>

      {/* AI Brief */}
      <CgCard title="Brief analytique IA">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-[#9E59EF] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.aiBrief}</p>
        </div>
      </CgCard>

      {/* Tier 3 only sections */}
      {tier === 'due_diligence' && (
        <>
          {/* Court Records */}
          {report.courtRecords && report.courtRecords.length > 0 && (
            <CgCard title="Dossiers judiciaires">
              <div className="space-y-4">
                {report.courtRecords.map((cr, i) => (
                  <div key={i} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{cr.caseNumber}</span>
                      </div>
                      <span className="text-xs text-slate-400">{cr.date}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {cr.court} · {cr.jurisdiction}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span className="font-medium">Parties :</span> {cr.parties}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{cr.summary}</p>
                  </div>
                ))}
              </div>
            </CgCard>
          )}

          {/* Corporate Registry */}
          {report.corporateRegistry && report.corporateRegistry.length > 0 && (
            <CgCard title="Vérification registres d'entreprises">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Entité</th>
                      <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Registre</th>
                      <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Juridiction</th>
                      <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.corporateRegistry.map((reg, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2.5 font-medium text-slate-900 dark:text-white">{reg.entityName}</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-300 text-xs">{reg.registry}</td>
                        <td className="py-2.5 text-slate-500 hidden sm:table-cell">{reg.jurisdiction}</td>
                        <td className="py-2.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {reg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CgCard>
          )}

          {/* Network Analysis */}
          {report.networkAnalysis && (
            <CgCard title="Analyse de structure réseau">
              <div className="flex items-start gap-3">
                <Network className="w-5 h-5 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{report.networkAnalysis}</p>
              </div>
            </CgCard>
          )}

          {/* Source Language Media */}
          {report.sourceLanguageMedia && report.sourceLanguageMedia.length > 0 && (
            <CgCard title="Médias en langue source">
              <div className="space-y-3">
                {report.sourceLanguageMedia.map((item, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${RELEVANCE_COLORS[item.relevance]}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Languages className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{item.originalLanguage}</span>
                      <span className="text-xs opacity-70">· {item.source} · {item.date}</span>
                    </div>
                    <div className="text-xs italic opacity-70 mb-1">{item.originalTitle}</div>
                    <p className="text-sm">{item.translatedSummary}</p>
                  </div>
                ))}
              </div>
            </CgCard>
          )}

          {/* Analyst Conclusion */}
          {report.analystConclusion && (
            <CgCard title="Conclusion analyste">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                  {report.analystConclusion.conclusion}
                </p>
                <hr className="border-slate-200 dark:border-slate-700 mb-3" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {report.analystConclusion.analystName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {report.analystConclusion.analystName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {report.analystConclusion.analystTitle} · {report.analystConclusion.date}
                    </div>
                  </div>
                </div>
              </div>
            </CgCard>
          )}
        </>
      )}
    </div>
  );
}
