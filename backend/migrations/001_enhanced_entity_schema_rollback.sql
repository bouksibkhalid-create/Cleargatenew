-- Rollback Migration: Enhanced Entity Intelligence Schema
-- Version: 001_rollback
-- Date: 2026-01-19
-- Description: Rollback enhanced entity intelligence schema changes

-- WARNING: This will remove all enhanced fields and related tables
-- Make sure to backup data before running this rollback!

-- ============================================================================
-- PART 1: DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS entity_complete_profile CASCADE;
DROP VIEW IF EXISTS high_risk_entities CASCADE;
DROP VIEW IF EXISTS recently_updated_entities CASCADE;

-- ============================================================================
-- PART 2: DROP TRIGGERS AND FUNCTIONS
-- ============================================================================

DROP TRIGGER IF EXISTS update_identifications_updated_at ON entity_identifications;
DROP TRIGGER IF EXISTS update_addresses_updated_at ON entity_addresses;
DROP TRIGGER IF EXISTS update_regulations_updated_at ON entity_regulations;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- PART 3: DROP NEW TABLES
-- ============================================================================

DROP TABLE IF EXISTS entity_timeline_events CASCADE;
DROP TABLE IF EXISTS entity_regulations CASCADE;
DROP TABLE IF EXISTS entity_addresses CASCADE;
DROP TABLE IF EXISTS entity_identifications CASCADE;

-- ============================================================================
-- PART 4: DROP INDEXES ON sanctions_entities
-- ============================================================================

-- Full-text search indexes
DROP INDEX IF EXISTS idx_entity_name_fts;
DROP INDEX IF EXISTS idx_entity_full_name_fts;
DROP INDEX IF EXISTS idx_sanctions_reason_fts;
DROP INDEX IF EXISTS idx_positions_fts;

-- Performance indexes
DROP INDEX IF EXISTS idx_entity_risk_score;
DROP INDEX IF EXISTS idx_entity_first_listed;
DROP INDEX IF EXISTS idx_entity_programmes;
DROP INDEX IF EXISTS idx_entity_measures;
DROP INDEX IF EXISTS idx_entity_positions;
DROP INDEX IF EXISTS idx_entity_nationalities;
DROP INDEX IF EXISTS idx_entity_designation_status;
DROP INDEX IF EXISTS idx_entity_completeness;
DROP INDEX IF EXISTS idx_entity_source_type;

-- ============================================================================
-- PART 5: DROP CONSTRAINTS
-- ============================================================================

ALTER TABLE sanctions_entities 
DROP CONSTRAINT IF EXISTS check_risk_score;

ALTER TABLE sanctions_entities
DROP CONSTRAINT IF EXISTS check_completeness_score;

ALTER TABLE sanctions_entities
DROP CONSTRAINT IF EXISTS check_designation_status;

ALTER TABLE sanctions_entities
DROP CONSTRAINT IF EXISTS check_gender;

-- ============================================================================
-- PART 6: DROP COLUMNS FROM sanctions_entities
-- ============================================================================

ALTER TABLE sanctions_entities
-- Biographical
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS middle_name,
DROP COLUMN IF EXISTS last_name,
DROP COLUMN IF EXISTS full_name,
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS birth_place,
DROP COLUMN IF EXISTS birth_city,
DROP COLUMN IF EXISTS birth_country,
DROP COLUMN IF EXISTS gender,

-- Geographic
DROP COLUMN IF EXISTS citizenship_countries,
DROP COLUMN IF EXISTS nationalities,

-- Professional
DROP COLUMN IF EXISTS positions,
DROP COLUMN IF EXISTS current_position,
DROP COLUMN IF EXISTS business_affiliations,
DROP COLUMN IF EXISTS industry_sectors,

-- Sanctions
DROP COLUMN IF EXISTS sanctions_reason,
DROP COLUMN IF EXISTS sanctions_summary,
DROP COLUMN IF EXISTS legal_basis,
DROP COLUMN IF EXISTS legal_articles,
DROP COLUMN IF EXISTS measures,
DROP COLUMN IF EXISTS sanction_lists,

-- Regulatory
DROP COLUMN IF EXISTS regulation_ids,
DROP COLUMN IF EXISTS programmes,
DROP COLUMN IF EXISTS first_listed_date,
DROP COLUMN IF EXISTS last_updated_date,
DROP COLUMN IF EXISTS designation_status,

-- Risk
DROP COLUMN IF EXISTS risk_score,
DROP COLUMN IF EXISTS risk_level,
DROP COLUMN IF EXISTS risk_factors,

-- Metadata
DROP COLUMN IF EXISTS data_completeness_score,
DROP COLUMN IF EXISTS last_verified_at,
DROP COLUMN IF EXISTS source_url,
DROP COLUMN IF EXISTS source_document_id;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Enhanced Entity Intelligence Schema Rollback Complete';
    RAISE NOTICE 'Removed 25+ fields from sanctions_entities table';
    RAISE NOTICE 'Dropped 4 tables: entity_identifications, entity_addresses, entity_regulations, entity_timeline_events';
    RAISE NOTICE 'Dropped all related indexes, views, and functions';
END $$;
