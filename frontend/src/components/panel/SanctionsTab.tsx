/**
 * Sanctions Tab - Detailed list of sanctions
 */

import { ExternalLink, ShieldAlert, AlertCircle, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { UnifiedEntity } from '@/types/entity';
import { formatDate } from '@/types/entity';

interface SanctionsTabProps {
    entity: UnifiedEntity;
}

export default function SanctionsTab({ entity }: SanctionsTabProps) {
    if (!entity.sanctions || entity.sanctions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-lg border border-dashed">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Sanctions Found</h3>
                <p className="text-gray-500 max-w-sm mt-2">
                    This entity does not appear on any of the sanctions lists indexed by our system.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-lg text-red-900">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm">
                    <span className="font-semibold">Warning:</span> matches found on {entity.sanctions.length} sanctions lists.
                    Verify identity before proceeding.
                </p>
            </div>

            <div className="space-y-4">
                {entity.sanctions.map((sanction, index) => (
                    <Card key={index} className="overflow-hidden group hover:border-red-200 transition-colors">
                        <div className="border-l-4 border-l-red-500 pl-4 py-4 pr-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
                                            SANCTIONED
                                        </Badge>
                                        <span className="text-sm text-gray-500 font-medium">#{index + 1}</span>
                                    </div>

                                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                                        {sanction.program || sanction.listName}
                                    </h4>

                                    <p className="text-sm text-gray-600 mb-4 bg-gray-50 inline-block px-2 py-1 rounded">
                                        Authority: <span className="font-medium text-gray-900">{sanction.authority}</span>
                                    </p>

                                    {sanction.reason && (
                                        <div className="mt-4 text-sm">
                                            <p className="font-medium text-gray-700 mb-1">Reason:</p>
                                            <p className="text-gray-600 leading-relaxed bg-red-50/50 p-3 rounded-md border border-red-50/50">
                                                {sanction.reason}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-y-2 gap-x-6 mt-4 text-sm text-gray-500">
                                        {sanction.dateAdded && (
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="w-4 h-4" />
                                                <span>Listed: {formatDate(sanction.dateAdded)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Reference: {sanction.id}</span>
                                        </div>
                                    </div>
                                </div>

                                {sanction.sourceUrl && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0"
                                        onClick={() => window.open(sanction.sourceUrl, '_blank')}
                                    >
                                        Source
                                        <ExternalLink className="w-3 h-3 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
