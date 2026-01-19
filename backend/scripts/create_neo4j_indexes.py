#!/usr/bin/env python3
"""
Create required Neo4j indexes for Offshore Leaks search.

Run this script once after setting up Neo4j:
    python scripts/create_neo4j_indexes.py

Requirements:
    - NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD in environment
"""

import asyncio
import os
import sys

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.utils.neo4j_client import Neo4jClient
from src.utils.logger import get_logger

logger = get_logger(__name__)


async def create_indexes():
    """Create all required Neo4j indexes"""
    
    client = Neo4jClient()
    
    try:
        await client.connect()
        logger.info("Connected to Neo4j")
        
        # Define indexes to create
        indexes = [
            {
                "name": "offshore_fulltext",
                "query": """
                    CREATE FULLTEXT INDEX offshore_fulltext IF NOT EXISTS
                    FOR (n:Officer|Entity|Intermediary|Address)
                    ON EACH [n.name, n.address, n.countries]
                """,
                "description": "Full-text search on names, addresses, countries"
            },
            {
                "name": "node_name_index",
                "query": """
                    CREATE INDEX node_name_index IF NOT EXISTS
                    FOR (n:Entity) ON (n.name)
                """,
                "description": "B-tree index on Entity names"
            },
            {
                "name": "officer_name_index", 
                "query": """
                    CREATE INDEX officer_name_index IF NOT EXISTS
                    FOR (n:Officer) ON (n.name)
                """,
                "description": "B-tree index on Officer names"
            }
        ]
        
        # Create each index
        for index in indexes:
            try:
                await client.execute_write(index["query"])
                logger.info(f"Created index: {index['name']} - {index['description']}")
                print(f"✅ {index['name']}: {index['description']}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    logger.info(f"Index already exists: {index['name']}")
                    print(f"⏭️  {index['name']}: Already exists")
                else:
                    logger.error(f"Failed to create index {index['name']}: {e}")
                    print(f"❌ {index['name']}: {e}")
        
        # Verify indexes
        print("\n📊 Verifying indexes...")
        verify_query = "SHOW INDEXES YIELD name, type, state"
        results = await client.execute_read(verify_query)
        
        print("\nCurrent indexes:")
        for result in results:
            status = "✅" if result.get("state") == "ONLINE" else "⏳"
            print(f"  {status} {result.get('name')} ({result.get('type')}) - {result.get('state')}")
        
        print("\n✅ Index creation complete!")
        
    except Exception as e:
        logger.error(f"Index creation failed: {e}")
        print(f"\n❌ Error: {e}")
        sys.exit(1)
        
    finally:
        await client.close()


if __name__ == "__main__":
    print("🔧 Creating Neo4j indexes for Offshore Leaks...\n")
    asyncio.run(create_indexes())
