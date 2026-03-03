import { Lightbulb } from 'lucide-react';

interface RecommendationsCardProps {
  recommendation: string;
  keyFindings: string[];
}

export default function RecommendationsCard({ recommendation, keyFindings }: RecommendationsCardProps) {
  return (
    <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500">
          Recommended Actions
        </p>
      </div>

      {keyFindings.length > 0 && (
        <ul className="space-y-2 mb-4">
          {keyFindings.map((finding, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-gray-300">
              <span className="text-slate-500 dark:text-gray-500 font-medium shrink-0">{idx + 1}.</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="bg-[#931CF5]/10 border border-[#931CF5]/30 rounded-lg p-3">
        <p className="text-sm text-[#931CF5] font-medium">{recommendation}</p>
      </div>
    </div>
  );
}
