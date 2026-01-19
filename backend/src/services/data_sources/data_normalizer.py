"""
Data Normalizer

Converts source-specific formats into a unified entity format
for consistent search and display.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from src.utils.logger import get_logger

logger = get_logger(__name__)


class SanctionsNormalizer:
    """
    Normalizes entities from different sources into unified format.
    
    Unified format:
    {
        'id': str,           # Unique ID (source_uid)
        'name': str,         # Primary display name
        'type': str,         # person/company/vessel/aircraft
        'source': str,       # OFAC/EU/UK/etc
        'sourceCountry': str,
        'listName': str,
        'programs': List[str],
        'aliases': List[str],
        'addresses': List[str],
        'birthDates': List[str],
        'nationalities': List[str],
        'dateAdded': Optional[str],
        'sourceUrl': str,
        'isSanctioned': bool,
        'rawData': dict
    }
    """
    
    def normalize(self, entity: Dict, source: str) -> Dict:
        """
        Normalize entity to unified format.
        
        Args:
            entity: Source-specific entity dict
            source: Source name (OFAC, EU, UK, etc)
            
        Returns:
            Normalized entity dict
        """
        normalizers = {
            'OFAC': self._normalize_ofac,
            'EU': self._normalize_eu,
            'UK': self._normalize_uk,
            'UN': self._normalize_un,
            'Canada': self._normalize_canada,
        }
        
        normalizer = normalizers.get(source)
        if not normalizer:
            raise ValueError(f"Unknown source: {source}")
        
        return normalizer(entity)
    
    def _normalize_ofac(self, entity: Dict) -> Dict:
        """Normalize OFAC SDN entry"""
        
        # Map SDN type to our types
        type_map = {
            'Individual': 'person',
            'Entity': 'company',
            'Vessel': 'vessel',
            'Aircraft': 'aircraft',
        }
        
        # Format addresses as strings
        addresses = []
        for addr in entity.get('addresses', []):
            parts = [
                addr.get('address1'),
                addr.get('city'),
                addr.get('country'),
            ]
            addr_str = ', '.join(p for p in parts if p)
            if addr_str:
                addresses.append(addr_str)
        
        return {
            'id': f"ofac_{entity['uid']}",
            'name': entity['name'],
            'type': type_map.get(entity.get('sdnType', 'Individual'), 'person'),
            'source': 'OFAC SDN List',
            'sourceCountry': 'US',
            'listName': 'Specially Designated Nationals',
            'programs': entity.get('programs', []),
            'aliases': entity.get('aliases', []),
            'addresses': addresses,
            'birthDates': entity.get('dateOfBirth', []),
            'nationalities': entity.get('nationalities', []),
            'dateAdded': None,  # OFAC XML doesn't include this
            'sourceUrl': f"https://sanctionssearch.ofac.treas.gov/Details.aspx?id={entity['uid']}",
            'isSanctioned': True,
            'remarks': entity.get('remarks'),
            'rawData': entity,
        }
    
    def _normalize_eu(self, entity: Dict) -> Dict:
        """Normalize EU sanctions entry"""
        
        type_map = {
            'person': 'person',
            'enterprise': 'company',
        }
        
        # Format addresses
        addresses = []
        for addr in entity.get('addresses', []):
            parts = [
                addr.get('street'),
                addr.get('city'),
                addr.get('country'),
            ]
            addr_str = ', '.join(p for p in parts if p)
            if addr_str:
                addresses.append(addr_str)
        
        # Get earliest regulation date as dateAdded
        date_added = None
        for reg in entity.get('regulations', []):
            pub_date = reg.get('publicationDate')
            if pub_date:
                if date_added is None or pub_date < date_added:
                    date_added = pub_date
        
        return {
            'id': f"eu_{entity.get('logicalId', hash(entity['name']))}",
            'name': entity['name'],
            'type': type_map.get(entity.get('subjectType', 'person'), 'person'),
            'source': 'EU Sanctions',
            'sourceCountry': 'EU',
            'listName': 'EU Consolidated Sanctions',
            'programs': entity.get('programs', []),
            'aliases': entity.get('aliases', []),
            'addresses': addresses,
            'birthDates': entity.get('birthDates', []),
            'nationalities': entity.get('citizenships', []),
            'dateAdded': date_added,
            'sourceUrl': 'https://sanctionsmap.eu/',
            'isSanctioned': True,
            'remarks': '; '.join(entity.get('remarks', [])),
            'rawData': entity,
        }
    
    def _normalize_uk(self, entity: Dict) -> Dict:
        """Normalize UK HM Treasury entry"""
        
        return {
            'id': f"uk_{entity.get('groupID', hash(entity.get('name', '')))}",
            'name': entity.get('name', 'Unknown'),
            'type': 'person' if entity.get('type') == 'Individual' else 'company',
            'source': 'UK HM Treasury',
            'sourceCountry': 'UK',
            'listName': 'UK Sanctions List',
            'programs': [entity.get('regime')] if entity.get('regime') else [],
            'aliases': entity.get('aliases', []),
            'addresses': entity.get('address', []),
            'birthDates': [entity.get('dateOfBirth')] if entity.get('dateOfBirth') else [],
            'nationalities': [entity.get('nationality')] if entity.get('nationality') else [],
            'dateAdded': entity.get('ukSanctionsList'),
            'sourceUrl': 'https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets',
            'isSanctioned': True,
            'rawData': entity,
        }
    
    def _normalize_un(self, entity: Dict) -> Dict:
        """Normalize UN sanctions entry"""
        
        # Build full name from parts
        name_parts = [
            entity.get('firstName'),
            entity.get('secondName'),
            entity.get('thirdName'),
        ]
        name = ' '.join(p for p in name_parts if p).strip() or 'Unknown'
        
        # Extract alias names
        aliases = [
            a.get('name') for a in entity.get('aliases', [])
            if a.get('name')
        ]
        
        return {
            'id': f"un_{entity.get('dataid', hash(name))}",
            'name': name,
            'type': 'person',  # UN list is primarily individuals
            'source': 'UN Sanctions',
            'sourceCountry': 'UN',
            'listName': entity.get('unListType', 'UN Consolidated List'),
            'programs': entity.get('designations', []),
            'aliases': aliases,
            'addresses': [],
            'birthDates': [],
            'nationalities': entity.get('nationalities', []),
            'dateAdded': entity.get('listedOn'),
            'sourceUrl': 'https://www.un.org/securitycouncil/sanctions/information',
            'isSanctioned': True,
            'remarks': entity.get('comments'),
            'rawData': entity,
        }
    
    def _normalize_canada(self, entity: Dict) -> Dict:
        """Normalize Canada SEMA entry"""
        
        names = entity.get('names', [])
        primary_name = names[0] if names else entity.get('item', 'Unknown')
        
        return {
            'id': f"canada_{hash(primary_name)}",
            'name': primary_name,
            'type': 'person',
            'source': 'Canada SEMA',
            'sourceCountry': 'CA',
            'listName': 'Special Economic Measures',
            'programs': [entity.get('schedule')] if entity.get('schedule') else [],
            'aliases': names[1:] if len(names) > 1 else [],
            'addresses': [],
            'birthDates': [],
            'nationalities': [entity.get('country')] if entity.get('country') else [],
            'dateAdded': entity.get('dateListed'),
            'sourceUrl': 'https://www.international.gc.ca/world-monde/international_relations-relations_internationales/sanctions/consolidated-consolide.aspx',
            'isSanctioned': True,
            'rawData': entity,
        }
    
    def normalize_all(self, entities: List[Dict], source: str) -> List[Dict]:
        """Normalize a list of entities"""
        normalized = []
        for entity in entities:
            try:
                normalized.append(self.normalize(entity, source))
            except Exception as e:
                logger.warning(
                    "normalize_entity_error",
                    source=source,
                    error=str(e)
                )
        return normalized
