import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Search, FileText, Clock, Database,
  ChevronLeft, ChevronRight, Shield, FileSearch, ClipboardList,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReportsCount } from '../../hooks/useReportsCount';
import { useOrder } from '../../context/OrderContext';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageToggle from '../ui/LanguageToggle';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

const NAV_SECTIONS = [
  {
    labelKey: 'nav.main',
    items: [
      { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
      { icon: Search, labelKey: 'nav.newCheck', path: '/check' },
      { icon: FileText, labelKey: 'nav.reports', path: '/reports', badge: 'reports' as const },
      { icon: Clock, labelKey: 'nav.timeline', path: '/timeline' },
    ],
  },
  {
    labelKey: 'nav.investigations',
    items: [
      { icon: FileSearch, labelKey: 'nav.orderInvestigation', path: '/order/select' },
      { icon: ClipboardList, labelKey: 'nav.orders', path: '/orders', badge: 'orders' as const },
    ],
  },
  {
    labelKey: 'nav.data',
    items: [
      { icon: Database, labelKey: 'nav.sources', path: '/sources' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const { count: reportsCount } = useReportsCount();
  const { orders } = useOrder();
  const activeOrdersCount = orders.filter((o) => o.status !== 'completed').length;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col z-50 transition-[width,background-color] duration-200 ease-in-out overflow-hidden ${
        collapsed ? 'w-[60px]' : 'w-[260px]'
      }`}
    >
      {/* Header + collapse toggle */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700 ${collapsed ? 'flex-col justify-center gap-1 py-2' : 'justify-between'}`}>
        <Link to="/check" className="flex items-center gap-2 min-w-0" onClick={handleNavClick}>
          <div className="w-8 h-8 rounded-lg bg-[#9E59EF] flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-wide text-slate-900 dark:text-white uppercase whitespace-nowrap">{t('brand.name')}</span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors p-1 rounded min-w-[24px] min-h-[24px]"
          aria-label={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section) => (
          <div key={section.labelKey} className="mb-2">
            {!collapsed && (
              <div className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-400 dark:text-slate-500">
                {t(section.labelKey)}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  title={collapsed ? t(item.labelKey) : undefined}
                  className={`relative flex items-center gap-3 mx-2 my-0.5 rounded-lg transition-all duration-150 text-sm font-medium min-h-[36px]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]
                    ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                    ${isActive
                      ? 'bg-purple-50 dark:bg-[rgba(147,28,245,0.08)] text-[#9E59EF] border-l-[3px] border-[#9E59EF]'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-l-[3px] border-transparent'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{t(item.labelKey)}</span>
                      {item.badge === 'reports' && reportsCount > 0 && (
                        <span className="ml-auto bg-[#9E59EF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {reportsCount}
                        </span>
                      )}
                      {item.badge === 'orders' && activeOrdersCount > 0 && (
                        <span className="ml-auto bg-[#00D4AA] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {activeOrdersCount}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section + Theme/Language toggles (bottom) */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <ThemeToggle className="!min-w-[32px] !min-h-[32px]" />
            <LanguageToggle />
            <div className="w-8 h-8 rounded-full bg-[#9E59EF] flex items-center justify-center text-white text-xs font-bold">
              K
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#9E59EF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                K
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">Khalid B.</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">{t('sidebar.freePlan')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
