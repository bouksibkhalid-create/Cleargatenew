/**
 * Enhanced Entity Type Definitions
 * 
 * Extended types to support 40+ entity fields including sanctions reasoning,
 * identifications, addresses, regulations, and timeline events.
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function calculateAge(birthDate: string): number | null {
    try {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    } catch {
        return null;
    }
}

export function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}


// ============================================================================
// ENHANCED ENTITY TYPES (40+ fields)
// ============================================================================

export interface IdentificationDocument {
    id?: string;
    document_type: string;  // Passport, National ID, Tax ID, etc.
    document_number: string;
    issuing_country?: string;
    country_code?: string;
    issue_date?: string;
    expiry_date?: string;
    is_verified?: boolean;
    source?: string;
}

export interface StructuredAddress {
    id?: string;
    full_address?: string;
    street?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    country_code?: string;
    address_type?: string;
    is_primary?: boolean;
    is_current?: boolean;
}

export interface RegulationDetail {
    id?: string;
    regulation_id: string;
    programme?: string;
    regulation_type?: string;
    entry_into_force_date?: string;
    last_amendment_date?: string;
    publication_date?: string;
    legal_basis?: string;
    remarks?: string;
    official_journal_url?: string;
}

export interface TimelineEvent {
    id?: string;
    event_type: string;  // Listed, Updated, Amended, Delisted, Verified, Other
    event_date: string;
    event_description?: string;
    regulation_id?: string;
    source?: string;
}

export interface EnhancedEntity {
    // Core Identity (9 fields)
    id: string;
    external_id: string;
    name: string;
    full_name?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    title?: string;
    aliases: string[];

    // Classification (2 fields)
    entity_type: string;
    source: string;

    // Biographical (5 fields)
    birth_date?: string;
    birth_place?: string;
    birth_city?: string;
    birth_country?: string;
    gender?: string;

    // Geographic (2 fields)
    citizenship_countries: string[];
    nationalities: string[];

    // Identifications (array)
    identifications: IdentificationDocument[];

    // Addresses (array)
    addresses: StructuredAddress[];

    // Professional (4 fields)
    positions: string[];
    current_position?: string;
    business_affiliations: string[];
    industry_sectors: string[];

    // Sanctions (7 fields) - CRITICAL
    is_sanctioned: boolean;
    sanctions_reason?: string;  // CRITICAL - full text explanation
    sanctions_summary?: string;
    legal_basis?: string;
    legal_articles: string[];
    measures: string[];
    sanction_lists: string[];

    // Regulatory (5 fields)
    regulation_ids: string[];
    programmes: string[];
    first_listed_date?: string;
    last_updated_date?: string;
    designation_status: string;

    // Regulations (array)
    regulations: RegulationDetail[];

    // Timeline (array)
    timeline_events: TimelineEvent[];

    // Risk (3 fields)
    risk_score?: number;
    risk_level?: string;
    risk_factors: string[];

    // Metadata (4 fields)
    data_completeness_score: number;
    last_verified_at?: string;
    source_url?: string;
    updated_at?: string;

    // Match score
    match_score: number;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility)
// ============================================================================

export interface SanctionProgram {
    program: string;
    authority?: string;
    start_date?: string;
    reason?: string;
}

export interface OpenSanctionsEntity {
    id: string;
    name: string;
    schema?: string;        // Made optional
    entity_schema?: string; // Added as alternative
    aliases: string[];
    birth_date?: string;
    death_date?: string;
    nationalities: string[];
    countries: string[];
    is_sanctioned: boolean;
    sanction_programs: SanctionProgram[];
    datasets: string[];
    first_seen?: string;
    last_seen?: string;
    properties: Record<string, any>;
    url: string;
    match_score: number;
    source: 'opensanctions';
}

export interface SanctionsIoEntity {
    id: string;
    name: string;
    entity_type: string;
    list_type: string;
    programs: string[];
    aliases: string[];
    birth_dates: string[];
    nationalities: string[];
    addresses: Array<Record<string, string>>;
    remarks?: string;
    sources: string[];
    is_sanctioned: boolean;
    match_score: number;
    source: 'sanctions_io';
}

export interface OffshoreConnection {
    entity_id: string;
    entity_name: string;
    entity_type: string;
    relationship: string;
    jurisdiction?: string;
}

export interface OffshoreEntity {
    node_id: number;
    name: string;
    node_type: 'Officer' | 'Entity' | 'Intermediary' | 'Address';
    countries: string[];
    jurisdiction?: string;
    jurisdiction_description?: string;
    incorporation_date?: string;
    service_provider?: string;
    company_type?: string;
    status?: string;
    address?: string;
    source_dataset: string;
    connections_count: number;
    connections: OffshoreConnection[];
    match_score: number;
    source: 'offshore_leaks';
}

export type Entity = OpenSanctionsEntity | SanctionsIoEntity | OffshoreEntity | EnhancedEntity;

// ============================================================================
// UNIFIED ENTITY (for UI display)
// ============================================================================

export type EntityType = 'person' | 'organization' | 'vessel' | 'unknown';

export interface Sanction {
    id: string;
    listName: string;
    authority: string;
    program?: string;
    reason?: string;
    dateAdded?: string;
    referenceNumber?: string;
    sourceUrl?: string;
}

export interface UnifiedEntity {
    id: string;
    name: string;
    description?: string;
    type: EntityType;

    // Matching
    matchScore: number;

    // Risk indicators
    isSanctioned: boolean;
    isPEP: boolean;
    riskScore: number;

    // Personal/Organization details
    birthDate?: string;
    birthPlace?: string;
    nationalities?: string[];
    aliases?: string[];
    addresses?: string[];
    positions?: string[];

    // Sanctions
    sanctionListCount: number;
    sanctions: Sanction[];

    // Relationships
    relationshipCount: number;
    hasOffshoreLeaksData: boolean;

    // Source information
    source: string;
    sourceUrl?: string;
    rawData: Entity;

    // ENHANCED FIELDS (new)
    enhanced?: EnhancedEntity;  // Full enhanced data if available
}

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

export function toUnifiedEntity(entity: Entity): UnifiedEntity {
    if ('enhanced' in entity || 'sanctions_reason' in entity) {
        return transformEnhancedEntity(entity as EnhancedEntity);
    }

    if ('source' in entity) {
        switch (entity.source) {
            case 'opensanctions':
                return transformOpenSanctions(entity as OpenSanctionsEntity);
            case 'sanctions_io':
                return transformSanctionsIo(entity as SanctionsIoEntity);
            case 'offshore_leaks':
                return transformOffshore(entity as OffshoreEntity);
        }
    }

    return transformOpenSanctions(entity as OpenSanctionsEntity);
}

function transformEnhancedEntity(entity: EnhancedEntity): UnifiedEntity {
    return {
        id: entity.id,
        name: entity.name,
        description: entity.sanctions_summary || entity.current_position,
        type: mapEntityType(entity.entity_type),
        matchScore: entity.match_score,

        // Risk
        isSanctioned: entity.is_sanctioned,
        isPEP: false,  // TODO: Add PEP detection
        riskScore: entity.risk_score || 0,

        // Personal details
        birthDate: entity.birth_date,
        birthPlace: entity.birth_place,
        nationalities: entity.nationalities,
        aliases: entity.aliases,
        addresses: entity.addresses.map(a => a.full_address || '').filter(Boolean),
        positions: entity.positions,

        // Sanctions
        sanctionListCount: entity.sanction_lists.length,
        sanctions: entity.programmes.map(prog => ({
            id: `${entity.id}-${prog}`,
            listName: prog,
            authority: entity.source,
            program: prog,
            reason: entity.sanctions_reason,
            dateAdded: entity.first_listed_date,
            sourceUrl: entity.source_url
        })),

        // Relationships
        relationshipCount: 0,
        hasOffshoreLeaksData: false,

        // Source
        source: entity.source,
        sourceUrl: entity.source_url,
        rawData: entity,

        // Enhanced data
        enhanced: entity
    };
}

function transformOpenSanctions(entity: OpenSanctionsEntity): UnifiedEntity {
    // Robustly determine schema
    const schema = entity.schema || entity.entity_schema || 'Unknown';

    return {
        id: entity.id,
        name: entity.name,
        description: entity.properties.description as string,
        type: mapEntityType(schema),
        matchScore: entity.match_score,
        isSanctioned: entity.is_sanctioned,
        isPEP: entity.datasets.some(d => d.toLowerCase().includes('pep')),
        riskScore: entity.is_sanctioned ? 75 : 25,
        birthDate: entity.birth_date,
        nationalities: entity.nationalities,
        aliases: entity.aliases,
        sanctionListCount: entity.sanction_programs.length,
        sanctions: entity.sanction_programs.map(prog => ({
            id: `${entity.id}-${prog.program}`,
            listName: prog.program,
            authority: prog.authority || 'Unknown',
            program: prog.program,
            reason: prog.reason,
            dateAdded: prog.start_date,
            sourceUrl: entity.url
        })),
        relationshipCount: 0,
        hasOffshoreLeaksData: false,
        source: 'OpenSanctions',
        sourceUrl: entity.url,
        rawData: entity
    };
}

function transformSanctionsIo(entity: SanctionsIoEntity): UnifiedEntity {
    return {
        id: entity.id,
        name: entity.name,
        description: entity.remarks,
        type: mapEntityType(entity.entity_type),
        matchScore: entity.match_score,
        isSanctioned: entity.is_sanctioned,
        isPEP: false,
        riskScore: 80,
        birthDate: entity.birth_dates[0],
        nationalities: entity.nationalities,
        aliases: entity.aliases,
        addresses: entity.addresses.map(a => a.address || '').filter(Boolean),
        sanctionListCount: entity.programs.length,
        sanctions: entity.programs.map(prog => ({
            id: `${entity.id}-${prog}`,
            listName: entity.list_type,
            authority: 'OFAC',
            program: prog,
            sourceUrl: entity.sources[0]
        })),
        relationshipCount: 0,
        hasOffshoreLeaksData: false,
        source: 'Sanctions.io',
        sourceUrl: entity.sources[0],
        rawData: entity
    };
}

function transformOffshore(entity: OffshoreEntity): UnifiedEntity {
    return {
        id: entity.node_id.toString(),
        name: entity.name,
        description: `${entity.node_type} in ${entity.jurisdiction || 'Unknown'}`,
        type: entity.node_type === 'Officer' ? 'person' : 'organization',
        matchScore: entity.match_score,
        isSanctioned: false,
        isPEP: false,
        riskScore: 50,
        nationalities: entity.countries,
        addresses: entity.address ? [entity.address] : [],
        sanctionListCount: 0,
        sanctions: [],
        relationshipCount: entity.connections_count,
        hasOffshoreLeaksData: true,
        source: 'Intelligence',
        sourceUrl: `https://offshoreleaks.icij.org/nodes/${entity.node_id}`,
        rawData: entity
    };
}

export function mapEntityType(schema: string): EntityType {
    if (!schema || typeof schema !== 'string') return 'unknown';

    const lower = schema.toLowerCase();
    if (lower.includes('person') || lower.includes('individual') || lower.includes('officer')) {
        return 'person';
    }
    if (lower.includes('organization') || lower.includes('company') || lower.includes('entity')) {
        return 'organization';
    }
    if (lower.includes('vessel') || lower.includes('ship')) {
        return 'vessel';
    }
    return 'unknown';
}
