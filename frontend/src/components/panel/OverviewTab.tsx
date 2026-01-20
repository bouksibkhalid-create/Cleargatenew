/**
 * Enhanced Overview Tab - Comprehensive Entity Intelligence
 * 
 * Displays 40+ entity fields including sanctions reasoning, identifications,
 * professional info, and risk assessment.
 */

import {
    AlertTriangle,
    ShieldCheck,
    MapPin,
    Globe,
    Briefcase,
    Calendar,
    Building2,
    ExternalLink,
    ChevronRight,
    FileText,
    CreditCard,
    User,
    Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UnifiedEntity } from '@/types/entity';

interface OverviewTabProps {
    entity: UnifiedEntity;
    onChangeTab: (tab: any) => void;
}

export default function OverviewTab({ entity, onChangeTab }: OverviewTabProps) {
    const enhanced = entity.enhanced;

    return (
        <div className="space-y-6">

            {/* CRITICAL: Sanctions Reasoning Card */}
            {enhanced?.sanctions_reason && (
                <Card className="overflow-hidden border-l-4 border-l-red-500 bg-red-50/30">
                    <CardHeader className="bg-red-50/50 pb-4">
                        <CardTitle className="text-base font-semibold text-red-900 flex items-center gap-2">
                            <Scale className="w-5 h-5 text-red-600" />
                            Sanctions Reasoning
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="prose prose-sm max-w-none">
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {enhanced.sanctions_reason}
                            </p>
                        </div>

                        {/* Sanctions Measures */}
                        {enhanced.measures && enhanced.measures.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-red-100">
                                <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                                    Sanctions Measures
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {enhanced.measures.map((measure, idx) => (
                                        <Badge key={idx} variant="destructive" className="text-xs">
                                            {measure}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Legal Basis */}
                        {enhanced.legal_basis && (
                            <div className="mt-3 text-xs text-gray-600">
                                <span className="font-medium">Legal Basis:</span> {enhanced.legal_basis}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Risk Assessment Card */}
            <Card className="overflow-hidden border-l-4 border-l-teal-500">
                <CardHeader className="bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-teal-600" />
                        Risk Assessment
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
                    {/* Risk Score Gauge */}
                    <div className="flex flex-col items-center justify-center p-4">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-gray-100"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={351.86}
                                    strokeDashoffset={351.86 - (351.86 * (entity.riskScore || 0)) / 100}
                                    className={(entity.riskScore || 0) > 75 ? "text-red-500" : (entity.riskScore || 0) > 30 ? "text-amber-500" : "text-teal-500"}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-gray-900">{entity.riskScore || 0}</span>
                                <span className="text-xs text-gray-500 uppercase font-medium">Risk Score</span>
                            </div>
                        </div>
                        {enhanced?.risk_level && (
                            <Badge
                                variant={enhanced.risk_level === 'Critical' ? 'destructive' : 'secondary'}
                                className="mt-3"
                            >
                                {enhanced.risk_level} Risk
                            </Badge>
                        )}
                    </div>

                    {/* Risk Factors */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Detected Risk Factors</h4>

                        {entity.isSanctioned && (
                            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-red-900">Currently Sanctioned</p>
                                    <p className="text-xs text-red-700 mt-0.5">
                                        Found on {entity.sanctionListCount} active sanctions lists.
                                    </p>
                                    {enhanced?.programmes && enhanced.programmes.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {enhanced.programmes.map((prog, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {prog}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {entity.isPEP && (
                            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <Briefcase className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-900">Politically Exposed Person</p>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        Holds or held prominent public positions.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Additional Risk Factors */}
                        {enhanced?.risk_factors && enhanced.risk_factors.length > 0 && (
                            <div className="mt-2">
                                {enhanced.risk_factors.map((factor, idx) => (
                                    <div key={idx} className="text-xs text-gray-600 flex items-center gap-2 py-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        {factor}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Identity & Personal Information */}
            <Card>
                <CardHeader className="bg-gray-50/50 pb-4">
                    <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-600" />
                        Identity & Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
                    {/* Biographical Data */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Biographical Data</h4>

                        {enhanced?.full_name && (
                            <div>
                                <span className="text-xs text-gray-500">Full Name</span>
                                <p className="text-sm font-medium text-gray-900">{enhanced.full_name}</p>
                            </div>
                        )}

                        {enhanced?.gender && (
                            <div>
                                <span className="text-xs text-gray-500">Gender</span>
                                <p className="text-sm text-gray-900">{enhanced.gender === 'M' ? 'Male' : enhanced.gender === 'F' ? 'Female' : enhanced.gender}</p>
                            </div>
                        )}

                        {entity.birthDate && (
                            <div>
                                <span className="text-xs text-gray-500">Date of Birth</span>
                                <p className="text-sm text-gray-900">{entity.birthDate}</p>
                            </div>
                        )}

                        {enhanced?.birth_place && (
                            <div>
                                <span className="text-xs text-gray-500">Place of Birth</span>
                                <p className="text-sm text-gray-900">{enhanced.birth_place}</p>
                            </div>
                        )}

                        {entity.nationalities && entity.nationalities.length > 0 && (
                            <div>
                                <span className="text-xs text-gray-500">Nationalities</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {entity.nationalities.map((nat, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                            <Globe className="w-3 h-3 mr-1" />
                                            {nat}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Identification Documents */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Identification Documents</h4>

                        {enhanced?.identifications && enhanced.identifications.length > 0 ? (
                            <div className="space-y-3">
                                {enhanced.identifications.map((doc, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-start gap-2">
                                            <CreditCard className="w-4 h-4 text-gray-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{doc.document_type}</p>
                                                <p className="text-xs text-gray-600 font-mono mt-1">{doc.document_number}</p>
                                                {doc.issuing_country && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Issued by: {doc.issuing_country}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No identification documents available</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Professional Information */}
            {enhanced?.current_position && (
                <Card>
                    <CardHeader className="bg-gray-50/50 pb-4">
                        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-gray-600" />
                            Professional Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {enhanced.current_position && (
                                <div>
                                    <span className="text-xs text-gray-500">Current Position</span>
                                    <p className="text-sm font-medium text-gray-900 mt-1">{enhanced.current_position}</p>
                                </div>
                            )}

                            {enhanced.positions && enhanced.positions.length > 1 && (
                                <div>
                                    <span className="text-xs text-gray-500">All Positions</span>
                                    <div className="mt-2 space-y-1">
                                        {enhanced.positions.map((pos, idx) => (
                                            <div key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5" />
                                                {pos}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {enhanced.business_affiliations && enhanced.business_affiliations.length > 0 && (
                                <div>
                                    <span className="text-xs text-gray-500">Business Affiliations</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {enhanced.business_affiliations.map((aff, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                <Building2 className="w-3 h-3 mr-1" />
                                                {aff}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Addresses */}
            {enhanced?.addresses && enhanced.addresses.length > 0 && (
                <Card>
                    <CardHeader className="bg-gray-50/50 pb-4">
                        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-600" />
                            Addresses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            {enhanced.addresses.map((addr, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900">{addr.full_address}</p>
                                            {addr.is_current && (
                                                <Badge variant="outline" className="text-xs mt-2">
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Regulatory Information */}
            {enhanced?.first_listed_date && (
                <Card>
                    <CardHeader className="bg-gray-50/50 pb-4">
                        <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            Regulatory Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-xs text-gray-500">First Listed</span>
                            <p className="text-sm font-medium text-gray-900">{enhanced.first_listed_date}</p>
                        </div>

                        {enhanced.last_updated_date && (
                            <div>
                                <span className="text-xs text-gray-500">Last Updated</span>
                                <p className="text-sm font-medium text-gray-900">{enhanced.last_updated_date}</p>
                            </div>
                        )}

                        <div>
                            <span className="text-xs text-gray-500">Designation Status</span>
                            <Badge
                                variant={enhanced.designation_status === 'Active' ? 'destructive' : 'secondary'}
                                className="mt-1"
                            >
                                {enhanced.designation_status}
                            </Badge>
                        </div>

                        {enhanced.data_completeness_score > 0 && (
                            <div>
                                <span className="text-xs text-gray-500">Data Completeness</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-teal-500 rounded-full"
                                            style={{ width: `${enhanced.data_completeness_score}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {enhanced.data_completeness_score}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* View Timeline Button */}
            {enhanced?.timeline_events && enhanced.timeline_events.length > 0 && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onChangeTab('timeline')}
                >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Timeline ({enhanced.timeline_events.length} events)
                    <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
            )}

            {/* Source Link */}
            {entity.sourceUrl && (
                <div className="flex justify-center pt-4">
                    <a
                        href={entity.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                        View Source Data
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            )}
        </div>
    );
}
