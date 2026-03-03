/**
 * Main application component (Phase 2: Custom Styling + OSINT Loader + Simplified Search)
 */

import { Shield } from 'lucide-react';
import SearchSection from './components/search/SearchSection';
import ResultsList from './components/results/ResultsList';
import ErrorState from './components/results/ErrorState';
import { ToastProvider } from './components/common/ToastProvider';
import { StatsCards } from './components/home/StatsCards';
import { UpdateStatus } from './components/home/UpdateStatus';
import { DataSources } from './components/home/DataSources';
import { OSINTLoader } from './components/search/OSINTLoader';
import { useSearch } from './hooks/useSearch';
import { useState, useEffect } from 'react';
import LockScreen from './components/auth/LockScreen';
import LandingPage from './components/landing/LandingPage';
import EntityProfilePage from './components/profile/EntityProfilePage';

function App() {
  const { data, isLoading, error, search, reset } = useSearch();
  const [currentQuery, setCurrentQuery] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'results' | 'profile'>('home');
  const [profileTarget, setProfileTarget] = useState<{
    name: string;
    entityType: string;
    country?: string;
  } | null>(null);

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

  // Show landing page first
  if (showLanding && !isUnlocked) {
    return <LandingPage onAccessDemo={handleAccessDemo} />;
  }

  // Show lock screen if not unlocked
  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  const handleSearch = (query: string) => {
    setCurrentQuery(query);
    setCurrentView('results');
    // Auto-enable fuzzy matching and all sources
    search(query);
  };

  const handleViewProfile = (entity: { name: string; entityType: string; country?: string }) => {
    setProfileTarget(entity);
    setCurrentView('profile');
  };

  const handleBackFromProfile = () => {
    setCurrentView('results');
  };

  // Profile view — full-page, no header/footer chrome
  if (currentView === 'profile' && profileTarget) {
    return (
      <ToastProvider>
        <EntityProfilePage
          entityName={profileTarget.name}
          entityType={profileTarget.entityType}
          country={profileTarget.country}
          onBack={handleBackFromProfile}
        />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-[#0F1419]">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0F1419]/95 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-16">
              <button
                onClick={() => { reset(); setCurrentView('home'); }}
                className="flex items-center hover:opacity-70 transition-opacity cursor-pointer"
                aria-label="Return to home"
              >
                <Shield className="mr-3 h-6 w-6 text-[#00D4AA]" />
                <h1 className="text-xl font-semibold text-white tracking-wide uppercase">ClearGate</h1>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          {!data && !error && (
            <>
              <section className="bg-gradient-to-b from-[#0F1419] to-[#1A1F2E] py-16">
                <div className="container mx-auto px-4 text-center">
                  <p className="eyebrow mb-4">International Sanctions Database</p>

                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                    Search for any person, entity, or vessel
                  </h2>

                  <p className="text-base text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    One search across all major sanctions lists, intelligence, and public records.
                  </p>

                  <div className="max-w-2xl mx-auto">
                    <SearchSection onSearch={handleSearch} isLoading={isLoading} />
                  </div>

                  
                </div>
              </section>

              {/* Stats Cards */}
              <StatsCards />

              {/* Update Status */}
              <UpdateStatus />

              {/* Data Sources */}
              <DataSources />
            </>
          )}

          {/* Search Section (After First Search) */}
          {(data || error || isLoading) && (
            <div className="container mx-auto px-4 py-8">
              <div className="bg-[#1A1F2E] border border-white/10 rounded-xl shadow-sm p-6 mb-6">
                <div className="max-w-2xl mx-auto">
                  <SearchSection onSearch={handleSearch} isLoading={isLoading} />
                </div>
              </div>
            </div>
          )}

          {/* OSINT Loader */}
          {isLoading && currentQuery && (
            <div className="container mx-auto px-4 pb-8">
              <OSINTLoader
                query={currentQuery}
                searchType="fuzzy"
              />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="container mx-auto px-4">
              <ErrorState error={error} onRetry={reset} />
            </div>
          )}

          {/* Results */}
          {data && !error && !isLoading && (
            <div className="container mx-auto px-4 pb-8">
              <ResultsList data={data} onViewProfile={handleViewProfile} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-[#0F1419] py-6 px-4 mt-auto">
          <div className="container mx-auto">
            <p className="text-sm text-gray-500 text-center">
              Powered by OpenSanctions & Sanctions.io • Data updated in real-time
            </p>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;
