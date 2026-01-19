/**
 * Simplified search section - single input, no options
 */

import { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchSectionProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

export default function SearchSection({ onSearch, isLoading }: SearchSectionProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const handleClear = () => {
        setQuery('');
    };

    return (
        <form onSubmit={handleSubmit} className="simple-search-form">
            <div className="search-input-wrapper relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter a name, organization, or vessel..."
                    className="w-full pl-12 pr-12 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    autoFocus
                    disabled={isLoading}
                />
                {query && !isLoading && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="mt-4 w-full sm:w-auto px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Searching...
                    </>
                ) : (
                    <>
                        <Search className="w-5 h-5" />
                        Search
                    </>
                )}
            </button>
        </form>
    );
}
