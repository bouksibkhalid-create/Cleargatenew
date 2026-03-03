interface AISummarySectionProps {
  summary: string | null;
  keyFindings: string[];
  recommendation: string | null;
  modelUsed: string | null;
  generationTimeMs: number | null;
}

export default function AISummarySection({ summary }: AISummarySectionProps) {
  return (
    <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-500 mb-4">
        AI Summary
      </p>

      {summary ? (
        <p className="text-sm text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      ) : (
        <p className="text-sm text-slate-500 dark:text-gray-400 italic">
          AI analysis unavailable for this entity.
        </p>
      )}
    </div>
  );
}
