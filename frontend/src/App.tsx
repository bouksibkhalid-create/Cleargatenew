/**
 * ClearGate SaaS Application Shell
 * Landing page is purely marketing; clicking "Access Demo" goes straight to dashboard.
 * Searching a name from the landing page navigates to /check with auto-search.
 */

import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './components/common/ToastProvider';
import LandingPage from './components/landing/LandingPage';
import AppShell from './components/shell/AppShell';
import DashboardPage from './components/dashboard/DashboardPage';
import NewCheckPage from './components/check/NewCheckPage';
import EntityProfileView from './components/check/EntityProfileView';
import ReportsPage from './components/reports/ReportsPage';
import TimelinePage from './components/timeline/TimelinePage';
import SourcesPage from './components/sources/SourcesPage';

/**
 * Inner component that lives inside BrowserRouter so it can use useNavigate.
 */
function AppRoutes({ showLanding, onDismissLanding }: { showLanding: boolean; onDismissLanding: () => void }) {
  const navigate = useNavigate();

  const handleAccessDemo = useCallback(() => {
    onDismissLanding();
    navigate('/check', { replace: true });
  }, [navigate, onDismissLanding]);

  const handleSearch = useCallback((name: string) => {
    onDismissLanding();
    navigate(`/check?q=${encodeURIComponent(name)}`, { replace: true });
  }, [navigate, onDismissLanding]);

  if (showLanding) {
    return <LandingPage onAccessDemo={handleAccessDemo} onSearch={handleSearch} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/check" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/check" element={<NewCheckPage />} />
        <Route path="/check/:entityId" element={<EntityProfileView source="check" />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:entityId" element={<EntityProfileView source="reports" />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="*" element={<Navigate to="/check" replace />} />
      </Routes>
    </AppShell>
  );
}

function App() {
  const [showLanding, setShowLanding] = useState(true);

  // If the user already dismissed the landing page in this session, skip it
  useEffect(() => {
    if (sessionStorage.getItem('cleargate_unlocked') === 'true') {
      setShowLanding(false);
    }
  }, []);

  const handleDismissLanding = useCallback(() => {
    setShowLanding(false);
    sessionStorage.setItem('cleargate_unlocked', 'true');
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes showLanding={showLanding} onDismissLanding={handleDismissLanding} />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
