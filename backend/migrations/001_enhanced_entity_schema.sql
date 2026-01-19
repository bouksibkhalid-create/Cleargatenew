-- Enhanced Entity Intelligence Schema Migration
-- Version: 001
-- Date: 2026-01-19
-- Description: Add comprehensive entity intelligence fields to support 40+ field extraction

-- ============================================================================
-- PART 1: ADD NEW COLUMNS TO EXISTING sanctions_entities TABLE
-- ============================================================================

-- Biographical Data (5 new fields)
ALTER TABLE sanctions_entities 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS birth_city TEXT,
ADD COLUMN IF NOT EXISTS birth_country TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT;

-- Geographic Data (2 new fields)
ALTER TABLE sanctions_entities
ADD COLUMN IF NOT EXISTS citizenship_countries TEXT[],
ADD COLUMN IF NOT EXISTS nationalities TEXT[];

-- Professional Information (4 new fields)
ALTER TABLE sanctions_entities
ADD COLUMN IF NOT EXISTS positions TEXT[],
ADD COLUMN IF NOT EXISTS current_position TEXT,
ADD COLUMN IF NOT EXISTS business_affiliations TEXT[],
ADD COLUMN IF NOT EXISTS industry_sectors TEXT[];

-- Sanctions Details (7 new fields)
ALTER TABLE sanctions_entities
ADD COLUMN IF NOT EXISTS sanctions_reason TEXT,
ADD COLUMN IF NOT EXISTS sanctions_summary TEXT,
ADD COLUMN IF NOT EXISTS legal_basis TEXT,
ADD COLUMN IF NOT EXISTS legal_articles TEXT[],
ADD COLUMN IF NOT EXISTS measures TEXT[],
ADD COLUMN IF NOT EXISTS sanction_lists TEXT[];

-- Regulatory Data (5 new fields)
ALTER TABLE sanctions_entities
ADD COLUMN IF NOT EXISTS regulation_ids TEXT[],
ADD COLUMN IF NOT EXISTS programmes TEXT[],
ADD COLUMN IF NOT EXISTS first_listed_date DATE,
ADD COLUMN IF NOT EXISTS last_updated_date DATE,
ADD COLUMN IF NOT EXISTS designation_status TEXT DEFAULT 'Active';

-- Risk Assessment (3 new fields)
ALTER TABLE sanctions_entities
ADD COLUMN IF NOT EXISTS risk_score INTEGER,
ADD COLUMN IF NOT EXISTS risk_level TEXT,
ADD COLUMN IF NOT EXISTS risk_factors TEXT[];

-- Metadata (4 new fields)
ALTER TABLE sanctions_entities
ADD COLUMN IF NOT EXISTS data_completeness_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_document_id TEXT;

-- Add constraints
ALTER TABLE sanctions_entities 
ADD CONSTRAINT IF NOT EXISTS check_risk_score 
    CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100));

ALTER TABLE sanctions_entities
ADD CONSTRAINT IF NOT EXISTS check_completeness_score 
    CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100);

ALTER TABLE sanctions_entities
ADD CONSTRAINT IF NOT EXISTS check_designation_status 
    CHECK (designation_status IN ('Active', 'Delisted', 'Amended'));

ALTER TABLE sanctions_entities
ADD CONSTRAINT IF NOT EXISTS check_gender
    CHECK (gender IS NULL OR gender IN ('M', 'F', 'Other'));

-- ============================================================================
-- PART 2: CREATE NEW RELATED TABLES
-- ============================================================================

-- Table: entity_identifications
-- Stores identification documents (passports, IDs, tax numbers)
CREATE TABLE IF NOT EXISTS entity_identifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES sanctions_entities(id) ON DELETE CASCADE,
    
    -- Document details
    document_type TEXT NOT NULL,
    document_number TEXT NOT NULL,
    issuing_country TEXT,
    country_code TEXT,
    issue_date DATE,
    expiry_date DATE,
    
    -- Metadata
    is_verified BOOLEAN DEFAULT FALSE,
    source TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for identifications
CREATE INDEX IF NOT EXISTS idx_identifications_entity 
    ON entity_identifications(entity_id);
