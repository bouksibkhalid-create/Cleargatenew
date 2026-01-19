/**
 * Search type toggle component
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SearchType } from '../../types/search';

interface SearchTypeToggleProps {
    value: SearchType;
    onChange: (value: SearchType) => void;
}

export default function SearchTypeToggle({ value, onChange }: SearchTypeToggleProps) {
    return (
        <div>
            <label className="text-xs text-muted-foreground mb-2 block">
                Search Mode
            </label>
            <Tabs value={value} onValueChange={(val) => onChange(val as SearchType)}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="exact" title="Only perfect name matches">
                        Exact Match
                    </TabsTrigger>
                    <TabsTrigger value="fuzzy" title="Find similar names, typos, and variations">
                        Fuzzy Search
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}
