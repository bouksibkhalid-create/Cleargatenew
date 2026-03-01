import { Lightbulb } from 'lucide-react';

interface RecommendationsCardProps {
  recommendation: string;
  keyFindings: string[];
}

export default function RecommendationsCard({ recommendation, keyFindings }: RecommendationsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          Recommended Actions
        </p>
      </div>

      {keyFindings.length > 0 && (
        <ul className="space-y-2 mb-4">
          {keyFindings.map((finding, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-gray-400 font-medium shrink-0">{idx + 1}.</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
        <p className="text-sm text-blue-800 font-medium">{recommendation}</p>
      </div>
    </div>
  );
}
