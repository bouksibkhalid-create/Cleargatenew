import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { JURISDICTION_OPTIONS } from '../../data/mockOrders';

interface JurisdictionSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
}

export default function JurisdictionSelector({ selected, onChange, error }: JurisdictionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  const filtered = JURISDICTION_OPTIONS.filter((j) =>
    j.label.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce<Record<string, typeof JURISDICTION_OPTIONS>>((acc, j) => {
    (acc[j.region] ??= []).push(j);
    return acc;
  }, {});

  const selectedLabels = selected.map(
    (v) => JURISDICTION_OPTIONS.find((j) => j.value === v)?.label ?? v,
  );

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
        Juridictions d'intérêt
      </label>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        Sélectionnez les juridictions où l'entité pourrait avoir des intérêts
      </p>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-slate-700 text-left transition-colors min-h-[42px] ${
          error
            ? 'border-red-400 focus:ring-red-400/40'
            : 'border-slate-200 dark:border-slate-600 focus:ring-[#9E59EF]/40'
        } focus:outline-none focus:ring-2`}
      >
        <span className={selected.length ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
          {selected.length ? `${selected.length} juridiction${selected.length > 1 ? 's' : ''} sélectionnée${selected.length > 1 ? 's' : ''}` : 'Sélectionner des juridictions...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedLabels.map((label, i) => (
            <span
              key={selected[i]}
              className="inline-flex items-center gap-1 bg-[#9E59EF]/10 text-[#9E59EF] text-xs font-medium px-2 py-1 rounded-full"
            >
              {label}
              <button type="button" onClick={() => toggle(selected[i])} className="hover:text-[#8A3FE0]">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
          <div className="sticky top-0 bg-white dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#9E59EF]/40"
              />
            </div>
          </div>
          {Object.entries(grouped).map(([region, items]) => (
            <div key={region}>
              <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {region}
              </div>
              {items.map((j) => (
                <button
                  key={j.value}
                  type="button"
                  onClick={() => toggle(j.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 ${
                    selected.includes(j.value) ? 'text-[#9E59EF] font-medium' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      selected.includes(j.value)
                        ? 'bg-[#9E59EF] border-[#9E59EF]'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {selected.includes(j.value) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {j.label}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-sm text-slate-400 text-center">Aucun résultat</div>
          )}
        </div>
      )}
    </div>
  );
}
