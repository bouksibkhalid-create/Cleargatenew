import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem('sidebar_collapsed') !== 'false'
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      sessionStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  // Keyboard shortcut: Cmd+B / Ctrl+B
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        if (isMobile) {
          setMobileOpen((p) => !p);
        } else {
          toggle();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle, isMobile]);

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      )}

      {/* Mobile hamburger */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-40 flex items-center px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-700 dark:text-white p-1 min-w-[24px] min-h-[24px]"
            aria-label={t('sidebar.openMenu')}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 text-sm font-bold tracking-wide text-slate-900 dark:text-white uppercase">{t('brand.name')}</span>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-[-44px] text-white bg-slate-900 rounded-full p-2 min-w-[24px] min-h-[24px]"
              aria-label={t('sidebar.closeMenu')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Main content */}
      <main
        className={`min-h-screen transition-[margin-left] duration-200 ease-in-out ${
          isMobile
            ? 'ml-0 pt-14'
            : collapsed
              ? 'ml-[60px]'
              : 'ml-[260px]'
        }`}
      >
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
