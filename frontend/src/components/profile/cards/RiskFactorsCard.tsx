import SeverityBadge from '../shared/SeverityBadge';

interface RiskFactorsCardProps {
  factors: string[];
}

function inferSeverity(factor: string): 'high' | 'medium' | 'low' {
  const lower = factor.toLowerCase();
  if (
    lower.includes('sanctioned') ||
    lower.includes('sanctions list') ||
    lower.includes('high-severity') ||
    lower.includes('convicted') ||
    lower.includes('criminal')
  )
    return 'high';
  if (
    lower.includes('pep') ||
    lower.includes('politically exposed') ||
    lower.includes('medium-severity') ||
    lower.includes('adverse media') ||
    lower.includes('offshore')
  )
    return 'medium';
  return 'low';
}

export default function RiskFactorsCard({ factors }: RiskFactorsCardProps) {
  if (factors.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500 mb-4">
        Risk Factors
      </p>
      <div className="space-y-3">
        {factors.map((factor, idx) => {
          const severity = inferSeverity(factor);
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <SeverityBadge severity={severity} />
              </div>
              <p className="text-sm text-slate-700 dark:text-gray-300">{factor}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
