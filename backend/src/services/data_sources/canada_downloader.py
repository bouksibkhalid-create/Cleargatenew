"""
Canada SEMA (Special Economic Measures Act) Sanctions Downloader

Downloads and parses the Canadian consolidated sanctions list.
Source: https://www.international.gc.ca/world-monde/international_relations-relations_internationales/sanctions/consolidated-consolide.aspx
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional
from .base_downloader import BaseDownloader
from src.utils.logger import get_logger
import re

logger = get_logger(__name__)


class CanadaDownloader(BaseDownloader):
    """
    Downloads Canada SEMA Consolidated Sanctions List
    
    The Canadian list is a flat XML structure with 'record' elements.
    Each record contains: Country, LastName, GivenName, EntityName, 
    DateOfBirthOrShipBuildDate, Schedule, Item, DateOfListing
    """
    
    SOURCE_NAME = "Canada SEMA"
    SOURCE_COUNTRY = "CA"
    DATA_URL = "https://www.international.gc.ca/world-monde/assets/office_docs/international_relations-relations_internationales/sanctions/sema-lmes.xml"
    UPDATE_FREQUENCY_HOURS = 168  # Weekly
    
    def download(self) -> List[Dict]:
        """Download and parse Canada SEMA XML"""
        
        try:
            content = self._download_raw()
            root = self._parse_xml(content)
            
            entities = []
            seen_ids = set()
            
            # Find all record elements
            for record in root.findall('.//record'):
                entity = self._parse_record(record)
                if entity:
                    # Deduplicate by generated ID
                    entity_id = entity.get('id')
                    if entity_id and entity_id not in seen_ids:
                        seen_ids.add(entity_id)
                        entities.append(entity)
            
            logger.info(
                "canada_download_complete",
                entity_count=len(entities)
            )
            
            return entities
            
        except Exception as e:
            logger.error("canada_download_error", error=str(e))
            raise
    
    def _parse_record(self, elem: ET.Element) -> Optional[Dict]:
        """Parse a single Canada record entry"""
        
        try:
            # Get fields
            country = self._get_text(elem, 'Country') or ''
            last_name = self._get_text(elem, 'LastName') or ''
            given_name = self._get_text(elem, 'GivenName') or ''
            entity_name = self._get_text(elem, 'EntityName') or ''
            dob = self._get_text(elem, 'DateOfBirthOrShipBuildDate') or ''
            schedule = self._get_text(elem, 'Schedule') or ''
            item = self._get_text(elem, 'Item') or ''
            date_listed = self._get_text(elem, 'DateOfListing') or ''
            
            # Determine entity type and name
            if entity_name:
                name = entity_name
                entity_type = 'company'
            elif last_name or given_name:
                # Build person name (GivenName LastName)
                name_parts = [given_name, last_name]
                name = ' '.join(p.strip() for p in name_parts if p).strip()
                entity_type = 'person'
            else:
                return None  # No valid name
            
            if not name:
                return None
            
            # Clean bilingual country (e.g., "Belarus / Bélarus" -> "Belarus")
            if ' / ' in country:
                country = country.split(' / ')[0]
            
            # Generate unique ID from item number and country
            entity_id = f"CA-{country[:3].upper()}-{item}" if item else f"CA-{hash(name) % 100000}"
            
            entity = {
                'id': entity_id,
                'name': name,
                'givenName': given_name if entity_type == 'person' else None,
                'lastName': last_name if entity_type == 'person' else None,
                'entityType': entity_type,
                'type': 'Individual' if entity_type == 'person' else 'Entity',
                'aliases': [],
                'dateOfBirth': self._parse_date(dob) if dob else [],
                'nationalities': [],
                'addresses': [],
                'regimes': [f"Canada - {schedule}"] if schedule else ['Canada SEMA'],
                'country': country,
                'dateAdded': date_listed[:10] if date_listed else None,
                'item': item,
                'schedule': schedule,
            }
            
            # Add country to nationalities for persons
            if entity_type == 'person' and country:
                entity['nationalities'].append(country)
            
            # Map to standard format
            entity['programs'] = entity['regimes']
            
            return entity
            
        except Exception as e:
            logger.warning("canada_parse_record_error", error=str(e))
            return None
    
    def _parse_date(self, date_str: str) -> List[str]:
        """Parse Canadian date formats (YYYY-MM-DD or just YYYY)"""
        if not date_str:
            return []
        
        date_str = date_str.strip()
        
        # ISO format YYYY-MM-DD
        if re.match(r'^\d{4}-\d{2}-\d{2}$', date_str):
            return [date_str]
        
        # Year only
        if re.match(r'^\d{4}$', date_str):
            return [date_str]
        
        return [date_str]
    
    def _get_text(self, element: ET.Element, tag: str) -> Optional[str]:
        """Safely get text from XML element"""
        child = element.find(tag)
        if child is not None and child.text:
            return child.text.strip()
        return None


# Convenience function
def download_canada_sanctions() -> List[Dict]:
    """Download Canada SEMA sanctions list"""
    downloader = CanadaDownloader()
    return downloader.get_entities()
