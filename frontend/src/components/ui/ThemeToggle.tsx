import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center min-w-[36px] min-h-[36px] rounded-full border transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563eb]
        ${isDark
          ? 'bg-white/10 border-white/20 text-yellow-300 hover:bg-white/20'
          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
        }
        ${className}`}
      aria-label="Toggle Dark Mode"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-200" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-200" />
      )}
    </button>
  );
}
