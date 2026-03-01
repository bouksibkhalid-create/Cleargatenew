interface AISummarySectionProps {
  summary: string | null;
  keyFindings: string[];
  recommendation: string | null;
  modelUsed: string | null;
  generationTimeMs: number | null;
}

export default function AISummarySection({ summary }: AISummarySectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
        AI Summary
      </p>

      {summary ? (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      ) : (
        <p className="text-sm text-gray-400 italic">
          AI analysis unavailable for this entity.
        </p>
      )}
    </div>
  );
}
