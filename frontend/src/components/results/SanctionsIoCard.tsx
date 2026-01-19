/**
 * Result card for Sanctions.io entities
 */

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, User, Building } from 'lucide-react';
import type { SanctionsIoEntity } from '../../types/entity';
import SanctionBadge from './SanctionBadge';
import MatchScoreBadge from './MatchScoreBadge';

interface SanctionsIoCardProps {
    entity: SanctionsIoEntity;
}

export default function SanctionsIoCard({ entity }: SanctionsIoCardProps) {
    const getEntityIcon = () => {
        return entity.entity_type === 'Individual' ? <User className="h-5 w-5" /> : <Building className="h-5 w-5" />;
    };

    return (
        <Card className="shadow-md">
            <CardContent className="pt-6">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="text-secondary mt-1">
                        {getEntityIcon()}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                                Sanctions.io
                            </span>
                            <MatchScoreBadge score={entity.match_score} />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">
                            {entity.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {entity.entity_type} • {entity.list_type}
                            {entity.nationalities.length > 0 && (
                                <span>
                                    {' • '}
                                    {entity.nationalities.slice(0, 2).join(', ')}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Sanction Status */}
                <div className="mb-4">
                    <SanctionBadge />
                </div>

                {/* Aliases */}
                {entity.aliases.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium mb-2">
                            Also known as:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {entity.aliases.slice(0, 3).map((alias, index) => (
                                <Badge key={index} variant="outline">
                                    {alias}
                                </Badge>
                            ))}
                            {entity.aliases.length > 3 && (
                                <Badge variant="outline">
                                    +{entity.aliases.length - 3} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Programs */}
                {entity.programs.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium mb-2">
                            📋 Sanction Programs:
                        </p>
                        <ul className="mt-2 pl-5 space-y-1">
                            {entity.programs.map((program, index) => (
                                <li key={index} className="text-sm">
                                    {program}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Birth Dates */}
                {entity.birth_dates.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            <strong>Date of Birth:</strong> {entity.birth_dates.join(', ')}
                        </p>
                    </div>
                )}

                {/* Addresses */}
                {entity.addresses.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium mb-2">
                            📍 Addresses:
                        </p>
                        {entity.addresses.slice(0, 2).map((addr, index) => (
                            <p key={index} className="text-sm text-muted-foreground">
                                • {addr.full || JSON.stringify(addr)}
                            </p>
                        ))}
                    </div>
                )}

                {/* Remarks */}
                {entity.remarks && (
                    <>
                        <div className="border-t my-4" />
                        <div>
                            <p className="text-sm font-medium mb-2">
                                📝 Remarks:
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {entity.remarks}
                            </p>
                        </div>
                    </>
                )}
            </CardContent>

            <CardFooter className="pt-0">
                {entity.sources.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                    >
                        <a
                            href={entity.sources[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                        >
                            View Source
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
