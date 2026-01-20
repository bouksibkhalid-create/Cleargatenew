"""
Supabase Search Service

Provides search functionality against the Supabase PostgreSQL database
with fuzzy matching using pg_trgm.
"""

from typing import Dict, List, Optional
from src.services.supabase_client import get_supabase_client
from src.utils.logger import get_logger

logger = get_logger(__name__)


class SupabaseSearchService:
    """
    Search sanctions data from Supabase PostgreSQL.
    
    Uses pg_trgm for fuzzy matching with trigram similarity.
    """
    
    def __init__(self, fuzzy_threshold: float = 0.3):
        """
        Initialize search service.
        
        Args:
            fuzzy_threshold: Minimum similarity score (0.0-1.0) for fuzzy matches
        """
        self.fuzzy_threshold = fuzzy_threshold
        self._client = None
    
    @property
    def client(self):
        if self._client is None:
            self._client = get_supabase_client()
        return self._client
    
    def search(
        self,
        query: str,
        sources: List[str] = None,
        limit: int = 50,
        fuzzy: bool = True
    ) -> List[Dict]:
        """
        Search sanctions entities using fuzzy matching.
        
        Args:
            query: Search query (name)
            sources: List of sources to filter (e.g., ['OFAC SDN List', 'EU Sanctions'])
            limit: Max results to return
            fuzzy: Enable fuzzy matching (uses trigram similarity)
            
        Returns:
            List of matching entities with match scores
        """
        try:
            # Use the search_sanctions RPC function
            response = self.client.rpc(
                'search_sanctions',
                {
                    'search_query': query,
                    'similarity_threshold': self.fuzzy_threshold if fuzzy else 0.9,
                    'result_limit': limit
                }
            ).execute()
            
            results = response.data or []
            
            # Filter by source if specified
            if sources:
                results = [r for r in results if r.get('source') in sources]
            
            # Convert match_score from 0-1 to 0-100 for compatibility
            for result in results:
                if 'match_score' in result:
                    result['matchScore'] = int(result['match_score'] * 100)
            
            logger.info(
                "supabase_search_complete",
                query=query,
                results=len(results),
                fuzzy=fuzzy
            )
            
            return results
            
        except Exception as e:
            logger.error(
                "supabase_search_error",
                query=query,
                error=str(e)
            )
            raise
    
    def get_entity_by_id(self, entity_id: str) -> Optional[Dict]:
        """Get a specific entity by source_id"""
        try:
            response = self.client.table('sanctions_entities').select('*').eq(
                'source_id', entity_id
            ).single().execute()
            
            return response.data
        except Exception as e:
            logger.warning(
                "supabase_get_entity_error",
                entity_id=entity_id,
                error=str(e)
            )
            return None
    
    def get_entity_aliases(self, entity_uuid: str) -> List[str]:
        """Get aliases for an entity"""
        try:
            response = self.client.table('sanctions_aliases').select('alias').eq(
                'entity_id', entity_uuid
            ).execute()
            
            return [r['alias'] for r in (response.data or [])]
        except Exception as e:
            logger.warning(
                "supabase_get_aliases_error",
                entity_uuid=entity_uuid,
                error=str(e)
            )
            return []
    
    def get_stats(self) -> Dict[str, int]:
        """Get entity counts per source"""
        try:
            response = self.client.table('sanctions_sources').select(
                'name, entity_count'
            ).execute()
            
            return {
                r['name']: r['entity_count'] 
                for r in (response.data or [])
            }
        except Exception as e:
            logger.error("supabase_get_stats_error", error=str(e))
            return {}
    
    def upsert_entity(self, entity: Dict) -> Optional[str]:
        """
        Insert or update an entity.
        
        Args:
            entity: Normalized entity dict
            
        Returns:
            Entity UUID if successful
        """
        try:
            # Prepare entity record
            record = {
                'source_id': entity['id'],
                'name': entity['name'],
                'name_normalized': entity['name'].lower(),
                'entity_type': entity.get('type', 'person'),
                'source': entity.get('source', 'Unknown'),
                'source_country': entity.get('sourceCountry', 'XX'),
                'list_name': entity.get('listName'),
                'programs': entity.get('programs', []),
                'addresses': entity.get('addresses', []),
                'birth_dates': entity.get('birthDates', []),
                'nationalities': entity.get('nationalities', []),
                'date_added': entity.get('dateAdded'),
                'source_url': entity.get('sourceUrl'),
                'remarks': entity.get('remarks'),
                'raw_data': entity.get('rawData'),
            }
            
            # Upsert entity
            response = self.client.table('sanctions_entities').upsert(
                record,
                on_conflict='source_id'
            ).execute()
            
            if response.data:
                entity_uuid = response.data[0]['id']
                
                # Upsert aliases
                aliases = entity.get('aliases', [])
                if aliases:
                    alias_records = [
                        {
                            'entity_id': entity_uuid,
                            'alias': alias,
                            'alias_normalized': alias.lower()
                        }
                        for alias in aliases if alias
                    ]
                    
                    # Delete existing aliases and insert new ones
                    self.client.table('sanctions_aliases').delete().eq(
                        'entity_id', entity_uuid
                    ).execute()
                    
                    if alias_records:
                        self.client.table('sanctions_aliases').insert(
                            alias_records
                        ).execute()
                
                return entity_uuid
            
            return None
            
        except Exception as e:
            logger.error(
                "supabase_upsert_error",
                entity_id=entity.get('id'),
                error=str(e)
            )
            raise
    
    def bulk_upsert_entities(self, entities: List[Dict], source: str) -> int:
        """
        Bulk insert/update entities for a source.
        
        Args:
            entities: List of normalized entity dicts
            source: Source name (e.g., 'OFAC SDN List')
            
        Returns:
            Number of entities upserted
        """
        count = 0
        batch_size = 100
        
        for i in range(0, len(entities), batch_size):
            batch = entities[i:i + batch_size]
            
            # Prepare records
            records = []
            for entity in batch:
                records.append({
                    'source_id': entity['id'],
                    'name': entity['name'],
                    'name_normalized': entity['name'].lower(),
                    'entity_type': entity.get('type', 'person'),
                    'source': entity.get('source', source),
                    'source_country': entity.get('sourceCountry', 'XX'),
                    'list_name': entity.get('listName'),
                    'programs': entity.get('programs', []),
                    'addresses': entity.get('addresses', []),
                    'birth_dates': entity.get('birthDates', []),
                    'nationalities': entity.get('nationalities', []),
                    'date_added': entity.get('dateAdded'),
                    'source_url': entity.get('sourceUrl'),
                    'remarks': entity.get('remarks'),
                    'raw_data': entity.get('rawData'),
                })
            
            try:
                response = self.client.table('sanctions_entities').upsert(
                    records,
                    on_conflict='source_id'
                ).execute()
                
                count += len(response.data or [])
                
                # Handle aliases for this batch
                for j, entity in enumerate(batch):
                    if response.data and j < len(response.data):
                        entity_uuid = response.data[j]['id']
                        aliases = entity.get('aliases', [])
                        
                        if aliases:
                            alias_records = [
                                {
                                    'entity_id': entity_uuid,
                                    'alias': alias,
                                    'alias_normalized': alias.lower()
                                }
                                for alias in aliases if alias
                            ]
                            
                            # Delete and insert aliases
                            self.client.table('sanctions_aliases').delete().eq(
                                'entity_id', entity_uuid
                            ).execute()
                            
                            if alias_records:
                                self.client.table('sanctions_aliases').insert(
                                    alias_records
                                ).execute()
                
            except Exception as e:
                logger.error(
                    "supabase_bulk_upsert_error",
                    batch_start=i,
                    error=str(e)
                )
        
        # Update source stats
        try:
            self.client.table('sanctions_sources').update({
                'entity_count': count,
                'status': 'active',
                'last_synced_at': 'now()'
            }).eq('name', source).execute()
        except Exception as e:
            logger.warning("supabase_update_source_stats_error", error=str(e))
        
        logger.info(
            "supabase_bulk_upsert_complete",
            source=source,
            count=count
        )
        
        return count


# Singleton instance
_supabase_search_service: Optional[SupabaseSearchService] = None


def get_supabase_search_service() -> SupabaseSearchService:
    """Get singleton instance"""
    global _supabase_search_service
    if _supabase_search_service is None:
        _supabase_search_service = SupabaseSearchService()
    return _supabase_search_service
