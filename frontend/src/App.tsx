/**
 * ClearGate SaaS Application Shell
 * After lock screen auth, user enters a persistent workspace with sidebar navigation.
 * Landing page is purely marketing, lives before login.
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/ToastProvider';
import LockScreen from './components/auth/LockScreen';
import LandingPage from './components/landing/LandingPage';
import AppShell from './components/shell/AppShell';
import DashboardPage from './components/dashboard/DashboardPage';
import NewCheckPage from './components/check/NewCheckPage';
import EntityProfileView from './components/check/EntityProfileView';
import ReportsPage from './components/reports/ReportsPage';
import TimelinePage from './components/timeline/TimelinePage';
import SourcesPage from './components/sources/SourcesPage';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Check session storage on mount
  useEffect(() => {
    const unlocked = sessionStorage.getItem('cleargate_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
      setShowLanding(false);
    }
  }, []);

  const handleAccessDemo = () => {
    setShowLanding(false);
  };

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('cleargate_unlocked', 'true');
  };

  // Show landing page first (marketing, pre-login)
  if (showLanding && !isUnlocked) {
    return <LandingPage onAccessDemo={handleAccessDemo} />;
  }

  // Show lock screen if not unlocked
  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  // Authenticated app shell with sidebar navigation
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/check" element={<NewCheckPage />} />
            <Route path="/check/:entityId" element={<EntityProfileView source="check" />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:entityId" element={<EntityProfileView source="reports" />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
