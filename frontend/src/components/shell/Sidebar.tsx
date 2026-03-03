import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Search, FileText, Clock, Database,
  ChevronLeft, ChevronRight, Shield,
} from 'lucide-react';
import { useReportsCount } from '../../hooks/useReportsCount';
import ThemeToggle from '../ui/ThemeToggle';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

const NAV_SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Search, label: 'New Check', path: '/check' },
      { icon: FileText, label: 'Reports', path: '/reports', badge: true },
      { icon: Clock, label: 'Timeline', path: '/timeline' },
    ],
  },
  {
    label: 'DATA',
    items: [
      { icon: Database, label: 'Sources', path: '/sources' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const location = useLocation();
  const { count: reportsCount } = useReportsCount();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col z-50 transition-[width,background-color] duration-200 ease-in-out overflow-hidden ${
        collapsed ? 'w-[60px]' : 'w-[260px]'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0" onClick={handleNavClick}>
          <div className="w-8 h-8 rounded-lg bg-[#931CF5] flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-wide text-slate-900 dark:text-white uppercase whitespace-nowrap">ClearGate</span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className={`text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors p-1 rounded min-w-[24px] min-h-[24px] ${collapsed ? 'hidden' : ''}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-2">
            {!collapsed && (
              <div className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-slate-400 dark:text-slate-500">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  title={collapsed ? item.label : undefined}
                  className={`relative flex items-center gap-3 mx-2 my-0.5 rounded-lg transition-all duration-150 text-sm font-medium min-h-[36px]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]
                    ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                    ${isActive
                      ? 'bg-purple-50 dark:bg-[rgba(147,28,245,0.08)] text-[#931CF5] border-l-[3px] border-[#931CF5]'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-l-[3px] border-transparent'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {item.badge && reportsCount > 0 && (
                        <span className="ml-auto bg-[#931CF5] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {reportsCount}
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

      {/* User section + Theme toggle (bottom) */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#931CF5] flex items-center justify-center text-white text-xs font-bold">
              K
            </div>
            <ThemeToggle className="!min-w-[32px] !min-h-[32px]" />
            <button
              onClick={onToggle}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors p-1 min-w-[24px] min-h-[24px]"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#931CF5] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              K
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900 dark:text-white truncate">Khalid B.</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Free Plan</div>
            </div>
            <ThemeToggle />
          </div>
        )}
      </div>
    </aside>
  );
}
