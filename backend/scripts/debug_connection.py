
import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

def verify_ssc():
    # Force SSC scheme
    original_uri = os.getenv("NEO4J_URI")
    uri = original_uri.replace("neo4j+s://", "neo4j+ssc://")
    
    user = os.getenv("NEO4J_USER")
    password = os.getenv("NEO4J_PASSWORD")
    
    print(f"Connecting to: {uri} (SSC Fallback)")
    
    try:
        with GraphDatabase.driver(uri, auth=(user, password)) as driver:
            driver.verify_connectivity()
            print("Connectivity verification passed.")
            
            with driver.session() as session:
                # Test Read
                result = session.run("RETURN 1 as test")
                record = result.single()
                print(f"Read Test Result: {record['test']}")
                
                # Test Write
                print("Testing Write permission...")
                session.run("create (n:TestWrite {id: 1}) delete n")
                print("Write Test Result: SUCCESS")
                
        print("✅ SSC Connection SUCCESS!")
        return True
        
    except Exception as e:
        print(f"❌ SSC Connection FAILED: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    verify_ssc()
