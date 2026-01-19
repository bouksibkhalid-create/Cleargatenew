/**
 * Node Details Sidebar - Shows detailed information when a node is clicked
 * Neo4j-style sidebar for exploring entity details
 */

import { motion } from 'framer-motion';
import { X, ExternalLink, User, Building2, MapPin, Globe, Calendar, Network, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Node } from 'reactflow';
import ConnectionsTabContent from './ConnectionsTabContent';

interface NodeDetailsSidebarProps {
    node: Node | null;
    isOpen: boolean;
    onClose: () => void;
    onExpandNode?: (nodeId: string) => void;
    allNodes?: Node[];
    allEdges?: any[];
    onNodeFocus?: (nodeId: string) => void;
}

export default function NodeDetailsSidebar({
    node,
    isOpen,
    onClose,
    onExpandNode,
    allNodes = [],
    allEdges = [],
    onNodeFocus
}: NodeDetailsSidebarProps) {
    if (!isOpen || !node) return null;

    const data = node.data;
    const isCentral = data.isCentral;

    return (
        <motion.div
            className="node-details-sidebar"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
            {/* Header */}
            <div className="sidebar-header">
                <div className="header-content">
                    <div className="node-icon-large">
                        {getNodeIcon(data.type)}
                    </div>
                    <div>
                        <h3 className="node-name-large">{data.label}</h3>
                        <p className="node-type">{getNodeTypeLabel(data.type)}</p>
                    </div>
                </div>

                <button onClick={onClose} className="close-button">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Status Badges */}
            {(data.isSanctioned || data.isPEP || isCentral) && (
                <div className="sidebar-badges">
                    {isCentral && (
                        <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                            <Network className="w-3 h-3" />
                            Central Entity
                        </Badge>
                    )}
                    {data.isSanctioned && (
                        <Badge variant="destructive">
                            <span className="text-xs">⚠️</span>
                            SANCTIONED
                        </Badge>
                    )}
                    {data.isPEP && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            <span className="text-xs">👑</span>
                            PEP
                        </Badge>
                    )}
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="details" className="sidebar-tabs">
                <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                    <TabsTrigger value="connections" className="flex-1">Connections</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="details-content">
                    <DetailsTab node={node} />
                </TabsContent>

                <TabsContent value="connections" className="details-content">
                    <ConnectionsTabContent
                        node={node}
                        allNodes={allNodes}
                        allEdges={allEdges}
                        onNodeFocus={onNodeFocus}
                    />
                </TabsContent>
            </Tabs>

            {/* Actions */}
            {!isCentral && onExpandNode && (
                <div className="sidebar-actions">
                    <Button
                        onClick={() => onExpandNode(node.id)}
                        variant="outline"
                        className="w-full"
                    >
                        <Maximize2 className="w-4 h-4" />
                        Expand Connections
                    </Button>
                </div>
            )}
        </motion.div>
    );
}

function DetailsTab({ node }: { node: Node }) {
    const data = node.data;

    return (
        <div className="space-y-6">
            {/* Basic Information */}
            <Section title="Basic Information">
                <InfoRow label="Name" value={data.label} />
                <InfoRow label="Type" value={getNodeTypeLabel(data.type)} />
                <InfoRow label="Node ID" value={node.id} />
            </Section>

            {/* Additional Details */}
            {data.details && (
                <>
                    {data.details.jurisdiction && (
                        <Section title="Jurisdiction">
                            <InfoRow label="Location" value={data.details.jurisdiction} />
                        </Section>
                    )}

                    {data.details.countries && data.details.countries.length > 0 && (
                        <Section title="Countries">
                            <div className="flex flex-wrap gap-2">
                                {data.details.countries.map((country: string, idx: number) => (
                                    <Badge key={idx} variant="outline">
                                        <Globe className="w-3 h-3 mr-1" />
                                        {country}
                                    </Badge>
                                ))}
                            </div>
                        </Section>
                    )}

                    {data.details.addresses && data.details.addresses.length > 0 && (
                        <Section title="Addresses">
                            {data.details.addresses.map((address: string, idx: number) => (
                                <div key={idx} className="address-item">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>{address}</span>
                                </div>
                            ))}
                        </Section>
                    )}

                    {data.details.sourceUrl && (
                        <Section title="Source">
                            <a
                                href={data.details.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="source-link"
                            >
                                <span>View Source</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </Section>
                    )}
                </>
            )}

            {/* Placeholder for entities without details */}
            {!data.details && (
                <div className="empty-state">
                    <p className="text-sm text-gray-500">
                        This is a synthetic node for demonstration purposes.
                        In production, this would show real entity data from your database.
                    </p>
                </div>
            )}
        </div>
    );
}

function ConnectionsTab({ node }: { node: Node }) {
    // In a real implementation, this would fetch actual connections
    // For now, show a placeholder
    return (
        <div className="space-y-4">
            <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Connected Entities</p>
                <p className="text-gray-500">
                    This node has connections visible in the graph.
                    Double-click the node to expand additional connections.
                </p>
            </div>

            <div className="empty-state">
                <Network className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">
                    Connection details will be shown here in the full implementation.
                </p>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="detail-section">
            <h4 className="section-title">{title}</h4>
            <div className="section-content">
                {children}
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="info-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}

function getNodeIcon(type: string) {
    switch (type) {
        case 'person':
        case 'family':
            return <User className="w-5 h-5" />;
        case 'company':
        case 'associate':
            return <Building2 className="w-5 h-5" />;
        case 'location':
            return <MapPin className="w-5 h-5" />;
        default:
            return <Network className="w-5 h-5" />;
    }
}

function getNodeTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        person: 'Person',
        company: 'Company',
        family: 'Family Member',
        associate: 'Business Associate',
        location: 'Location',
        transaction: 'Financial Link',
    };
    return labels[type] || 'Entity';
}
