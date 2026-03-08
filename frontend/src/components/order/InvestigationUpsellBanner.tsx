import { useNavigate } from 'react-router-dom';
import { FileSearch, ArrowRight } from 'lucide-react';

interface InvestigationUpsellBannerProps {
  entityName: string;
  entityType?: string;
}

export default function InvestigationUpsellBanner({ entityName, entityType }: InvestigationUpsellBannerProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const params = new URLSearchParams({ entity: entityName });
    if (entityType) params.set('type', entityType);
    navigate(`/order/select?${params.toString()}`);
  };

  return (
    <div className="bg-gradient-to-r from-[#00D4AA]/10 to-[#8B5CF6]/10 border border-[#00D4AA]/30 rounded-xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/15 flex items-center justify-center flex-shrink-0">
        <FileSearch className="w-5 h-5 text-[#00D4AA]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-900 dark:text-white">
          Approfondir cette analyse ?
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Obtenez un rapport d'investigation complet avec analyse UBO, vérification des registres et couverture médiatique approfondie.
        </p>
      </div>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-[#00D4AA] hover:bg-[#00BF99] rounded-lg transition-colors whitespace-nowrap min-h-[40px]"
      >
        Commander <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
