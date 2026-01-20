/**
 * Search bar component
 */

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (query.trim().length >= 2) {
            onSearch(query.trim());
        }
    };

    const handleClear = () => {
        setQuery('');
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter name or entity (e.g., Vladimir Putin, Mossack Fonseca)"
                    disabled={isLoading}
                    autoFocus
                    id="search-input"
                    name="query"
                    className="pl-10 pr-10 h-14 text-lg"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {query && !isLoading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-accent rounded-sm"
                            aria-label="clear search"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    {isLoading && (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                </div>
            </div>

            <Button
                type="submit"
                size="lg"
                disabled={isLoading || query.length < 2}
                className="mt-4 w-full sm:w-auto min-w-[120px]"
            >
                {isLoading ? 'Searching...' : 'Search'}
            </Button>
        </form>
    );
}
