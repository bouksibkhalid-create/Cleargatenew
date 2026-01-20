/**
 * Main application component (Phase 2: Custom Styling + OSINT Loader + Simplified Search)
 */

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

function App() {
  const { data, isLoading, error, search, reset } = useSearch();
  const [currentQuery, setCurrentQuery] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Check session storage on mount
  useEffect(() => {
    const unlocked = sessionStorage.getItem('cleargate_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('cleargate_unlocked', 'true');
  };

  // Show lock screen if not unlocked
  if (!isUnlocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  const handleSearch = (query: string) => {
    setCurrentQuery(query);
    // Auto-enable fuzzy matching and all sources
    search(query);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-16">
              <button
                onClick={reset}
                className="flex items-center hover:opacity-70 transition-opacity cursor-pointer"
                aria-label="Return to home"
              >
                <Search className="mr-3 h-6 w-6 text-teal-600" />
                <h1 className="text-xl font-semibold text-gray-900">ClearGate</h1>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          {!data && !error && (
            <>
              <section className="bg-gradient-to-b from-white to-gray-50 py-16">
                <div className="container mx-auto px-4 text-center">
                  <p className="eyebrow mb-4">International Sanctions Database</p>

                  <h2 className="hero-title mb-6">
                    Search for any person, entity, or vessel
                  </h2>

                  <p className="text-base text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                    One search across all major sanctions lists, intelligence, and public records.
                  </p>

                  <div className="max-w-2xl mx-auto">
                    <SearchSection onSearch={handleSearch} isLoading={isLoading} />
                  </div>

                  {/* Examples */}
                  <div className="mt-12">
                    <p className="text-sm text-gray-500 mb-4">
                      Try searching for:
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      {['Vladimir Putin', 'Oleg Deripaska', 'Mossack Fonseca'].map((example) => (
                        <Button
                          key={example}
                          variant="outline"
                          size="sm"
                          onClick={() => search(example, 'fuzzy')}
                          disabled={isLoading}
                        >
                          {example}
                        </Button>
                      ))}
                    </div>
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
              <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
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
              <ResultsList data={data} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t bg-white py-6 px-4 mt-auto">
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
