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
        <FileText className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Sources &amp; References
        </h3>
      </div>

      {sources.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-400">
            No intelligence sources identified.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {sources.map((source, idx) => (
            <SourceItemRow key={`${source.type}-${idx}`} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}
