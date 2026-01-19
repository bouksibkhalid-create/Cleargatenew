
import asyncio
import csv
import os
import sys
import time
from pathlib import Path
from typing import List, Dict, Any

from neo4j import GraphDatabase, AsyncGraphDatabase
from tqdm import tqdm

from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(Path(__file__).resolve().parents[1], '.env'))

class Settings:
    NEO4J_URI = os.getenv("NEO4J_URI")
    NEO4J_USER = os.getenv("NEO4J_USER")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

settings = Settings()

# Configure logging
import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
BATCH_SIZE = 1000
SKIP_NODES = False  # Set to False for fresh import
THROTTLE_DELAY = 0.3  # Seconds to wait between batches to respect Aura limits
DATA_DIR = os.getenv("ICIJ_DATA_DIR", "./data/icij")

NODE_FILES = {
    "Officer": "nodes-officers.csv",
    "Entity": "nodes-entities.csv",
    "Intermediary": "nodes-intermediaries.csv",
    "Address": "nodes-addresses.csv",
    "Other": "nodes-others.csv"
}

RELATIONSHIP_FILE = "relationships.csv"

async def create_constraints(driver):
    """Create constraints to ensure data integrity and performance."""
    logger.info("Creating constraints and indexes...")
    async with driver.session() as session:
        # Constraints on node_id for each label
        labels = ["Officer", "Entity", "Intermediary", "Address", "Other"]
        for label in labels:
            query = f"CREATE CONSTRAINT {label.lower()}_node_id IF NOT EXISTS FOR (n:{label}) REQUIRE n.node_id IS UNIQUE"
            await session.run(query)
            logger.info(f"Created constraint for {label}")
        
        # Index on name for faster lookups (partial matches handled by full-text search)
        for label in labels:
             query = f"CREATE INDEX {label.lower()}_name IF NOT EXISTS FOR (n:{label}) ON (n.name)"
             await session.run(query)
             logger.info(f"Created name index for {label}")

        # Create generic ICIJNode index for performant O(1) relationships lookups
        await session.run("CREATE INDEX icij_node_id IF NOT EXISTS FOR (n:ICIJNode) ON (n.node_id)")
        logger.info("Created generic index for ICIJNode")

async def create_fulltext_index(driver):
    """Create full-text search index."""
    logger.info("Creating full-text search index...")
    async with driver.session() as session:
        # Check if index exists
        result = await session.run("SHOW INDEXES WHERE name = 'offshore_fulltext'")
        record = await result.single()
        
        if not record:
            query = """
            CREATE FULLTEXT INDEX offshore_fulltext FOR (n:Officer|Entity|Intermediary|Address|Other) 
            ON EACH [n.name, n.address, n.countries, n.jurisdiction_description]
            """
            await session.run(query)
            logger.info("Created full-text index 'offshore_fulltext'")
        else:
            logger.info("Full-text index 'offshore_fulltext' already exists")

