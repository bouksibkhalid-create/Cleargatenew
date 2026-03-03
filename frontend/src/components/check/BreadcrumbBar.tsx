import { Link } from 'react-router-dom';
import { ChevronRight, Bookmark, BookmarkCheck, Eye, EyeOff, Download, RefreshCw } from 'lucide-react';

interface BreadcrumbBarProps {
  entityName: string;
  source: 'check' | 'reports';
  isSaved: boolean;
  isMonitored: boolean;
  onSave: () => void;
  onToggleMonitor: () => void;
  onDownload: () => void;
  onRefresh?: () => void;
  saving?: boolean;
}

export default function BreadcrumbBar({
  entityName, source, isSaved, isMonitored,
  onSave, onToggleMonitor, onDownload, onRefresh, saving,
}: BreadcrumbBarProps) {
  const basePath = source === 'reports' ? '/reports' : '/check';
  const baseLabel = source === 'reports' ? 'Reports' : 'New Check';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E5E7EB]">
      <div className="flex items-center gap-1.5 text-sm">
        <Link to={basePath} className="text-[#6B7280] hover:text-[#00D4AA] transition-colors">
          {baseLabel}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
        <span className="text-[#111827] font-semibold uppercase">{entityName}</span>
      </div>

      <div className="flex items-center gap-2">
        {source === 'reports' && onRefresh ? (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Search
          </button>
        ) : (
          <button
            onClick={onSave}
            disabled={isSaved || saving}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isSaved
                ? 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/30 cursor-default'
                : 'border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : isSaved ? 'Saved' : 'Save Entity'}
          </button>
        )}

        <button
          onClick={onToggleMonitor}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            isMonitored
              ? 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/30'
              : 'border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-gray-50'
          }`}
        >
          {isMonitored ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {isMonitored ? 'Monitoring' : 'Monitor'}
        </button>

        <button
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E5E7EB] rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-gray-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Report
        </button>
      </div>
    </div>
  );
}
