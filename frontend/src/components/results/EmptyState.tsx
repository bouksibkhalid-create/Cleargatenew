/**
 * Empty state component when no results are found
 */

import { CheckCircle } from 'lucide-react';

interface EmptyStateProps {
    query: string;
}

export default function EmptyState({ query }: EmptyStateProps) {
    return (
        <div className="bg-green-50 border border-green-200 rounded-lg shadow-sm p-8 text-center">
            <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
                No Results Found
            </h3>
            <p className="text-base text-muted-foreground mb-4">
                No records found for "{query}" in OpenSanctions database.
            </p>
            <p className="text-sm text-muted-foreground">
                ℹ️ This doesn't guarantee the entity is risk-free. Always perform
                comprehensive due diligence.
            </p>
        </div>
    );
}
