/**
 * Result card component for displaying entity information
 */

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, User, Building } from 'lucide-react';
import type { OpenSanctionsEntity } from '../../types/entity';
import SanctionBadge from './SanctionBadge';
import MatchScoreBadge from './MatchScoreBadge';
import { getCountryFlag, formatDate } from '../../utils/formatters';

interface ResultCardProps {
    entity: OpenSanctionsEntity;
}

export default function ResultCard({ entity }: ResultCardProps) {
    const getEntityIcon = () => {
        switch (entity.schema) {
            case 'Person':
                return <User className="h-5 w-5" />;
            case 'Company':
            case 'Organization':
                return <Building className="h-5 w-5" />;
            default:
                return <User className="h-5 w-5" />;
        }
    };

    return (
        <Card className="shadow-md">
            <CardContent className="pt-6">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="text-primary mt-1">
                        {getEntityIcon()}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                                OpenSanctions
                            </span>
                            <MatchScoreBadge score={entity.match_score} />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">
                            {entity.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {entity.schema}
                            {entity.birth_date && ` • Born: ${formatDate(entity.birth_date)}`}
                            {entity.nationalities.length > 0 && (
                                <span>
                                    {' • '}
                                    {entity.nationalities.map((nat) => getCountryFlag(nat)).join(' ')}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Sanction Status */}
                {entity.is_sanctioned && (
                    <div className="mb-4">
                        <SanctionBadge />
                    </div>
                )}

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

                {/* Sanction Programs */}
                {entity.sanction_programs.length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium mb-2">
                            📋 Sanction Programs:
                        </p>
                        <ul className="mt-2 pl-5 space-y-1">
                            {entity.sanction_programs.map((program, index) => (
                                <li key={index} className="text-sm">
                                    {program.program}
                                    {program.authority && ` (${program.authority})`}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Sanction Reason */}
                {entity.sanction_programs.length > 0 &&
                    entity.sanction_programs[0].reason && (
                        <>
                            <div className="border-t my-4" />
                            <div>
                                <p className="text-sm font-medium mb-2">
                                    📝 Reason:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {entity.sanction_programs[0].reason}
                                </p>
                            </div>
                        </>
                    )}

                {/* Datasets */}
                <div className="border-t my-4" />
                <p className="text-xs text-muted-foreground">
                    🔍 Datasets: {entity.datasets.join(', ')}
                </p>
            </CardContent>

            <CardFooter className="pt-0">
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                >
                    <a
                        href={entity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                    >
                        View on OpenSanctions
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    );
}