def read_csv_batch(file_path: str, batch_size: int = BATCH_SIZE):
    """Yield batches of rows from a CSV file."""
    if not os.path.exists(file_path):
        logger.warning(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        batch = []
        for row in reader:
            # Clean up empty strings to None
            cleaned_row = {k: (v if v else None) for k, v in row.items()}
            # Convert node_id to integer
            if 'node_id' in cleaned_row and cleaned_row['node_id']:
                 try:
                    cleaned_row['node_id'] = int(cleaned_row['node_id'])
                 except ValueError:
                    continue
            
            batch.append(cleaned_row)
            if len(batch) >= batch_size:
                yield batch
                batch = []
        if batch:
            yield batch

async def import_nodes(driver, label: str, filename: str):
    """Import nodes from CSV."""
    file_path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(file_path):
        logger.warning(f"Skipping {label} import: File {file_path} not found")
        return

    logger.info(f"Importing {label} nodes from {filename}...")
    
    # Count lines for tqdm
    total_lines = sum(1 for _ in open(file_path, 'r', encoding='utf-8', errors='ignore')) - 1
    
    query = f"""
    UNWIND $batch AS row
    MERGE (n:{label} {{node_id: row.node_id}})
    SET n:ICIJNode,
        n += row,
        n.source_file = $filename,
        n.imported_at = datetime()
    """
    
    async with driver.session() as session:
        with tqdm(total=total_lines, desc=f"Importing {label}") as pbar:
            for batch in read_csv_batch(file_path):
                await session.run(query, batch=batch, filename=filename)
                pbar.update(len(batch))

async def import_relationships(driver):
    """Import relationships from CSV."""
    file_path = os.path.join(DATA_DIR, RELATIONSHIP_FILE)
    if not os.path.exists(file_path):
        logger.warning(f"Skipping relationship import: File {file_path} not found")
        return

    logger.info(f"Importing relationships from {RELATIONSHIP_FILE}...")
    
    # Count lines
    total_lines = sum(1 for _ in open(file_path, 'r', encoding='utf-8', errors='ignore')) - 1
    
    # We need to handle dynamic relationship types.
    # Since Cypher doesn't allow dynamic relationship types in MERGE easily without APOC,
    # and we want to avoid complex APOC dependencies if possible,
    # we can group batches by relationship type or use a generic approach if possible.
    # However, standard Cypher requires the type to be static.
    # Strategy: Group batch by 'rel_type' (relationship from CSV) and execute separate queries?
    # Or use APOC: CALL apoc.merge.relationship(start, row.rel_type, {}, {}, end)
    # Let's assume standardized relationship types or sanitize them.
    # Actually, the ICIJ data has columns: node_id_start, node_id_end, rel_type, link, status, ...
    
    # Reading batch and grouping by type might be slow.
    # Let's try to construct a query that handles this, or just sanitize the rel_type and inject it (safely).
    # Since these are known types from ICIJ, injection risk is low but let's be safe.
    # Ideally, we sort the CSV by rel_type or just filter.
    # For simplicity and performance, we will read the batch, and for each unique rel_type in the batch, execute a sub-batch.
    
    async with driver.session() as session:
        with tqdm(total=total_lines, desc="Importing Relationships") as pbar:
            # We'll read larger batches for relationships, but throttle them
            for batch in read_csv_batch(file_path, batch_size=500):
                # Group by rel_type
                batches_by_type = {}
                for row in batch:
                    rel_type = row.get('rel_type', 'RELATED_TO').replace(' ', '_').upper()
                    if not rel_type:
                        continue
                    if rel_type not in batches_by_type:
                        batches_by_type[rel_type] = []
                    
                    # Ensure node IDs are ints
                    try:
                        row['node_id_start'] = int(row['node_id_start'])
                        row['node_id_end'] = int(row['node_id_end'])
                        batches_by_type[rel_type].append(row)
                    except (ValueError, TypeError):
                        continue

                # Execute for each type
                for rel_type, type_batch in batches_by_type.items():
                    query = f"""
                    UNWIND $batch AS row
                    MATCH (start:ICIJNode {{node_id: row.node_id_start}})
                    MATCH (end:ICIJNode {{node_id: row.node_id_end}})
                    MERGE (start)-[r:`{rel_type}`]->(end)
                    SET r += row, r.imported_at = datetime()
                    """
                    await session.run(query, batch=type_batch)
                
                pbar.update(len(batch))
                await asyncio.sleep(THROTTLE_DELAY)

async def main():
    if not settings.NEO4J_URI or not settings.NEO4J_USER or not settings.NEO4J_PASSWORD:
        logger.error("Neo4j credentials not set in settings. Please configure NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD.")
        return

    logger.info(f"Connecting to Neo4j at {settings.NEO4J_URI}")
    
    driver = AsyncGraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    )

    try:
        # Verify connection
        await driver.verify_connectivity()
        logger.info("Connected successfully.")

        # Create schema
        await create_constraints(driver)
        await create_fulltext_index(driver)

        # check if data dir exists
        if not os.path.exists(DATA_DIR):
             logger.error(f"Data directory '{DATA_DIR}' not found. Please create it and place CSV files there.")
             logger.info(f"Expected files: {', '.join(NODE_FILES.values())}, {RELATIONSHIP_FILE}")
             return

        # Import Nodes
        if not SKIP_NODES:
            for label, filename in NODE_FILES.items():
                await import_nodes(driver, label, filename)
        else:
            logger.info("Skipping node import as SKIP_NODES is True.")

        # Import Relationships
        await import_relationships(driver)

        logger.info("Import complete.")

    except Exception as e:
        logger.error(f"Import failed: {e}")
    finally:
        await driver.close()

if __name__ == "__main__":
    asyncio.run(main())
