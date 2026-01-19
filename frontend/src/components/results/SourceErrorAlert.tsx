/**
 * Source error alert component
 */

import { AlertTriangle } from 'lucide-react';

interface SourceErrorAlertProps {
    sources: string[];
    errors: Record<string, string>;
}

export default function SourceErrorAlert({ sources, errors }: SourceErrorAlertProps) {
    if (sources.length === 0) {
        return null;
    }

    return (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
                <h4 className="font-semibold text-amber-900 text-sm">Some Sources Failed</h4>
                <div className="mt-2 space-y-1">
                    {sources.map((source) => (
                        <div key={source} className="text-sm text-amber-700">
                            <strong>{source}:</strong> {errors[source] || 'Unknown error'}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
