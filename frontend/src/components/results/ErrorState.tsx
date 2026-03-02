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
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-500/25 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-red-400 text-sm">Error</h4>
                    <p className="text-sm text-red-400/80 mt-1">{error}</p>
                </div>
            </div>
            {onRetry && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="flex-shrink-0 bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            )}
        </div>
    );
}
