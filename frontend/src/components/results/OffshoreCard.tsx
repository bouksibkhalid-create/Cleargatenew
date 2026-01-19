import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Building,
    User,
    MapPin,
    Landmark,
    Network,
    Flag,
    Calendar,
    Briefcase,
    Info
} from 'lucide-react';
import type { OffshoreEntity } from '../../types/entity';
import MatchScoreBadge from './MatchScoreBadge';
import { getNodeIcon, getNodeColor } from '../../utils/graphUtils';

interface OffshoreCardProps {
    entity: OffshoreEntity;
    onViewGraph: (nodeId: number) => void;
}

export default function OffshoreCard({ entity, onViewGraph }: OffshoreCardProps) {
    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'Officer': return <User className="h-5 w-5" />;
            case 'Entity': return <Building className="h-5 w-5" />;
            case 'Intermediary': return <Landmark className="h-5 w-5" />;
            case 'Address': return <MapPin className="h-5 w-5" />;
            default: return <span>🌐</span>;
        }
    };

    return (
        <Card className="mb-4 relative">
            <CardContent className="pt-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{
                                backgroundColor: `${getNodeColor(entity.node_type)}20`,
                                color: getNodeColor(entity.node_type),
                            }}
                        >
                            {getEntityIcon(entity.node_type)}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold leading-tight mb-1">
                                {entity.name}
                            </h3>
                            <div className="flex gap-2 items-center">
                                <Badge
                                    className="h-5 text-xs font-semibold"
                                    style={{
                                        backgroundColor: `${getNodeColor(entity.node_type)}15`,
                                        color: getNodeColor(entity.node_type),
                                    }}
                                >
                                    {entity.node_type}
                                </Badge>
                                <Badge variant="outline" className="h-5 text-xs">
                                    Intelligence
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <MatchScoreBadge score={entity.match_score} />
                </div>

                <div className="border-t my-3" />

                {/* Details Layout */}
                <div className="flex flex-wrap gap-4">
                    {entity.jurisdiction_description && (
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Flag className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Jurisdiction</span>
                            </div>
                            <p className="text-sm">{entity.jurisdiction_description}</p>
                        </div>
                    )}

                    {entity.countries.length > 0 && (
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Linked Countries</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {entity.countries.map((country, idx) => (
                                    <Badge key={idx} variant="outline" className="h-5 text-xs">
                                        {country}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {entity.incorporation_date && (
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Incorporation Date</span>
                            </div>
                            <p className="text-sm">{entity.incorporation_date}</p>
                        </div>
                    )}

                    {entity.company_type && (
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Company Type</span>
                            </div>
                            <p className="text-sm">{entity.company_type}</p>
                        </div>
                    )}

                    {entity.service_provider && (
                        <div className="flex-1 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Service Provider</span>
                            </div>
                            <p className="text-sm">{entity.service_provider}</p>
                        </div>
                    )}

                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 mb-1">
                            <Network className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Source Dataset</span>
                        </div>
                        <p className="text-sm">{entity.source_dataset}</p>
                    </div>
                </div>

                {/* Connections Preview */}
                {entity.connections && entity.connections.length > 0 && (
                    <div className="mt-4 bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Network className="h-4 w-4" />
                            Connections ({entity.connections_count})
                        </p>
                        <div className="space-y-2">
                            {entity.connections.slice(0, 3).map((conn, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="text-xs text-muted-foreground min-w-[80px]">
                                        {conn.relationship}
                                    </span>
                                    <span>→</span>
                                    <span className="flex items-center gap-1">
                                        <span>{getNodeIcon(conn.entity_type)}</span>
                                        <span>{conn.entity_name}</span>
                                    </span>
                                </div>
                            ))}
                            {entity.connections_count > 3 && (
                                <p className="text-xs text-muted-foreground italic">
                                    And {entity.connections_count - 3} more...
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Action Footer */}
            <div className="px-6 pb-4 pt-0 flex justify-end gap-2">
                <Button
                    size="sm"
                    onClick={() => onViewGraph(entity.node_id)}
                >
                    <Network className="h-4 w-4 mr-2" />
                    Explore Graph
                </Button>
            </div>
        </Card>
    );
}
