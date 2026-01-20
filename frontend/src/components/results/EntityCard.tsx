/**
 * Modern Entity Card Component - Premium intelligence cards
 * Redesigned with clear visual hierarchy and modern styling
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Crown,
    Calendar,
    Globe,
    Briefcase,
    Network,
    ArrowRight,
    MapPin,
    Users,
    ChevronDown,
    CheckCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UnifiedEntity } from '@/types/entity';
import { calculateAge, formatDate } from '@/types/entity';

interface EntityCardProps {
    entity: UnifiedEntity;
    onClick: () => void;
}

export function EntityCard({ entity, onClick }: EntityCardProps) {
    const [showAliases, setShowAliases] = useState(false);

    return (
        <motion.div
            className="modern-entity-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
        >
            {/* Header Bar - Match Score + Badges */}
            <div className="card-header-modern">
                <div className="match-score-badge">
                    {entity.matchScore}% MATCH
                </div>

                <div className="header-badges-modern">
                    {entity.isSanctioned && (
                        <Badge variant="destructive" className="status-badge sanctioned-badge">
                            <AlertTriangle className="w-3 h-3" />
                            SANCTIONED
                        </Badge>
                    )}

                    {entity.isPEP && (
                        <Badge className="status-badge pep-badge">
                            <Crown className="w-3 h-3" />
                            PEP
                        </Badge>
                    )}

                    {entity.relationshipCount > 0 && (
                        <Badge className="status-badge connections-badge">
                            <Network className="w-3 h-3" />
                            {entity.relationshipCount.toLocaleString()}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Body - Entity Name & Description */}
            <div className="card-body-modern">
                <h3 className="entity-name-modern">{entity.name}</h3>

                {entity.description && (
                    <p className="entity-description-modern">{entity.description}</p>
                )}
            </div>

            {/* Info Grid - Key Facts */}
            <div className="info-grid-modern">
                {entity.birthDate && (
                    <div className="info-cell-modern">
                        <div className="info-icon-modern">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div className="info-content-modern">
                            <div className="info-label-modern">Born</div>
                            <div className="info-value-modern">
                                {formatDate(entity.birthDate)}
                                <span className="info-meta-modern">
                                    ({calculateAge(entity.birthDate)} yrs)
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {entity.nationalities && Array.isArray(entity.nationalities) && entity.nationalities.length > 0 && (
                    <div className="info-cell-modern">
                        <div className="info-icon-modern">
                            <Globe className="w-4 h-4" />
                        </div>
                        <div className="info-content-modern">
                            <div className="info-label-modern">Nationality</div>
                            <div className="info-value-modern">
                                {entity.nationalities.slice(0, 2).join(', ')}
                                {entity.nationalities.length > 2 && (
                                    <span className="info-meta-modern">
                                        +{entity.nationalities.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {entity.positions && entity.positions.length > 0 && (
                    <div className="info-cell-modern">
                        <div className="info-icon-modern">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="info-content-modern">
                            <div className="info-label-modern">Position</div>
                            <div className="info-value-modern">
                                {entity.positions[0]}
                                {entity.positions.length > 1 && (
                                    <span className="info-meta-modern">
                                        +{entity.positions.length - 1} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {entity.addresses && entity.addresses.length > 0 && (
                    <div className="info-cell-modern">
                        <div className="info-icon-modern">
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div className="info-content-modern">
                            <div className="info-label-modern">Address</div>
                            <div className="info-value-modern truncate">
                                {entity.addresses[0]}
                                {entity.addresses.length > 1 && (
                                    <span className="info-meta-modern">
                                        +{entity.addresses.length - 1}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Aliases Section - Collapsible */}
            {entity.aliases && entity.aliases.length > 0 && (
                <div className="aliases-section-modern">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowAliases(!showAliases);
                        }}
                        className="aliases-toggle-modern"
                    >
                        <Users className="w-4 h-4" />
                        <span>Also known as: {entity.aliases.length} aliases</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ml-auto ${showAliases ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    <AnimatePresence>
                        {showAliases && (
                            <motion.div
                                className="aliases-list-modern"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {entity.aliases.map((alias, idx) => (
                                    <span key={idx} className="alias-badge-modern">
                                        {alias}
                                    </span>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Status Bar - Sanctions Info */}
            <div className={`status-bar-modern ${entity.isSanctioned ? 'sanctioned' : 'clear'}`}>
                <div className="status-content-modern">
                    {entity.isSanctioned ? (
                        <>
                            <AlertTriangle className="w-4 h-4" />
                            <span>
                                <strong>Sanctioned</strong> • Found in {entity.sanctionListCount} {entity.sanctionListCount === 1 ? 'list' : 'lists'}
                            </span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            <span>No sanctions found</span>
                        </>
                    )}
                </div>

                <div className="source-badge-modern">
                    {entity.source}
                </div>
            </div>

            {/* Action Button */}
            <button className="view-intelligence-btn-modern">
                <span>View Full Intelligence Report</span>
                <ArrowRight className="w-5 h-5" />
            </button>
        </motion.div>
    );
}
