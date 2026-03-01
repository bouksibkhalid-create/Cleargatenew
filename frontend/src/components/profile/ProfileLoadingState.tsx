import { OSINTLoader } from '../search/OSINTLoader';

interface ProfileLoadingStateProps {
  entityName: string;
}

export default function ProfileLoadingState({ entityName }: ProfileLoadingStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <OSINTLoader query={entityName} searchType="fuzzy" />
    </div>
  );
}
