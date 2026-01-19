/**
 * Sanction badge component
 */

import { AlertTriangle } from 'lucide-react';

export default function SanctionBadge() {
    return (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
                <h4 className="font-semibold text-red-900 text-sm">SANCTIONED</h4>
                <p className="text-sm text-red-700 mt-1">
                    This entity appears on one or more sanctions lists.
                </p>
            </div>
        </div>
    );
}
