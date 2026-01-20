"""
Enhanced Supabase Search Service

Queries Supabase database with enhanced entity fields (40+) including
sanctions reasoning, identifications, addresses, regulations, and timeline.
"""

from typing import List, Dict, Any, Optional
from supabase import Client, create_client
import os
import logging

from src.models.enhanced_responses import (
    EnhancedEntity,
    IdentificationDocument,
    StructuredAddress,
    RegulationDetail,
    TimelineEvent
)

logger = logging.getLogger(__name__)


class EnhancedSupabaseSearchService:
    """Enhanced search service with full entity data"""
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None):
        """
        Initialize enhanced search service
        
        Args:
            supabase_url: Supabase project URL (or from env)
            supabase_key: Supabase service key (or from env)
        """
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_SERVICE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
    
    def search(
        self,
        query: str,
        limit: int = 50,
        search_type: str = "fuzzy",
        include_related: bool = True
    ) -> List[EnhancedEntity]:
        """
        Search for entities with full enhanced data
        
        Args:
            query: Search query
            limit: Maximum results
            search_type: "exact" or "fuzzy"
            include_related: Include identifications, addresses, etc.
        
        Returns:
            List of enhanced entities
        """
        logger.info(f"Enhanced search: query='{query}', type={search_type}, limit={limit}")
        
        # Build query
        if search_type == "fuzzy":
            # Use full-text search on multiple fields
            results = self._fuzzy_search(query, limit)
        else:
            # Exact match on name
            results = self._exact_search(query, limit)
        
        # Convert to enhanced entities
        entities = []
        for row in results:
            entity = self._row_to_enhanced_entity(row, include_related)
            entities.append(entity)
        
        logger.info(f"Found {len(entities)} entities")
        
        return entities
    
    def get_by_id(self, entity_id: str, include_related: bool = True) -> Optional[EnhancedEntity]:
        """
        Get entity by ID with full data
        
        Args:
            entity_id: Entity ID
            include_related: Include related data
        
        Returns:
            Enhanced entity or None
        """
        logger.info(f"Getting entity by ID: {entity_id}")
        
        result = self.client.table('sanctions_entities').select('*').eq(
            'id', entity_id
        ).execute()
        
        if not result.data:
            return None
        
        return self._row_to_enhanced_entity(result.data[0], include_related)
    
    def get_timeline(self, entity_id: str) -> List[TimelineEvent]:
        """
        Get timeline events for entity
        
        Args:
            entity_id: Entity ID
        
        Returns:
            List of timeline events
        """
        logger.info(f"Getting timeline for entity: {entity_id}")
        
        result = self.client.table('entity_timeline_events').select('*').eq(
            'entity_id', entity_id
        ).order('event_date', desc=True).execute()
        
        events = []
        for row in result.data:
            event = TimelineEvent(
                id=row.get('id'),
                event_type=row.get('event_type'),
                event_date=row.get('event_date'),
                event_description=row.get('event_description'),
                regulation_id=row.get('regulation_id'),
                source=row.get('source')
            )
            events.append(event)
        
        return events
    
    def _fuzzy_search(self, query: str, limit: int) -> List[Dict]:
        """Fuzzy search using full-text search"""
        
        # Search on name, full_name, sanctions_reason, and current_position
        # Using pg_trgm similarity
        result = self.client.table('sanctions_entities').select('*').or_(
            f"name.ilike.%{query}%,"
            f"full_name.ilike.%{query}%,"
            f"sanctions_reason.ilike.%{query}%,"
            f"current_position.ilike.%{query}%"
        ).limit(limit).execute()
        
        return result.data
    
    def _exact_search(self, query: str, limit: int) -> List[Dict]:
        """Exact search on name"""
        
        result = self.client.table('sanctions_entities').select('*').eq(
            'name', query
        ).limit(limit).execute()
        
        return result.data
    
    def _row_to_enhanced_entity(
        self,
        row: Dict[str, Any],
        include_related: bool = True
    ) -> EnhancedEntity:
        """
        Convert database row to EnhancedEntity
        
        Args:
            row: Database row
            include_related: Include related data
        
        Returns:
            EnhancedEntity instance
        """
        entity_id = row.get('id')
        
        # Get related data if requested
        identifications = []
        addresses = []
        regulations = []
        timeline_events = []
        
        if include_related and entity_id:
            identifications = self._get_identifications(entity_id)
            addresses = self._get_addresses(entity_id)
            regulations = self._get_regulations(entity_id)
            timeline_events = self._get_timeline_events(entity_id)
        
        # Build enhanced entity
        return EnhancedEntity(
            # Core identity
            id=entity_id,
            external_id=row.get('external_id', entity_id),
            name=row.get('name'),
            full_name=row.get('full_name'),
            first_name=row.get('first_name'),
            middle_name=row.get('middle_name'),
            last_name=row.get('last_name'),
            title=row.get('title'),
            aliases=row.get('aliases', []),
            
            # Classification
            entity_type=row.get('entity_type', 'Unknown'),
            source=row.get('source', 'Unknown'),
            
            # Biographical
            birth_date=row.get('birth_date'),
            birth_place=row.get('birth_place'),
            birth_city=row.get('birth_city'),
            birth_country=row.get('birth_country'),
            gender=row.get('gender'),
            
            # Geographic
            citizenship_countries=row.get('citizenship_countries', []),
            nationalities=row.get('nationalities', []),
            
            # Related data
            identifications=identifications,
            addresses=addresses,
            
            # Professional
            positions=row.get('positions', []),
            current_position=row.get('current_position'),
            business_affiliations=row.get('business_affiliations', []),
            industry_sectors=row.get('industry_sectors', []),
            
            # Sanctions (CRITICAL)
            is_sanctioned=True,  # All entities in this table are sanctioned
            sanctions_reason=row.get('sanctions_reason'),
            sanctions_summary=row.get('sanctions_summary'),
            legal_basis=row.get('legal_basis'),
            legal_articles=row.get('legal_articles', []),
            measures=row.get('measures', []),
            sanction_lists=row.get('sanction_lists', []),
            
            # Regulatory
            regulation_ids=row.get('regulation_ids', []),
            programmes=row.get('programmes', []),
            first_listed_date=row.get('first_listed_date'),
            last_updated_date=row.get('last_updated_date'),
            designation_status=row.get('designation_status', 'Active'),
            
            # Regulations
            regulations=regulations,
            
            # Timeline
            timeline_events=timeline_events,
            
            # Risk
            risk_score=row.get('risk_score'),
            risk_level=row.get('risk_level'),
            risk_factors=row.get('risk_factors', []),
            
            # Metadata
            data_completeness_score=row.get('data_completeness_score', 0),
            last_verified_at=row.get('last_verified_at'),
            source_url=row.get('source_url'),
            updated_at=row.get('updated_at'),
            
            # Match score (default 100 for direct query)
            match_score=100
        )
    
    def _get_identifications(self, entity_id: str) -> List[IdentificationDocument]:
        """Get identification documents for entity"""
        result = self.client.table('entity_identifications').select('*').eq(
            'entity_id', entity_id
        ).execute()
        
        identifications = []
        for row in result.data:
            doc = IdentificationDocument(
                id=row.get('id'),
                document_type=row.get('document_type'),
                document_number=row.get('document_number'),
                issuing_country=row.get('issuing_country'),
                country_code=row.get('country_code'),
                issue_date=row.get('issue_date'),
                expiry_date=row.get('expiry_date'),
                is_verified=row.get('is_verified', False),
                source=row.get('source')
            )
            identifications.append(doc)
        
        return identifications
    
    def _get_addresses(self, entity_id: str) -> List[StructuredAddress]:
        """Get addresses for entity"""
        result = self.client.table('entity_addresses').select('*').eq(
            'entity_id', entity_id
        ).execute()
        
        addresses = []
        for row in result.data:
            addr = StructuredAddress(
                id=row.get('id'),
                full_address=row.get('full_address'),
                street=row.get('street'),
                city=row.get('city'),
                region=row.get('region'),
                postal_code=row.get('postal_code'),
                country=row.get('country'),
                country_code=row.get('country_code'),
                address_type=row.get('address_type'),
                is_primary=row.get('is_primary', False),
                is_current=row.get('is_current', True)
            )
            addresses.append(addr)
        
        return addresses
    
    def _get_regulations(self, entity_id: str) -> List[RegulationDetail]:
        """Get regulations for entity"""
        result = self.client.table('entity_regulations').select('*').eq(
            'entity_id', entity_id
        ).execute()
        
        regulations = []
        for row in result.data:
            reg = RegulationDetail(
                id=row.get('id'),
                regulation_id=row.get('regulation_id'),
                programme=row.get('programme'),
                regulation_type=row.get('regulation_type'),
                entry_into_force_date=row.get('entry_into_force_date'),
                last_amendment_date=row.get('last_amendment_date'),
                publication_date=row.get('publication_date'),
                legal_basis=row.get('legal_basis'),
                remarks=row.get('remarks'),
                official_journal_url=row.get('official_journal_url')
            )
            regulations.append(reg)
        
        return regulations
    
    def _get_timeline_events(self, entity_id: str) -> List[TimelineEvent]:
        """Get timeline events for entity"""
        result = self.client.table('entity_timeline_events').select('*').eq(
            'entity_id', entity_id
        ).order('event_date', desc=True).execute()
        
        events = []
        for row in result.data:
            event = TimelineEvent(
                id=row.get('id'),
                event_type=row.get('event_type'),
                event_date=row.get('event_date'),
                event_description=row.get('event_description'),
                regulation_id=row.get('regulation_id'),
                source=row.get('source')
            )
            events.append(event)
        
        return events


# Singleton instance
_enhanced_search_service = None


def get_enhanced_search_service() -> EnhancedSupabaseSearchService:
    """Get singleton instance of enhanced search service"""
    global _enhanced_search_service
    
    if _enhanced_search_service is None:
        _enhanced_search_service = EnhancedSupabaseSearchService()
    
    return _enhanced_search_service
