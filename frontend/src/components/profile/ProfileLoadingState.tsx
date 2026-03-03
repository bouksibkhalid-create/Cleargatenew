import { OSINTLoader } from '../search/OSINTLoader';

interface ProfileLoadingStateProps {
  entityName: string;
}

export default function ProfileLoadingState({ entityName }: ProfileLoadingStateProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-[#0F1419] dark:to-[#1A1F2E] flex flex-col items-center justify-center px-4 py-16">
      <OSINTLoader query={entityName} searchType="fuzzy" />
    </div>
  );
}
