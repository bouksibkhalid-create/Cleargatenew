import { useTranslation } from 'react-i18next';

interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  const toggle = () => {
    const next = currentLang === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors min-w-[48px] min-h-[32px] justify-center
        border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300
        hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]
        ${className}`}
      aria-label={currentLang === 'en' ? 'Switch to French' : 'Passer en anglais'}
      title={currentLang === 'en' ? 'Passer en français' : 'Switch to English'}
    >
      <span className={currentLang === 'en' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>EN</span>
      <span className="text-slate-300 dark:text-slate-600">|</span>
      <span className={currentLang === 'fr' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>FR</span>
    </button>
  );
}
