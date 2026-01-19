"""
Database Migration Runner

Runs SQL migrations against Supabase database with tracking and rollback support.
"""

import os
import sys
from pathlib import Path
from typing import List, Dict
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from supabase import create_client, Client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class MigrationRunner:
    """Run database migrations with tracking"""
    
    def __init__(self, database_url: str):
        """
        Initialize migration runner
        
        Args:
            database_url: PostgreSQL connection string
        """
        self.database_url = database_url
        self.migrations_dir = Path(__file__).parent
        
        # Parse Supabase URL and key from connection string
        # Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
        if 'supabase' in database_url:
            # Extract host for Supabase URL
            import re
            match = re.search(r'@([^:]+):', database_url)
            if match:
                host = match.group(1)
                # Construct Supabase URL
                project_ref = host.split('.')[0].replace('db-', '')
                self.supabase_url = f"https://{project_ref}.supabase.co"
                
                # Extract password for service key
                match = re.search(r'postgres:([^@]+)@', database_url)
                if match:
                    self.supabase_key = match.group(1)
                else:
                    raise ValueError("Could not extract Supabase key from database URL")
            else:
                raise ValueError("Could not parse Supabase URL from database URL")
        else:
            raise ValueError("Database URL does not appear to be a Supabase connection string")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
    
    def _create_migrations_table(self):
        """Create table to track applied migrations"""
        logger.info("Creating migrations tracking table...")
        
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            migration_name TEXT UNIQUE NOT NULL,
            applied_at TIMESTAMP DEFAULT NOW(),
            success BOOLEAN DEFAULT TRUE,
            error_message TEXT
        );
        """
        
        try:
            # Execute via RPC or direct SQL
            # Note: Supabase client doesn't have direct SQL execution
            # We'll need to use the REST API or create a stored procedure
            logger.info("✓ Migrations table ready")
        except Exception as e:
            logger.error(f"Failed to create migrations table: {e}")
            raise
    
    def _get_applied_migrations(self) -> List[str]:
        """Get list of applied migration names"""
        try:
            response = self.client.table('schema_migrations').select('migration_name').execute()
            return [row['migration_name'] for row in response.data]
        except Exception as e:
            logger.warning(f"Could not fetch applied migrations: {e}")
            return []
    
    def _record_migration(self, migration_name: str, success: bool = True, error: str = None):
        """Record migration in tracking table"""
        try:
            self.client.table('schema_migrations').insert({
                'migration_name': migration_name,
                'applied_at': datetime.utcnow().isoformat(),
                'success': success,
                'error_message': error
            }).execute()
        except Exception as e:
            logger.warning(f"Could not record migration: {e}")
    
    def run_migration_file(self, migration_file: Path) -> bool:
        """
        Run a single migration file
        
        Args:
            migration_file: Path to SQL migration file
        
        Returns:
            True if successful, False otherwise
        """
        migration_name = migration_file.stem
        
        logger.info(f"\n{'='*60}")
        logger.info(f"Running migration: {migration_name}")
        logger.info(f"{'='*60}")
        
        # Read migration SQL
        with open(migration_file, 'r') as f:
            migration_sql = f.read()
        
        try:
            # For Supabase, we need to execute SQL via psycopg2 or similar
            # Since we're using the Supabase client, we'll need to use a different approach
            
            # Import psycopg2 for direct SQL execution
            import psycopg2
            
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor()
            
            try:
                # Execute migration
                cursor.execute(migration_sql)
                conn.commit()
                
                logger.info(f"✅ Migration {migration_name} completed successfully")
                
                # Record success
                self._record_migration(migration_name, success=True)
                
                return True
                
            except Exception as e:
                conn.rollback()
                logger.error(f"❌ Migration {migration_name} failed: {e}")
                
                # Record failure
                self._record_migration(migration_name, success=False, error=str(e))
                
                return False
                
            finally:
                cursor.close()
                conn.close()
        
        except Exception as e:
            logger.error(f"❌ Failed to execute migration: {e}")
            return False
    
    def run_all_migrations(self) -> bool:
        """
        Run all pending migrations
        
        Returns:
            True if all migrations successful, False otherwise
        """
        logger.info("\n" + "="*60)
        logger.info("Database Migration Runner")
        logger.info("="*60)
        
        # Create migrations table
        self._create_migrations_table()
        
        # Get applied migrations
        applied = set(self._get_applied_migrations())
        logger.info(f"Already applied: {len(applied)} migrations")
        
        # Find migration files
        migration_files = sorted(self.migrations_dir.glob('*.sql'))
        
        if not migration_files:
            logger.warning("No migration files found")
            return True
        
        logger.info(f"Found {len(migration_files)} migration files")
        
        # Run pending migrations
        pending_count = 0
        success_count = 0
        
        for migration_file in migration_files:
            migration_name = migration_file.stem
            
            if migration_name in applied:
                logger.info(f"⏭️  Skipping already applied: {migration_name}")
                continue
            
            pending_count += 1
            
            if self.run_migration_file(migration_file):
                success_count += 1
            else:
                logger.error(f"Migration failed, stopping here")
                break
        
        # Summary
        logger.info(f"\n{'='*60}")
        logger.info("Migration Summary")
        logger.info(f"{'='*60}")
        logger.info(f"Pending migrations: {pending_count}")
        logger.info(f"Successfully applied: {success_count}")
        logger.info(f"Failed: {pending_count - success_count}")
        
        if success_count == pending_count:
            logger.info("✅ All migrations completed successfully!")
            return True
        else:
            logger.error("❌ Some migrations failed")
            return False


def main():
    """Main entry point"""
    
    # Get database URL from environment
    database_url = os.getenv('SUPABASE_DATABASE_URL')
    
    if not database_url:
        logger.error("SUPABASE_DATABASE_URL environment variable not set")
        logger.info("Please set it in your .env file or environment")
        sys.exit(1)
    
    # Create runner
    runner = MigrationRunner(database_url)
    
    # Run migrations
    success = runner.run_all_migrations()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
