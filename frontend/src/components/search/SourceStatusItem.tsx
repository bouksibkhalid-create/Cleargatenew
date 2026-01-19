import { CheckCircle, Loader2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SourceStatus } from '@/types/osint';

interface SourceStatusItemProps {
    source: SourceStatus;
}

export function SourceStatusItem({ source }: SourceStatusItemProps) {
    const getStatusIcon = () => {
        switch (source.status) {
            case 'complete':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'scanning':
                return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
            case 'queued':
                return <Clock className="w-5 h-5 text-gray-400" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-600" />;
        }
    };

    const getStatusBadge = () => {
        switch (source.status) {
            case 'complete':
                return (
                    <div className="flex items-center gap-3">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            COMPLETE
                        </Badge>
                        <span className="text-sm font-semibold text-green-600">
                            {source.matchCount} matches
                        </span>
                    </div>
                );
            case 'scanning':
                return (
                    <div className="flex items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            SCANNING
                        </Badge>
                        <div className="flex gap-1">
                            <span className="animate-pulse">•</span>
                            <span className="animate-pulse delay-100">•</span>
                            <span className="animate-pulse delay-200">•</span>
                        </div>
                    </div>
                );
            case 'queued':
                return (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        QUEUED
                    </Badge>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-3">
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            ERROR
                        </Badge>
                        {source.error && (
                            <span className="text-sm text-red-600">{source.error}</span>
                        )}
                    </div>
                );
        }
    };

    return (
        <div
            className={`
        flex justify-between items-center p-4 bg-white rounded-lg
        border-l-4 transition-all duration-300
        ${source.status === 'scanning' ? 'border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-white' : ''}
        ${source.status === 'complete' ? 'border-l-green-500' : ''}
        ${source.status === 'error' ? 'border-l-red-500 bg-red-50/30' : ''}
        ${source.status === 'queued' ? 'border-l-transparent' : ''}
      `}
        >
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                    {getStatusIcon()}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xl">{source.icon}</span>
                    <span className="font-semibold text-gray-900">{source.name}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {getStatusBadge()}
            </div>
        </div>
    );
}
