"""
Enhanced Base Parser for Comprehensive Entity Data Extraction

This module provides the foundation for extracting all available fields
from sanctions data sources, going beyond basic name/date extraction to
capture biographical data, identifications, professional information,
and detailed sanctions reasoning.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from datetime import date, datetime
import logging

logger = logging.getLogger(__name__)


class EnhancedBaseParser(ABC):
    """
    Enhanced base parser with comprehensive field extraction capabilities.
    
    Extracts 40+ fields per entity including:
    - Core identity (names, aliases, type)
    - Biographical data (birth info, gender, title)
    - Identification documents (passports, IDs)
    - Geographic data (addresses, nationalities)
    - Professional information (positions, affiliations)
    - Sanctions details (reasoning, legal basis, measures)
    - Regulatory data (programmes, regulations, dates)
    - Timeline events (listing, updates, amendments)
    """
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.logger = logging.getLogger(self.__class__.__name__)
        self.stats = {
            'total_entities': 0,
            'successfully_parsed': 0,
            'failed': 0,
            'fields_extracted': {},
            'fields_missing': {}
        }
    
    @abstractmethod
    def parse(self) -> List[Dict[str, Any]]:
        """Parse file and return list of enhanced entity dictionaries"""
        pass
    
    def extract_biographical_data(self, element: Any) -> Dict[str, Any]:
        """
        Extract comprehensive biographical information
        
        Returns:
            {
                'first_name': str,
                'middle_name': str,
                'last_name': str,
                'full_name': str,
                'birth_date': str (ISO format),
                'birth_place': str,
                'birth_city': str,
                'birth_country': str,
                'gender': 'M' | 'F' | 'Other',
                'title': str (Mr, Mrs, Dr, etc.)
            }
        """
        return {
            'first_name': None,
            'middle_name': None,
            'last_name': None,
            'full_name': None,
            'birth_date': None,
            'birth_place': None,
            'birth_city': None,
            'birth_country': None,
            'gender': None,
            'title': None
        }
    
    def extract_identifications(self, element: Any) -> List[Dict[str, Any]]:
        """
        Extract identification documents (passports, IDs, tax numbers)
        
        Returns:
            [{
                'document_type': str,
                'document_number': str,
                'issuing_country': str,
                'issue_date': str,
                'expiry_date': str
            }, ...]
        """
        return []
    
    def extract_addresses(self, element: Any) -> List[Dict[str, Any]]:
        """
        Extract structured address information
        
        Returns:
            [{
                'full_address': str,
                'street': str,
                'city': str,
                'region': str,
                'postal_code': str,
                'country': str,
                'country_code': str,
                'address_type': str,
                'is_primary': bool,
                'is_current': bool
            }, ...]
        """
        return []
    
    def extract_professional_info(self, element: Any) -> Dict[str, Any]:
        """
        Extract professional/business information
        
        Returns:
            {
                'positions': [str],
                'current_position': str,
                'business_affiliations': [str],
                'industry_sectors': [str]
            }
        """
        return {
            'positions': [],
            'current_position': None,
            'business_affiliations': [],
            'industry_sectors': []
        }
    
    def extract_sanctions_details(self, element: Any) -> Dict[str, Any]:
        """
        Extract detailed sanctions information including reasoning
        
        Returns:
            {
                'sanctions_reason': str (full text explanation),
                'sanctions_summary': str (brief summary),
                'legal_basis': str,
                'legal_articles': [str],
                'measures': [str] (Asset Freeze, Travel Ban, etc.),
                'programmes': [str]
            }
        """
        return {
            'sanctions_reason': None,
            'sanctions_summary': None,
            'legal_basis': None,
            'legal_articles': [],
            'measures': [],
            'programmes': []
        }
    
    def extract_regulatory_data(self, element: Any) -> List[Dict[str, Any]]:
        """
        Extract regulation/programme details
        
        Returns:
            [{
                'regulation_id': str,
                'programme': str,
                'regulation_type': str,
                'entry_into_force_date': str,
                'last_amendment_date': str,
                'publication_date': str,
                'legal_basis': str,
                'remarks': str,
                'official_journal_url': str
            }, ...]
        """
        return []
    
    def build_timeline_events(self, regulations: List[Dict]) -> List[Dict[str, Any]]:
        """
        Build timeline events from regulations and other data
        
        Returns:
            [{
                'event_type': 'Listed' | 'Updated' | 'Amended' | 'Delisted',
                'event_date': str,
                'event_description': str,
                'regulation_id': str,
                'source': str
            }, ...]
        """
        events = []
        
        for reg in regulations:
            if reg.get('entry_into_force_date'):
                events.append({
                    'event_type': 'Listed',
                    'event_date': reg['entry_into_force_date'],
                    'event_description': f"Added to {reg.get('programme', 'sanctions')} list",
                    'regulation_id': reg.get('regulation_id'),
                    'source': self.__class__.__name__
                })
            
            if reg.get('last_amendment_date'):
                events.append({
                    'event_type': 'Amended',
                    'event_date': reg['last_amendment_date'],
                    'event_description': f"Regulation {reg.get('regulation_id')} amended",
                    'regulation_id': reg.get('regulation_id'),
                    'source': self.__class__.__name__
                })
        
        # Sort by date
        events.sort(key=lambda x: x['event_date'])
        
        return events
    
    def calculate_completeness_score(self, entity_dict: Dict) -> int:
        """
        Calculate how complete the entity data is (0-100)
        
        Checks 40 important fields and calculates percentage populated.
        """
        important_fields = [
            # Core (5)
            'name', 'entity_type', 'external_id', 'source', 'is_sanctioned',
            # Biographical (6)
            'first_name', 'last_name', 'birth_date', 'birth_place', 'gender', 'title',
            # Geographic (3)
            'nationalities', 'citizenship_countries', 'addresses',
            # Professional (3)
            'positions', 'current_position', 'business_affiliations',
            # Sanctions (6)
            'sanctions_reason', 'sanctions_summary', 'legal_basis', 
            'measures', 'programmes', 'sanction_lists',
            # Regulatory (5)
            'regulation_ids', 'first_listed_date', 'last_updated_date',
            'designation_status', 'regulations',
            # Identification (2)
            'identifications', 'aliases',
            # Timeline (1)
            'timeline_events',
            # Metadata (3)
            'source_url', 'data_completeness_score', 'updated_at'
        ]
        
        populated_fields = 0
        for field in important_fields:
            value = entity_dict.get(field)
            # Count as populated if not None, empty list, empty string, or empty dict
            if value not in [None, [], '', {}]:
                populated_fields += 1
        
        score = int((populated_fields / len(important_fields)) * 100)
        return score
    
    def track_field_extraction(self, field_name: str, extracted: bool):
        """Track which fields were successfully extracted for statistics"""
        if extracted:
            self.stats['fields_extracted'][field_name] = \
                self.stats['fields_extracted'].get(field_name, 0) + 1
        else:
            self.stats['fields_missing'][field_name] = \
                self.stats['fields_missing'].get(field_name, 0) + 1
    
    def get_statistics(self) -> Dict:
        """Return detailed parsing statistics"""
        total = self.stats['total_entities']
        
        return {
            **self.stats,
            'success_rate': (self.stats['successfully_parsed'] / total * 100)
                           if total > 0 else 0,
            'field_extraction_rates': {
                field: (self.stats['fields_extracted'].get(field, 0) / total * 100)
                for field in self.stats['fields_extracted'].keys()
            } if total > 0 else {}
        }
    
    def generate_external_id(self, entity_dict: Dict) -> str:
        """
        Generate unique external ID for entity
        
        Uses name + birth date for uniqueness, or hash if no birth date
        """
        import hashlib
        
        name = entity_dict.get('name', 'unknown').lower().replace(' ', '_')
        birth_date = entity_dict.get('birth_date', '')
        source = entity_dict.get('source', 'unknown')
        
        if birth_date:
            return f"{source}-{name}-{birth_date}"
        else:
            # Use hash of full entity data
            data_str = str(entity_dict)
            hash_val = hashlib.md5(data_str.encode()).hexdigest()[:8]
            return f"{source}-{name}-{hash_val}"
