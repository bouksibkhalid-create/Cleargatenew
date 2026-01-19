/**
 * Intelligence Panel - The core Deep Dive interface
 * Slides in from the right to show comprehensive entity details
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ShieldAlert,
    LayoutDashboard,
    Network,
    Search,
    History,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UnifiedEntity } from '@/types/entity';

import OverviewTab from './OverviewTab';
import SanctionsTab from './SanctionsTab';
import RelationshipsTab from './RelationshipsTab';
import OsintTab from './OsintTab';

interface IntelligencePanelProps {
    isOpen: boolean;
    onClose: () => void;
    entity: UnifiedEntity | null;
}

type TabType = 'overview' | 'sanctions' | 'relationships' | 'osint' | 'timeline';

export default function IntelligencePanel({ isOpen, onClose, entity }: IntelligencePanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Reset tab when entity changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab('overview');
        }
    }, [isOpen, entity?.id]);

    // Lock body scroll when panel is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!entity) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white shadow-2xl flex flex-col"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        {/* Header */}
                        <div className="border-b px-6 py-4 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2",
                                    entity.riskScore > 75 ? "bg-red-50 border-red-200 text-red-700" :
                                        entity.riskScore > 30 ? "bg-amber-50 border-amber-200 text-amber-700" :
                                            "bg-teal-50 border-teal-200 text-teal-700"
                                )}>
                                    {entity.riskScore}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{entity.name}</h2>
                                    <div className="flex items-center text-sm text-gray-500 gap-2">
                                        <span className="capitalize">{entity.type}</span>
                                        <span>•</span>
                                        <span>ID: {entity.id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {entity.isSanctioned && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                        <AlertTriangle className="w-4 h-4" />
                                        SANCTIONED
                                    </div>
                                )}
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="border-b px-6 flex gap-6 overflow-x-auto shrink-0 hide-scrollbar bg-gray-50/50">
                            <TabButton
                                active={activeTab === 'overview'}
                                onClick={() => setActiveTab('overview')}
                                icon={LayoutDashboard}
                                label="Overview"
                            />
                            <TabButton
                                active={activeTab === 'sanctions'}
                                onClick={() => setActiveTab('sanctions')}
                                icon={ShieldAlert}
                                label="Sanctions"
                                count={entity.sanctionListCount}
                                hasData={entity.sanctionListCount > 0}
                            />
                            <TabButton
                                active={activeTab === 'relationships'}
                                onClick={() => setActiveTab('relationships')}
                                icon={Network}
                                label="Relationships"
                                count={entity.relationshipCount}
                                hasData={entity.relationshipCount > 0}
                            />
                            <TabButton
                                active={activeTab === 'osint'}
                                onClick={() => setActiveTab('osint')}
                                icon={Search}
                                label="OSINT & Web"
                            />
                            <TabButton
                                active={activeTab === 'timeline'}
                                onClick={() => setActiveTab('timeline')}
                                icon={History}
                                label="Timeline"
                            />
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 bg-gray-50/30 overflow-y-auto p-6">
                            <div className="max-w-4xl mx-auto pb-20">
                                {activeTab === 'overview' && <OverviewTab entity={entity} onChangeTab={setActiveTab} />}
                                {activeTab === 'sanctions' && <SanctionsTab entity={entity} />}
                                {activeTab === 'relationships' && <RelationshipsTab entity={entity} />}
                                {activeTab === 'osint' && <OsintTab entity={entity} />}

                                {/* Placeholders for future phases */}

                                {activeTab === 'timeline' && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                                            <History className="w-8 h-8 text-orange-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">Event Timeline</h3>
                                        <p className="text-gray-500 max-w-md">
                                            Chronological view of sanctions, positions, and entity events coming in Phase 5.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function TabButton({
    active,
    onClick,
    icon: Icon,
    label,
    count,
    hasData
}: {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
    count?: number;
    hasData?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors relative",
                active
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
            )}
        >
            <Icon className={cn("w-4 h-4", active ? "text-teal-600" : "text-gray-400")} />
            {label}
            {count !== undefined && count > 0 && (
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs",
                    active ? "bg-teal-100 text-teal-700" : "bg-gray-200 text-gray-600"
                )}>
                    {count}
                </span>
            )}
            {hasData && !active && (
                <span className="absolute top-2 right-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
        </button>
    );
}
