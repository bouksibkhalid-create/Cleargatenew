import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { FileSearch, ArrowLeft, Loader2, Check } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import OrderProgressStepper from './OrderProgressStepper';
import CgCard from '../common/CgCard';
import { useOrder } from '../../context/OrderContext';
import { TIER_DEFINITIONS, JURISDICTION_OPTIONS, LANGUAGE_OPTIONS } from '../../data/mockOrders';

export default function OrderReview() {
  const navigate = useNavigate();
  const { state, confirmOrder } = useOrder();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!state.selectedTier) return <Navigate to="/order/select" replace />;
  if (!state.entity.name || state.jurisdictions.length === 0) return <Navigate to="/order/configure" replace />;

  const tierDef = TIER_DEFINITIONS.find((t) => t.id === state.selectedTier)!;

  const jurisdictionLabels = state.jurisdictions.map(
    (v) => JURISDICTION_OPTIONS.find((j) => j.value === v)?.label ?? v,
  );

  const languageLabels = state.languages.map(
    (v) => LANGUAGE_OPTIONS.find((l) => l.value === v)?.label ?? v,
  );

  const handleConfirm = async () => {
    if (!termsAccepted) {
      setTermsError(true);
      return;
    }
    setSubmitting(true);
    // Simulate brief delay for realism
    await new Promise((r) => setTimeout(r, 1500));
    const orderId = confirmOrder();
    navigate(`/order/confirmed/${orderId}`);
  };

  return (
    <div>
      <PageHeader
        icon={<FileSearch className="w-6 h-6 text-[#9E59EF]" />}
        title="Vérification de la commande"
        subtitle="Vérifiez les détails avant de confirmer"
      />

      <OrderProgressStepper currentStep={3} />

      <div className="max-w-3xl mx-auto space-y-6">
        <CgCard>
          <div className="space-y-5">
            {/* Tier */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Récapitulatif</h3>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ background: tierDef.accentColor }}
              >
                {tierDef.name}
              </span>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Entity */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Entité</div>
              <div className="text-sm text-slate-900 dark:text-white font-semibold">{state.entity.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {state.entity.type === 'person' ? 'Personne physique' : state.entity.type === 'organization' ? 'Organisation' : 'Navire'}
                {state.entity.aliases.length > 0 && ` · Alias : ${state.entity.aliases.join(', ')}`}
              </div>
            </div>

            {/* Jurisdictions */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Juridictions</div>
              <div className="flex flex-wrap gap-1.5">
                {jurisdictionLabels.map((label) => (
                  <span key={label} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Priority Areas */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Domaines prioritaires</div>
              <ul className="space-y-1.5">
                {state.priorityAreas.map((area) => (
                  <li key={area} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <Check className="w-4 h-4 text-[#00D4AA] flex-shrink-0" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>

            {/* Languages */}
            {languageLabels.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Langues source</div>
                <div className="flex flex-wrap gap-1.5">
                  {languageLabels.map((label) => (
                    <span key={label} className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium px-2.5 py-1 rounded-full">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {state.specialInstructions && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Instructions spécifiques</div>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  "{state.specialInstructions}"
                </p>
              </div>
            )}

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Turnaround + Price */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Délai estimé</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{tierDef.turnaround}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">Prix</div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{tierDef.price}</div>
              </div>
            </div>
          </div>
        </CgCard>

        {/* Terms */}
        <CgCard>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => { setTermsAccepted(e.target.checked); setTermsError(false); }}
              className={`w-4 h-4 mt-0.5 rounded border-slate-300 text-[#9E59EF] focus:ring-[#9E59EF]/40 ${termsError ? 'border-red-400' : ''}`}
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              J'accepte les{' '}
              <a href="#" className="text-[#9E59EF] hover:underline" onClick={(e) => e.preventDefault()}>
                conditions générales de service
              </a>{' '}
              de ClearGate
            </span>
          </label>
          {termsError && (
            <p className="text-xs text-red-500 mt-2 ml-7">Vous devez accepter les conditions générales</p>
          )}
        </CgCard>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/order/configure')}
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4" /> Modifier
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-[#00D4AA] hover:bg-[#00BF99] rounded-xl min-h-[48px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirmation en cours...
              </>
            ) : (
              'Confirmer la commande'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
