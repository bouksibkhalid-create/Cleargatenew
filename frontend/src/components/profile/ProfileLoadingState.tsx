import { OSINTLoader } from '../search/OSINTLoader';
import { Loader2 } from 'lucide-react';

interface ProfileLoadingStateProps {
  entityName: string;
  hasPreSearchData?: boolean;
}

export default function ProfileLoadingState({ entityName, hasPreSearchData }: ProfileLoadingStateProps) {
  // When we already have search data, show a compact spinner instead of the full OSINT animation
  if (hasPreSearchData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-[#0F1419] dark:to-[#1A1F2E] flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#931CF5] animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Generating intelligence profile for <span className="text-[#931CF5]">{entityName}</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Running AI analysis, risk scoring & adverse media scan…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-[#0F1419] dark:to-[#1A1F2E] flex flex-col items-center justify-center px-4 py-16">
      <OSINTLoader query={entityName} searchType="fuzzy" />
    </div>
  );
}
