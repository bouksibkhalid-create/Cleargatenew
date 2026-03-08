import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { FileSearch, Lock, ArrowLeft } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import OrderProgressStepper from './OrderProgressStepper';
import JurisdictionSelector from './JurisdictionSelector';
import CgCard from '../common/CgCard';
import { useOrder } from '../../context/OrderContext';
import { LANGUAGE_OPTIONS, TIER_DEFINITIONS } from '../../data/mockOrders';

const PRIORITY_AREAS_INVESTIGATION = [
  'Traçage UBO (Bénéficiaire effectif)',
  'Analyse approfondie des médias défavorables',
];

const PRIORITY_AREAS_DUE_DILIGENCE_ONLY = [
  "Vérification registres d'entreprises",
  'Recherche de dossiers judiciaires',
  'Analyse de la structure réseau',
  'Couverture médias en langue source',
];

export default function ScopeConfiguration() {
  const navigate = useNavigate();
  const {
    state,
    setEntity,
    setJurisdictions,
    setPriorityAreas,
    setLanguages,
    setSpecialInstructions,
  } = useOrder();

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Guard: must have selected a tier
  if (!state.selectedTier) return <Navigate to="/order/select" replace />;

  const isDueDiligence = state.selectedTier === 'due_diligence';
  const tierDef = TIER_DEFINITIONS.find((t) => t.id === state.selectedTier)!;

  const allPriorityAreas = [
    ...PRIORITY_AREAS_INVESTIGATION,
    ...PRIORITY_AREAS_DUE_DILIGENCE_ONLY,
  ];

  const togglePriority = (area: string) => {
    const current = state.priorityAreas;
    setPriorityAreas(
      current.includes(area)
        ? current.filter((a) => a !== area)
        : [...current, area],
    );
  };

  const toggleLanguage = (lang: string) => {
    const current = state.languages;
    setLanguages(
      current.includes(lang)
        ? current.filter((l) => l !== lang)
        : [...current, lang],
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!state.entity.name || state.entity.name.trim().length < 2) {
      errs.entityName = "Le nom de l'entité est requis (minimum 2 caractères)";
    }
    if (!state.entity.type) {
      errs.entityType = "Veuillez sélectionner un type d'entité";
    }
    if (state.jurisdictions.length === 0) {
      errs.jurisdictions = 'Veuillez sélectionner au moins une juridiction';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (validate()) navigate('/order/review');
  };

  return (
    <div>
      <PageHeader
        icon={<FileSearch className="w-6 h-6 text-[#9E59EF]" />}
        title="Configurer le périmètre"
        subtitle="Définissez les paramètres de votre investigation"
      />

      <OrderProgressStepper currentStep={2} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Entity */}
          <CgCard title="Entité à investiguer">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Nom de l'entité
                </label>
                <input
                  value={state.entity.name}
                  onChange={(e) => setEntity({ name: e.target.value })}
                  placeholder="Ex : Igor Sechin"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.entityName ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 dark:border-slate-600 focus:ring-[#9E59EF]/40'
                  }`}
                />
                {errors.entityName && <p className="text-xs text-red-500 mt-1">{errors.entityName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Type d'entité
                </label>
                <select
                  value={state.entity.type}
                  onChange={(e) => setEntity({ type: e.target.value as 'person' | 'organization' | 'vessel' })}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.entityType ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 dark:border-slate-600 focus:ring-[#9E59EF]/40'
                  }`}
                >
                  <option value="person">Personne physique</option>
                  <option value="organization">Organisation</option>
                  <option value="vessel">Navire</option>
                </select>
                {errors.entityType && <p className="text-xs text-red-500 mt-1">{errors.entityType}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Alias connus <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input
                  value={state.entity.aliases.join(', ')}
                  onChange={(e) =>
                    setEntity({ aliases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
                  }
                  placeholder="Ex : Игорь Сечин, I. Sechin"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E59EF]/40"
                />
              </div>
            </div>
          </CgCard>

          {/* Section B: Jurisdictions */}
          <CgCard title="Juridictions" className="!overflow-visible">
            <JurisdictionSelector
              selected={state.jurisdictions}
              onChange={setJurisdictions}
              error={errors.jurisdictions}
            />
          </CgCard>

          {/* Section C: Priority Areas */}
          <CgCard title="Domaines prioritaires">
            <div className="space-y-3">
              {allPriorityAreas.map((area) => {
                const isDDOnly = PRIORITY_AREAS_DUE_DILIGENCE_ONLY.includes(area);
                const isLocked = isDDOnly && !isDueDiligence;
                const isChecked = state.priorityAreas.includes(area);

                return (
                  <label
                    key={area}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isLocked
                        ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 opacity-60 cursor-not-allowed'
                        : isChecked
                          ? 'border-[#9E59EF]/30 bg-[#9E59EF]/5'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isLocked}
                      onChange={() => !isLocked && togglePriority(area)}
                      className="w-4 h-4 rounded border-slate-300 text-[#9E59EF] focus:ring-[#9E59EF]/40 disabled:opacity-40"
                    />
                    <span className={`text-sm flex-1 ${isLocked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                      {area}
                    </span>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                        <Lock className="w-3 h-3" />
                        ClearGate Due Diligence
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </CgCard>

          {/* Section D: Languages (Tier 3 only) */}
          {isDueDiligence && (
            <CgCard title="Couverture en langue source">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Sélectionnez les langues pour la recherche de médias en langue source
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <label
                    key={lang.value}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      state.languages.includes(lang.value)
                        ? 'border-[#8B5CF6]/30 bg-[#8B5CF6]/5'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={state.languages.includes(lang.value)}
                      onChange={() => toggleLanguage(lang.value)}
                      className="w-4 h-4 rounded border-slate-300 text-[#8B5CF6] focus:ring-[#8B5CF6]/40"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{lang.label}</span>
                  </label>
                ))}
              </div>
            </CgCard>
          )}

          {/* Section E: Special Instructions */}
          <CgCard title="Instructions spécifiques">
            <textarea
              value={state.specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value.slice(0, 500))}
              placeholder='Instructions spécifiques pour l&#39;équipe d&#39;analyse (ex : "Focus sur les connexions en Russie", "Vérifier la structure BVI")'
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E59EF]/40 resize-none"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">
              {state.specialInstructions.length}/500
            </p>
          </CgCard>

          {/* Mobile navigation */}
          <div className="flex gap-3 lg:hidden">
            <button
              onClick={() => navigate('/order/select')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-[#00D4AA] hover:bg-[#00BF99] rounded-lg min-h-[44px] transition-colors"
            >
              Continuer
            </button>
          </div>
        </div>

        {/* Sidebar Summary (sticky) */}
        <div className="hidden lg:block">
          <div className="sticky top-8">
            <CgCard>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${tierDef.accentColor}15` }}
                  >
                    <FileSearch className="w-4 h-4" style={{ color: tierDef.accentColor }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{tierDef.name}</div>
                    <div className="text-xs text-slate-400">{tierDef.price}</div>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-700" />

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Entité</span>
                    <span className="font-medium text-slate-900 dark:text-white text-right max-w-[140px] truncate">
                      {state.entity.name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Juridictions</span>
                    <span className="font-medium text-slate-900 dark:text-white">{state.jurisdictions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Domaines</span>
                    <span className="font-medium text-slate-900 dark:text-white">{state.priorityAreas.length}</span>
                  </div>
                  {isDueDiligence && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Langues</span>
                      <span className="font-medium text-slate-900 dark:text-white">{state.languages.length}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Délai estimé</span>
                    <span className="font-medium text-slate-900 dark:text-white">{tierDef.turnaround}</span>
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-700" />

                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Total</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">{tierDef.price}</span>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full py-3 text-sm font-bold text-white bg-[#00D4AA] hover:bg-[#00BF99] rounded-xl min-h-[44px] transition-colors"
                >
                  Continuer
                </button>

                <button
                  onClick={() => navigate('/order/select')}
                  className="w-full py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ← Modifier le niveau
                </button>
              </div>
            </CgCard>
          </div>
        </div>
      </div>
    </div>
  );
}
