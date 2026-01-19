/**
 * Results tabs component
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { SearchResponse } from '../../types/search';

interface ResultsTabsProps {
    results: SearchResponse['results_by_source'];
    onTabChange: (tab: 'sanctions' | 'intelligence_graph') => void;
}

export default function ResultsTabs({ results, onTabChange }: ResultsTabsProps) {
    // Calculate combined sanctions count (OpenSanctions + Sanctions.io)
    const sanctionsCount =
        results.opensanctions.count +
        results.sanctions_io.count;

    const intelligenceGraphCount = results.offshore_leaks.count;

    return (
        <div className="border-b mb-4">
            <Tabs defaultValue="sanctions" onValueChange={(val) => onTabChange(val as 'sanctions' | 'intelligence_graph')}>
                <TabsList className="h-auto p-0 bg-transparent border-0">
                    <TabsTrigger
                        value="sanctions"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                        <span className="flex items-center gap-2">
                            Sanctions
                            <Badge variant="secondary" className="ml-1">
                                {sanctionsCount}
                            </Badge>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="intelligence_graph"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                        <span className="flex items-center gap-2">
                            Intelligence Graph
                            <Badge variant="secondary" className="ml-1">
                                {intelligenceGraphCount}
                            </Badge>
                        </span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}
