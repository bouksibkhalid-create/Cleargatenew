import { CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { UpdateSource } from '../../data/updateStatusData';

export function StatusItem({
    flag,
    name,
    frequency,
    status,
    modificationsCount,
    verifiedAgo,
    nextCheck,
}: UpdateSource) {
    return (
        <div className="flex justify-between items-center py-4 border-b border-gray-200 last:border-b-0">
            <div className="flex items-center gap-4">
                <span className="text-2xl">{flag}</span>
                <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-gray-900">{name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <span>⏱</span>
                        {frequency}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 text-right">
                {status === 'modified' ? (
                    <>
                        <CheckCircle className="text-teal-600 w-5 h-5 flex-shrink-0" />
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-teal-600">
                                {modificationsCount} modifications
                            </span>
                            <p className="text-xs text-gray-500">Verified {verifiedAgo}</p>
                            <p className="text-xs text-gray-400">Next check: {nextCheck}</p>
                        </div>
                    </>
                ) : (
                    <>
                        <CheckCircle className="text-gray-400 w-5 h-5 flex-shrink-0" />
                        <div className="flex flex-col gap-1">
                            <Badge variant="secondary" className="text-xs">
                                Up to date
                            </Badge>
                            <p className="text-xs text-gray-500">Verified {verifiedAgo}</p>
                            <p className="text-xs text-gray-400">Next check: {nextCheck}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
