#!/usr/bin/env python3
"""
Neo4j Offshore Leaks Diagnostic Script
Systematically tests Neo4j connection and data availability
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.utils.neo4j_client import Neo4jClient
from src.services.offshore_service import OffshoreLeaksService
from src.utils.logger import get_logger

logger = get_logger(__name__)

async def test_connection():
    """Test basic Neo4j connection"""
    print("\n" + "="*60)
    print("PHASE 1: CONNECTION TEST")
    print("="*60)
    
    try:
        client = Neo4jClient()
        print(f"✅ Client initialized")
        print(f"   URI: {client.uri}")
        print(f"   User: {client.user}")
        
        await client.connect()
        print(f"✅ Connection established")
        
        await client.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

async def test_data_count():
    """Test if database has data"""
    print("\n" + "="*60)
    print("PHASE 2: DATA EXISTENCE TEST")
    print("="*60)
    
    try:
        client = Neo4jClient()
        await client.connect()
        
        # Count total nodes
        result = await client.execute_read("MATCH (n) RETURN count(n) as total")
        total = result[0]['total'] if result else 0
        print(f"✅ Total nodes in database: {total:,}")
        
        # Count by label
        result = await client.execute_read("""
            MATCH (n)
            RETURN labels(n)[0] as label, count(*) as count
            ORDER BY count DESC
            LIMIT 10
        """)
        
        print("\n📊 Top node labels:")
        for record in result:
            print(f"   {record['label']}: {record['count']:,}")
        
        await client.close()
        return total > 0
    except Exception as e:
        print(f"❌ Data query failed: {e}")
        return False

async def test_indexes():
    """Test if full-text index exists"""
    print("\n" + "="*60)
    print("PHASE 3: INDEX TEST")
    print("="*60)
    
    try:
        client = Neo4jClient()
        await client.connect()
        
        result = await client.execute_read("SHOW INDEXES")
        
        print(f"✅ Found {len(result)} indexes:")
        offshore_index_found = False
        for idx in result:
            index_name = idx.get('name', 'unknown')
            index_type = idx.get('type', 'unknown')
            print(f"   - {index_name} ({index_type})")
            if 'offshore' in index_name.lower():
                offshore_index_found = True
        
        if not offshore_index_found:
            print("\n⚠️  WARNING: 'offshore_fulltext' index not found!")
            print("   This is likely why searches are failing.")
        
        await client.close()
        return offshore_index_found
    except Exception as e:
        print(f"❌ Index query failed: {e}")
        return False

async def test_fulltext_search():
    """Test full-text search directly"""
    print("\n" + "="*60)
    print("PHASE 4: FULL-TEXT SEARCH TEST")
    print("="*60)
    
    try:
        client = Neo4jClient()
        await client.connect()
        
        query = """
        CALL db.index.fulltext.queryNodes('offshore_fulltext', $search_term)
        YIELD node, score
        RETURN node.name as name, labels(node)[0] as type, score
        ORDER BY score DESC
        LIMIT 5
        """
        
        result = await client.execute_read(query, {"search_term": "Putin"})
        
        if result:
            print(f"✅ Full-text search returned {len(result)} results:")
            for r in result:
                print(f"   - {r['name']} ({r['type']}) - score: {r['score']:.2f}")
        else:
            print("⚠️  Full-text search returned no results")
        
        await client.close()
        return len(result) > 0
    except Exception as e:
        print(f"❌ Full-text search failed: {e}")
        print(f"   Error type: {type(e).__name__}")
        return False

async def test_offshore_service():
    """Test OffshoreLeaksService"""
    print("\n" + "="*60)
    print("PHASE 5: OFFSHORE SERVICE TEST")
    print("="*60)
    
    try:
        service = OffshoreLeaksService()
        results = await service.search("Putin", limit=5)
        
        if results:
            print(f"✅ Service returned {len(results)} results:")
            for entity in results:
                print(f"   - {entity.name} ({entity.node_type})")
                print(f"     Connections: {entity.connections_count}")
        else:
            print("⚠️  Service returned no results")
        
        return len(results) > 0
    except Exception as e:
        print(f"❌ Service test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all diagnostic tests"""
    print("\n🔍 NEO4J OFFSHORE LEAKS DIAGNOSTIC")
    print("="*60)
    
    results = {
        "connection": await test_connection(),
        "data": await test_data_count(),
        "indexes": await test_indexes(),
        "fulltext": await test_fulltext_search(),
        "service": await test_offshore_service()
    }
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test.upper()}")
    
    print("\n" + "="*60)
    
    if not results["indexes"]:
        print("\n💡 RECOMMENDATION:")
        print("Create the full-text index with:")
        print("""
CREATE FULLTEXT INDEX offshore_fulltext IF NOT EXISTS
FOR (n:Officer|Entity|Intermediary|Address|Other)
ON EACH [n.name, n.address, n.countries, n.jurisdiction_description]
        """)
    
    return all(results.values())

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