CREATE INDEX IF NOT EXISTS idx_identifications_number 
    ON entity_identifications(document_number);
CREATE INDEX IF NOT EXISTS idx_identifications_country 
    ON entity_identifications(issuing_country);

-- Table: entity_addresses
-- Stores structured address information
CREATE TABLE IF NOT EXISTS entity_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES sanctions_entities(id) ON DELETE CASCADE,
    
    -- Address components
    full_address TEXT,
    street TEXT,
    city TEXT,
    region TEXT,
    postal_code TEXT,
    country TEXT,
    country_code TEXT,
    
    -- Address metadata
    address_type TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT TRUE,
    
    -- Validity period
    valid_from DATE,
    valid_to DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for addresses
CREATE INDEX IF NOT EXISTS idx_addresses_entity 
    ON entity_addresses(entity_id);
CREATE INDEX IF NOT EXISTS idx_addresses_country 
    ON entity_addresses(country);
CREATE INDEX IF NOT EXISTS idx_addresses_city 
    ON entity_addresses(city);
CREATE INDEX IF NOT EXISTS idx_addresses_current 
    ON entity_addresses(entity_id, is_current) 
    WHERE is_current = TRUE;

-- Table: entity_regulations
-- Stores detailed regulation/programme information
CREATE TABLE IF NOT EXISTS entity_regulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES sanctions_entities(id) ON DELETE CASCADE,
    
    -- Regulation details
    regulation_id TEXT NOT NULL,
    programme TEXT,
    regulation_type TEXT,
    
    -- Dates
    entry_into_force_date DATE,
    last_amendment_date DATE,
    publication_date DATE,
    
    -- Legal details
    legal_basis TEXT,
    remarks TEXT,
    
    -- Links
    official_journal_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for regulations
CREATE INDEX IF NOT EXISTS idx_regulations_entity 
    ON entity_regulations(entity_id);
CREATE INDEX IF NOT EXISTS idx_regulations_id 
    ON entity_regulations(regulation_id);
CREATE INDEX IF NOT EXISTS idx_regulations_programme 
    ON entity_regulations(programme);
CREATE INDEX IF NOT EXISTS idx_regulations_entry_date 
    ON entity_regulations(entry_into_force_date DESC);

-- Table: entity_timeline_events
-- Stores chronological events (listing, updates, amendments)
CREATE TABLE IF NOT EXISTS entity_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES sanctions_entities(id) ON DELETE CASCADE,
    
    -- Event details
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_description TEXT,
    
    -- Related data
    regulation_id TEXT,
    source TEXT,
    
    -- Changes (JSON for flexibility)
    changes_json JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for timeline events
