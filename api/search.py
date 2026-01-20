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
            
            # Search Neo4j for offshore leaks
            offshore_results = []
            offshore_error = None
            
            if "offshore_leaks" in body.get('sources', []):
                try:
                    from neo4j import GraphDatabase
                    
                    neo4j_uri = os.getenv('NEO4J_URI')
                    neo4j_user = os.getenv('NEO4J_USER')
                    neo4j_password = os.getenv('NEO4J_PASSWORD')
                    
                    if not all([neo4j_uri, neo4j_user, neo4j_password]):
                        raise Exception("Neo4j not configured")
                    
                    driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
                    
                    with driver.session() as session:
                        # Search for nodes matching the query
                        cypher_query = """
                        MATCH (n)
                        WHERE toLower(n.name) CONTAINS toLower($query)
                        RETURN 
                            id(n) as node_id,
                            n.name as name,
                            labels(n)[0] as node_type,
                            n.countries as countries,
                            n.jurisdiction as jurisdiction,
                            n.jurisdiction_description as jurisdiction_description,
                            n.incorporation_date as incorporation_date,
                            n.service_provider as service_provider,
                            n.company_type as company_type,
                            n.status as status,
                            n.address as address,
                            n.sourceID as source_dataset,
                            size((n)--()) as connections_count
                        LIMIT $limit
                        """
                        
                        result = session.run(cypher_query, query=query, limit=body.get('limit', 10))
                        
                        for record in result:
                            offshore_results.append({
                                "node_id": record["node_id"],
                                "name": record["name"] or "Unknown",
                                "node_type": record["node_type"] or "Entity",
                                "countries": record["countries"] or [],
                                "jurisdiction": record["jurisdiction"],
                                "jurisdiction_description": record["jurisdiction_description"],
                                "incorporation_date": record["incorporation_date"],
                                "service_provider": record["service_provider"],
                                "company_type": record["company_type"],
                                "status": record["status"],
                                "address": record["address"],
                                "source_dataset": record["source_dataset"] or "Offshore Leaks",
                                "connections_count": record["connections_count"] or 0,
                                "connections": [],
                                "match_score": 75,
                                "source": "offshore_leaks"
                            })
                    
                    driver.close()
                    
                except Exception as e:
                    offshore_error = str(e)
            
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
