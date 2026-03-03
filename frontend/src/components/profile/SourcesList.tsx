import { FileText } from 'lucide-react';
import type { SourceItem } from '../../types/profile';
import SourceItemRow from './SourceItem';

interface SourcesListProps {
  sources: SourceItem[];
}

export default function SourcesList({ sources }: SourcesListProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-slate-400 dark:text-gray-500" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Sources &amp; References
        </h3>
      </div>

      {sources.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-gray-400">
            No intelligence sources identified.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1A1F2E] rounded-xl border border-slate-200 dark:border-white/10 divide-y divide-slate-200 dark:divide-white/10">
          {sources.map((source, idx) => (
            <SourceItemRow key={`${source.type}-${idx}`} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}
