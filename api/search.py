from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            # Read request
            content_length = int(self.headers.get('Content-Length', 0))
            body_str = self.rfile.read(content_length).decode('utf-8')
            body = json.loads(body_str) if body_str else {}
            
            query = body.get('query', '')
            
            # Try to use Supabase
            try:
                from supabase import create_client
                
                supabase_url = os.getenv('SUPABASE_URL')
                supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')
                
                if not supabase_url or not supabase_key:
                    raise Exception(f"Supabase not configured. URL: {bool(supabase_url)}, Key: {bool(supabase_key)}")
                
                client = create_client(supabase_url, supabase_key)
                
                # Search using RPC function
                response = client.rpc(
                    'search_sanctions',
                    {
                        'search_query': query,
                        'similarity_threshold': 0.3,
                        'result_limit': body.get('limit', 50)
                    }
                ).execute()
                
                results = response.data or []
                
                # Convert to expected format
                entities = []
                for r in results:
                    entities.append({
                        "id": r.get('source_id', r.get('id', '')),
                        "name": r.get('name', 'Unknown'),
                        "schema": "Person",
                        "aliases": r.get('aliases', []),
                        "birth_date": None,
                        "death_date": None,
                        "nationalities": r.get('nationalities', []),
                        "countries": r.get('nationalities', []),
                        "is_sanctioned": True,
                        "sanction_programs": [{
                            "program": prog,
                            "authority": r.get('source', 'Unknown'),
                            "start_date": r.get('date_added'),
                            "reason": None
                        } for prog in r.get('programs', [])],
                        "datasets": [r.get('source', 'Supabase')],
                        "properties": {
                            "description": f"Sanctioned entity from {r.get('source', 'database')}"
                        },
                        "first_seen": r.get('date_added'),
                        "last_seen": None,
                        "url": r.get('source_url', 'https://supabase.co'),
                        "match_score": int(r.get('match_score', 0.5) * 100),
                        "source": "opensanctions"
                    })
                
                supabase_error = None
                
            except Exception as e:
                entities = []
                supabase_error = str(e)
            
            # Search Neo4j for offshore leaks (always)
            offshore_results = []
            offshore_error = None
            
            try:
                from neo4j import GraphDatabase
                
                neo4j_uri = os.getenv('NEO4J_URI')
                neo4j_user = os.getenv('NEO4J_USER')
                neo4j_password = os.getenv('NEO4J_PASSWORD')
                
                print(f"Neo4j Config - URI: {bool(neo4j_uri)}, User: {bool(neo4j_user)}, Pass: {bool(neo4j_password)}")
                
                if not all([neo4j_uri, neo4j_user, neo4j_password]):
                    raise Exception(f"Neo4j not configured - URI: {bool(neo4j_uri)}, User: {bool(neo4j_user)}, Pass: {bool(neo4j_password)}")
                
                print(f"Connecting to Neo4j: {neo4j_uri}")
                driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
                
                # Verify connection
                driver.verify_connectivity()
                print("Neo4j connection verified")
                
                with driver.session() as session:
                    # Query with connection count (Neo4j 5+ syntax)
                    cypher_query = """
                    MATCH (n)
                    WHERE toLower(n.name) CONTAINS toLower($search_term)
                    RETURN 
                        id(n) as node_id,
                        n.name as name,
                        labels(n)[0] as node_type,
                        coalesce(n.countries, []) as countries,
                        n.jurisdiction as jurisdiction,
                        n.address as address,
                        coalesce(n.sourceID, 'Offshore Leaks') as source_dataset,
                        COUNT { (n)--() } as connections_count
                    LIMIT $limit
                    """
                    
                    print(f"Running Neo4j query for: '{query}' with limit: {body.get('limit', 10)}")
                    result = session.run(cypher_query, search_term=query, limit=body.get('limit', 10))
                    
                    count = 0
                    for record in result:
                        count += 1
                        node_type = record.get("node_type", "Entity")
                        offshore_results.append({
                            "node_id": record["node_id"],
                            "name": record.get("name") or "Unknown",
                            "node_type": node_type,
                            "countries": record.get("countries") or [],
                            "jurisdiction": record.get("jurisdiction"),
                            "jurisdiction_description": None,
                            "incorporation_date": None,
                            "service_provider": None,
                            "company_type": None,
                            "status": None,
                            "address": record.get("address"),
                            "source_dataset": record.get("source_dataset") or "Offshore Leaks",
                            "connections_count": record.get("connections_count") or 0,
                            "connections": [],
                            "match_score": 75,
                            "source": "offshore_leaks"
                        })
                    
                    print(f"Neo4j returned {count} results")
                
                driver.close()
                print("Neo4j connection closed")
                
            except Exception as e:
                import traceback
                offshore_error = str(e)
                error_trace = traceback.format_exc()
                print(f"Neo4j Error: {str(e)}")
                print(f"Traceback: {error_trace}")
            
            # Build response
            response_data = {
                "query": query,
                "search_type": body.get('search_type', 'exact'),
                "results_by_source": {
                    "opensanctions": {
                        "found": len(entities) > 0,
                        "count": len(entities),
                        "sanctioned_count": len(entities),
                        "error": supabase_error,
                        "results": entities
                    },
                    "sanctions_io": {
                        "found": False,
                        "count": 0,
                        "sanctioned_count": 0,
                        "error": "Not configured",
                        "results": []
                    },
                    "offshore_leaks": {
                        "found": len(offshore_results) > 0,
                        "count": len(offshore_results),
                        "sanctioned_count": 0,
                        "error": offshore_error,
                        "results": offshore_results
                    }
                },
                "all_results": entities + offshore_results,
                "total_results": len(entities) + len(offshore_results),
                "total_sanctioned": len(entities),
                "offshore_connections_found": len(offshore_results) > 0,
                "sources_searched": body.get('sources', ["opensanctions"]),
                "sources_succeeded": ["opensanctions"] if not supabase_error else [],
                "sources_failed": [] if not supabase_error else ["opensanctions"],
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "fuzzy_threshold": body.get('fuzzy_threshold', 80)
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            
        except Exception as e:
            import traceback
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": "InternalError",
                "message": str(e),
                "traceback": traceback.format_exc(),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }).encode('utf-8'))

    def do_GET(self):
        self.do_POST()
