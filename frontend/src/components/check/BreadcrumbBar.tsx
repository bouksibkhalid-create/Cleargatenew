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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-1.5 text-sm">
        <Link to={basePath} className="text-slate-500 dark:text-slate-400 hover:text-[#931CF5] transition-colors">
          {baseLabel}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <span className="text-slate-900 dark:text-slate-100 font-semibold uppercase">{entityName}</span>
      </div>

      <div className="flex items-center gap-2">
        {source === 'reports' && onRefresh ? (
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-[32px]"
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
                ? 'bg-[#931CF5]/10 text-[#931CF5] border border-[#931CF5]/30 cursor-default'
                : 'border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
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
              ? 'bg-[#931CF5]/10 text-[#931CF5] border border-[#931CF5]/30'
              : 'border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          {isMonitored ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {isMonitored ? 'Monitoring' : 'Monitor'}
        </button>

        <button
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-[32px]"
        >
          <Download className="w-3.5 h-3.5" />
          Report
        </button>
      </div>
    </div>
  );
}
