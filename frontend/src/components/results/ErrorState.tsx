/**
 * Error state component
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
    error: string;
    onRetry?: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-red-900 text-sm">Error</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
            </div>
            {onRetry && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="flex-shrink-0"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            )}
        </div>
    );
}
