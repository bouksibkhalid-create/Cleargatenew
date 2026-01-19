
import asyncio
import os
import sys
from pathlib import Path
from neo4j import AsyncGraphDatabase

# Add backend to path to import settings
sys.path.append(str(Path(__file__).resolve().parents[2]))
from src.config.settings import settings

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def verify_counts(driver):
    """Verify node and relationship counts."""
    async with driver.session() as session:
        logger.info("--- Verifying Node Counts ---")
        labels = ["Officer", "Entity", "Intermediary", "Address", "Other"]
        total_nodes = 0
        for label in labels:
            result = await session.run(f"MATCH (n:{label}) RETURN count(n) as count")
            record = await result.single()
            count = record["count"]
            logger.info(f"{label}: {count:,}")
            total_nodes += count
        logger.info(f"TOTAL NODES: {total_nodes:,}")
        
        logger.info("\n--- Verifying Relationship Counts ---")
        result = await session.run("MATCH ()-[r]->() RETURN count(r) as count")
        record = await result.single()
        rel_count = record["count"]
        logger.info(f"TOTAL RELATIONSHIPS: {rel_count:,}")

        return total_nodes > 0

async def verify_search(driver):
    """Verify full-text search works."""
    async with driver.session() as session:
        logger.info("\n--- Verifying Search ---")
        # Check if index exists
        idx_check = await session.run("SHOW INDEXES WHERE name = 'offshore_fulltext'")
        if not await idx_check.single():
            logger.error("❌ Full-text index 'offshore_fulltext' MISSING")
            return False
            
        logger.info("✅ Full-text index found")
        
        # Test search if there is data
        count_res = await session.run("MATCH (n) RETURN count(n) as count")
        count = (await count_res.single())["count"]
        
        if count > 0:
            # Try a generic search term likely to exist if data is real, or just return top 1
            # We'll just search for something generic or simply check if the procedure call works
            try:
                query = """
                CALL db.index.fulltext.queryNodes("offshore_fulltext", "limited") 
                YIELD node, score 
                RETURN node.name, labels(node), score 
                LIMIT 5
                """
                result = await session.run(query)
                records = await result.fetch(5)
                logger.info(f"Search test result count: {len(records)}")
                for r in records:
                    logger.info(f" - Found: {r['node.name']} ({r['labels(node)']}) Score: {r['score']:.2f}")
                logger.info("✅ Search query execution successful")
            except Exception as e:
                logger.error(f"❌ Search query failed: {e}")
                return False
        else:
            logger.warning("⚠️ Database is empty, skipping search test details")
            
        return True

async def main():
    if not settings.NEO4J_URI or not settings.NEO4J_USER:
        logger.error("Neo4j credentials not found in settings")
        return

    driver = AsyncGraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    )

    try:
        await driver.verify_connectivity()
        logger.info("Connected to Neo4j.")
        
        has_data = await verify_counts(driver)
        search_ok = await verify_search(driver)
        
        if has_data and search_ok:
            logger.info("\n✅ DATA VERIFICATION SUCCESSFUL")
        elif not has_data:
            logger.warning("\n⚠️ DATABASE APPEARS EMPTY")
        else:
            logger.error("\n❌ VERIFICATION FAILED")

    except Exception as e:
        logger.error(f"Verification failed: {e}")
    finally:
        await driver.close()

if __name__ == "__main__":
    asyncio.run(main())