CREATE INDEX IF NOT EXISTS idx_timeline_entity 
    ON entity_timeline_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date 
    ON entity_timeline_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type 
    ON entity_timeline_events(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_entity_date 
    ON entity_timeline_events(entity_id, event_date DESC);

-- Constraint for event types
ALTER TABLE entity_timeline_events
ADD CONSTRAINT IF NOT EXISTS check_event_type
    CHECK (event_type IN ('Listed', 'Updated', 'Amended', 'Delisted', 'Verified', 'Other'));

-- ============================================================================
-- PART 3: CREATE FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Full-text search on name fields
CREATE INDEX IF NOT EXISTS idx_entity_name_fts 
    ON sanctions_entities 
    USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_entity_full_name_fts 
    ON sanctions_entities 
    USING gin(to_tsvector('english', COALESCE(full_name, '')));

-- Full-text search on sanctions reasoning (CRITICAL for search)
CREATE INDEX IF NOT EXISTS idx_sanctions_reason_fts 
    ON sanctions_entities 
    USING gin(to_tsvector('english', COALESCE(sanctions_reason, '')));

-- Full-text search on positions
CREATE INDEX IF NOT EXISTS idx_positions_fts 
    ON sanctions_entities 
    USING gin(to_tsvector('english', COALESCE(current_position, '')));

-- ============================================================================
-- PART 4: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Index on risk score for filtering high-risk entities
CREATE INDEX IF NOT EXISTS idx_entity_risk_score 
    ON sanctions_entities(risk_score DESC) 
    WHERE risk_score IS NOT NULL;

-- Index on first listed date for timeline queries
CREATE INDEX IF NOT EXISTS idx_entity_first_listed 
    ON sanctions_entities(first_listed_date DESC) 
    WHERE first_listed_date IS NOT NULL;

-- GIN indexes for array fields
CREATE INDEX IF NOT EXISTS idx_entity_programmes 
    ON sanctions_entities USING gin(programmes) 
    WHERE programmes IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_measures 
    ON sanctions_entities USING gin(measures) 
    WHERE measures IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_positions 
    ON sanctions_entities USING gin(positions) 
    WHERE positions IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_nationalities 
    ON sanctions_entities USING gin(nationalities) 
    WHERE nationalities IS NOT NULL;

-- Index on designation status
CREATE INDEX IF NOT EXISTS idx_entity_designation_status 
    ON sanctions_entities(designation_status);

-- Index on completeness score for data quality monitoring
CREATE INDEX IF NOT EXISTS idx_entity_completeness 
    ON sanctions_entities(data_completeness_score DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_entity_source_type 
    ON sanctions_entities(source, entity_type);

-- ============================================================================
-- PART 5: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_identifications_updated_at ON entity_identifications;
CREATE TRIGGER update_identifications_updated_at
    BEFORE UPDATE ON entity_identifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON entity_addresses;
CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON entity_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_regulations_updated_at ON entity_regulations;
CREATE TRIGGER update_regulations_updated_at
    BEFORE UPDATE ON entity_regulations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 6: CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Complete entity profile with all related data
CREATE OR REPLACE VIEW entity_complete_profile AS
SELECT 
    e.*,
    COALESCE(
        json_agg(DISTINCT jsonb_build_object(
            'id', i.id,
            'document_type', i.document_type,
            'document_number', i.document_number,
            'issuing_country', i.issuing_country
        )) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
    ) AS identifications_json,
    COALESCE(
        json_agg(DISTINCT jsonb_build_object(
            'id', a.id,
            'full_address', a.full_address,
            'city', a.city,
            'country', a.country,
            'is_current', a.is_current
        )) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
    ) AS addresses_json,
    COALESCE(
        json_agg(DISTINCT jsonb_build_object(
            'id', r.id,
            'regulation_id', r.regulation_id,
            'programme', r.programme,
            'entry_into_force_date', r.entry_into_force_date
        )) FILTER (WHERE r.id IS NOT NULL),
        '[]'::json
    ) AS regulations_json,
    COALESCE(
        json_agg(DISTINCT jsonb_build_object(
            'id', t.id,
            'event_type', t.event_type,
            'event_date', t.event_date,
            'event_description', t.event_description
        ) ORDER BY t.event_date DESC) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
    ) AS timeline_events_json
FROM sanctions_entities e
LEFT JOIN entity_identifications i ON e.id = i.entity_id
LEFT JOIN entity_addresses a ON e.id = a.entity_id
LEFT JOIN entity_regulations r ON e.id = r.entity_id
LEFT JOIN entity_timeline_events t ON e.id = t.entity_id
GROUP BY e.id;

-- View: High-risk entities
CREATE OR REPLACE VIEW high_risk_entities AS
SELECT *
FROM sanctions_entities
WHERE risk_score >= 75
ORDER BY risk_score DESC, first_listed_date DESC;

-- View: Recently updated entities
CREATE OR REPLACE VIEW recently_updated_entities AS
SELECT *
FROM sanctions_entities
WHERE last_updated_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY last_updated_date DESC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Enhanced Entity Intelligence Schema Migration Complete';
    RAISE NOTICE 'Added 25+ new fields to sanctions_entities table';
    RAISE NOTICE 'Created 4 new tables: entity_identifications, entity_addresses, entity_regulations, entity_timeline_events';
    RAISE NOTICE 'Created full-text search indexes for sanctions reasoning';
    RAISE NOTICE 'Created performance indexes for common queries';
    RAISE NOTICE 'Created helper views for entity profiles';
END $$;
