"""
UN Security Council Sanctions List Downloader

Downloads and parses the UN consolidated sanctions list.
Source: https://scsanctions.un.org/resources/xml/en/consolidated.xml
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional
from .base_downloader import BaseDownloader
from src.utils.logger import get_logger

logger = get_logger(__name__)


class UNDownloader(BaseDownloader):
    """
    Downloads UN Security Council Consolidated Sanctions List
    
    Contains individuals and entities sanctioned by UN Security Council resolutions.
    """
    
    SOURCE_NAME = "UN Sanctions"
    SOURCE_COUNTRY = "UN"
    DATA_URL = "https://scsanctions.un.org/resources/xml/en/consolidated.xml"
    UPDATE_FREQUENCY_HOURS = 24
    
    def download(self) -> List[Dict]:
        """Download and parse UN sanctions XML"""
        
        try:
            content = self._download_raw()
            root = self._parse_xml(content)
            
            entities = []
            
            # Find all individuals
            for individual in root.findall('.//INDIVIDUAL'):
                entity = self._parse_individual(individual)
                if entity:
                    entities.append(entity)
            
            # Find all entities
            for entity_elem in root.findall('.//ENTITY'):
                entity = self._parse_entity(entity_elem)
                if entity:
                    entities.append(entity)
            
            logger.info(
                "un_download_complete",
                entity_count=len(entities)
            )
            
            return entities
            
        except Exception as e:
            logger.error("un_download_error", error=str(e))
            raise
    
    def _parse_individual(self, elem: ET.Element) -> Optional[Dict]:
        """Parse a UN individual entry"""
        
        try:
            # Get ID
            dataid = self._get_text(elem, 'DATAID')
            
            # Build name
            first_name = self._get_text(elem, 'FIRST_NAME') or ''
            second_name = self._get_text(elem, 'SECOND_NAME') or ''
            third_name = self._get_text(elem, 'THIRD_NAME') or ''
            fourth_name = self._get_text(elem, 'FOURTH_NAME') or ''
            
            name_parts = [first_name, second_name, third_name, fourth_name]
            name = ' '.join(p for p in name_parts if p).strip()
            
            if not name:
                name = self._get_text(elem, 'NAME_ORIGINAL_SCRIPT') or 'Unknown'
            
            if not name or name == 'Unknown':
                return None
            
            # Get aliases
            aliases = []
            for alias in elem.findall('.//ALIAS'):
                alias_name = self._get_text(alias, 'ALIAS_NAME')
                if alias_name:
                    aliases.append(alias_name)
            
            entity = {
                'dataid': dataid,
                'name': name,
                'firstName': first_name,
                'secondName': second_name,
                'thirdName': third_name,
                'fourthName': fourth_name,
                'type': 'Individual',
                'entityType': 'person',
                'aliases': aliases,
                'dateOfBirth': [],
                'placeOfBirth': [],
                'nationalities': [],
                'designations': [],
                'listedOn': self._get_text(elem, 'LISTED_ON'),
                'comments': self._get_text(elem, 'COMMENTS1'),
            }
            
            # Get dates of birth
            for dob in elem.findall('.//INDIVIDUAL_DATE_OF_BIRTH'):
                date = self._get_text(dob, 'DATE') or self._get_text(dob, 'YEAR')
                if date:
                    entity['dateOfBirth'].append(date)
            
            # Get nationality
            for nat in elem.findall('.//NATIONALITY'):
                nationality = self._get_text(nat, 'VALUE')
                if nationality:
                    entity['nationalities'].append(nationality)
            
            # Get list type
            list_type = self._get_text(elem, 'UN_LIST_TYPE')
            if list_type:
                entity['designations'].append(list_type)
            
            entity['programs'] = entity['designations']
            
            return entity
            
        except Exception as e:
            logger.warning("un_parse_individual_error", error=str(e))
            return None
    
    def _parse_entity(self, elem: ET.Element) -> Optional[Dict]:
        """Parse a UN entity entry"""
        
        try:
            # Get ID
            dataid = self._get_text(elem, 'DATAID')
            
            # Get name
            name = self._get_text(elem, 'FIRST_NAME') or ''
            
            if not name:
                return None
            
            # Get aliases
            aliases = []
            for alias in elem.findall('.//ALIAS'):
                alias_name = self._get_text(alias, 'ALIAS_NAME')
                if alias_name:
                    aliases.append(alias_name)
            
            entity = {
                'dataid': dataid,
                'name': name,
                'type': 'Entity',
                'entityType': 'company',
                'aliases': aliases,
                'addresses': [],
                'designations': [],
                'listedOn': self._get_text(elem, 'LISTED_ON'),
                'comments': self._get_text(elem, 'COMMENTS1'),
            }
            
            # Get addresses
            for addr in elem.findall('.//ENTITY_ADDRESS'):
                address = {
                    'street': self._get_text(addr, 'STREET'),
                    'city': self._get_text(addr, 'CITY'),
                    'country': self._get_text(addr, 'COUNTRY'),
                }
                if any(address.values()):
                    entity['addresses'].append(address)
            
            # Get list type
            list_type = self._get_text(elem, 'UN_LIST_TYPE')
            if list_type:
                entity['designations'].append(list_type)
            
            entity['programs'] = entity['designations']
            
            return entity
            
        except Exception as e:
            logger.warning("un_parse_entity_error", error=str(e))
            return None
    
    def _get_text(self, element: ET.Element, tag: str) -> Optional[str]:
        """Safely get text from XML element"""
        child = element.find(tag)
        if child is not None and child.text:
            return child.text.strip()
        return None


# Convenience function
def download_un_sanctions() -> List[Dict]:
    """Download UN sanctions list"""
    downloader = UNDownloader()
    return downloader.get_entities()
