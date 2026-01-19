# Database Migrations

This directory contains SQL migrations for the enhanced entity intelligence system.

## Migration Files

### 001_enhanced_entity_schema.sql
**Purpose:** Add comprehensive entity intelligence fields

**Changes:**
- Adds 25+ new fields to `sanctions_entities` table
- Creates 4 new tables:
  - `entity_identifications` - Identification documents
  - `entity_addresses` - Structured addresses
  - `entity_regulations` - Detailed regulations
  - `entity_timeline_events` - Timeline events
- Creates full-text search indexes
- Creates performance indexes
- Creates helper views

**New Fields:**
- Biographical: first_name, middle_name, last_name, full_name, title, birth_place, birth_city, birth_country, gender
- Geographic: citizenship_countries, nationalities
- Professional: positions, current_position, business_affiliations, industry_sectors
- Sanctions: sanctions_reason, sanctions_summary, legal_basis, legal_articles, measures, sanction_lists
- Regulatory: regulation_ids, programmes, first_listed_date, last_updated_date, designation_status
- Risk: risk_score, risk_level, risk_factors
- Metadata: data_completeness_score, last_verified_at, source_url, source_document_id

### 001_enhanced_entity_schema_rollback.sql
**Purpose:** Rollback migration 001

**WARNING:** This will remove all enhanced fields and related tables. Backup data before running!

## Running Migrations

### Option 1: Using Python Runner (Recommended)

```bash
cd backend
python migrations/run_migrations.py
```

This will:
- Create migrations tracking table
- Run all pending migrations
- Track which migrations have been applied
- Provide detailed logging

### Option 2: Manual SQL Execution

If you prefer to run migrations manually:

```bash
# Using psql
psql "$SUPABASE_DATABASE_URL" -f migrations/001_enhanced_entity_schema.sql

# Or via Supabase Dashboard
# Copy and paste the SQL into the SQL Editor
```

## Rollback

To rollback the enhanced schema:

```bash
psql "$SUPABASE_DATABASE_URL" -f migrations/001_enhanced_entity_schema_rollback.sql
```

## Migration Tracking

Migrations are tracked in the `schema_migrations` table:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

## Prerequisites

Before running migrations:

1. **Backup your database**
   ```bash
   pg_dump "$SUPABASE_DATABASE_URL" > backup_$(date +%Y%m%d).sql
   ```

2. **Set environment variable**
   ```bash
   export SUPABASE_DATABASE_URL="postgresql://postgres:..."
   ```

3. **Install dependencies**
   ```bash
   pip install psycopg2-binary
   ```

## Verification

After running migrations, verify the changes:

```sql
-- Check new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sanctions_entities' 
ORDER BY ordinal_position;

-- Check new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'entity_%';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'sanctions_entities';

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

## Troubleshooting

### Migration fails with "column already exists"
The migration uses `IF NOT EXISTS` clauses, so it's safe to re-run. If you see this error, it means some columns were already added.

### Permission denied
Make sure you're using the service role key (not anon key) in your database URL.

### Connection timeout
Increase the timeout in your connection string or check your network connection.

## Next Steps

After running migrations:

1. **Update parsers** to populate new fields
2. **Update API** to return enhanced data
3. **Update frontend** to display new fields
4. **Test data integrity** with sample entities
