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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#931CF5]" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter a name, organization, or vessel..."
                    className="w-full pl-12 pr-12 py-3 text-base border border-slate-200 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#931CF5]/50 focus:border-transparent transition-all"
                    autoFocus
                    disabled={isLoading}
                />
                {query && !isLoading && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors min-w-[24px] min-h-[24px]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="mt-4 w-full sm:w-auto px-8 py-3 bg-[#931CF5] text-white font-semibold rounded-full hover:bg-[#7B16D0] disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563eb]"
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
