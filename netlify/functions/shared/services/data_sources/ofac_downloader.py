"""
OFAC SDN List Downloader

Downloads and parses the US Treasury OFAC Specially Designated Nationals list.
Source: https://www.treasury.gov/ofac/downloads/sdn.xml
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional
from .base_downloader import BaseDownloader
from src.utils.logger import get_logger

logger = get_logger(__name__)

# OFAC XML namespace
OFAC_NS = '{https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML}'


class OFACDownloader(BaseDownloader):
    """
    Downloads OFAC SDN (Specially Designated Nationals) List
    
    The SDN list is the primary US sanctions list containing:
    - Individuals
    - Entities (companies)
    - Vessels
    - Aircraft
    """
    
    SOURCE_NAME = "OFAC SDN List"
    SOURCE_COUNTRY = "US"
    DATA_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml"
    UPDATE_FREQUENCY_HOURS = 24  # Daily updates
    
    def download(self) -> List[Dict]:
        """Download and parse OFAC SDN XML"""
        
        try:
            # Download XML
            content = self._download_raw()
            root = self._parse_xml(content)
            
            entities = []
            
            # Find all SDN entries with namespace
            for entry in root.findall(f'.//{OFAC_NS}sdnEntry'):
                entity = self._parse_entry(entry)
                if entity:
                    entities.append(entity)
            
            logger.info(
                "ofac_download_complete",
                entity_count=len(entities)
            )
            
            return entities
            
        except Exception as e:
            logger.error("ofac_download_error", error=str(e))
            raise

    
    def _parse_entry(self, entry: ET.Element) -> Optional[Dict]:
        """Parse a single SDN entry"""
        
        try:
            uid = self._get_text(entry, f'{OFAC_NS}uid')
            
            # Build full name
            first_name = self._get_text(entry, f'{OFAC_NS}firstName') or ''
            last_name = self._get_text(entry, f'{OFAC_NS}lastName') or ''
            name = f"{first_name} {last_name}".strip()
            
            # If no name parts, use title as name
            if not name:
                name = self._get_text(entry, f'{OFAC_NS}title') or 'Unknown'
            
            entity = {
                'uid': uid,
                'name': name,
                'firstName': first_name or None,
                'lastName': last_name or None,
                'title': self._get_text(entry, f'{OFAC_NS}title'),
                'sdnType': self._get_text(entry, f'{OFAC_NS}sdnType') or 'Individual',
                'remarks': self._get_text(entry, f'{OFAC_NS}remarks'),
                'programs': [],
                'aliases': [],
                'addresses': [],
                'dateOfBirth': [],
                'placeOfBirth': [],
                'nationalities': [],
                'idNumbers': [],
            }
            
            # Extract sanction programs
            for program in entry.findall(f'.//{OFAC_NS}program'):
                if program.text:
                    entity['programs'].append(program.text.strip())
            
            # Extract aliases (AKAs)
            for aka in entry.findall(f'.//{OFAC_NS}aka'):
                alias = self._parse_alias(aka)
                if alias:
                    entity['aliases'].append(alias)
            
            # Extract addresses
            for address in entry.findall(f'.//{OFAC_NS}address'):
                addr = self._parse_address(address)
                if addr:
                    entity['addresses'].append(addr)
            
            # Extract dates of birth
            for dob_item in entry.findall(f'.//{OFAC_NS}dateOfBirthItem'):
                dob = self._get_text(dob_item, f'{OFAC_NS}dateOfBirth')
                if dob:
                    entity['dateOfBirth'].append(dob)
            
            # Extract places of birth
            for pob_item in entry.findall(f'.//{OFAC_NS}placeOfBirthItem'):
                pob = self._get_text(pob_item, f'{OFAC_NS}placeOfBirth')
                if pob:
                    entity['placeOfBirth'].append(pob)
            
            # Extract nationalities
            for nat_item in entry.findall(f'.//{OFAC_NS}nationality'):
                country = self._get_text(nat_item, f'{OFAC_NS}country')
                if country:
                    entity['nationalities'].append(country)
            
            # Extract ID numbers
            for id_item in entry.findall(f'.//{OFAC_NS}id'):
                id_info = {
                    'type': self._get_text(id_item, f'{OFAC_NS}idType'),
                    'number': self._get_text(id_item, f'{OFAC_NS}idNumber'),
                    'country': self._get_text(id_item, f'{OFAC_NS}idCountry'),
                }
                if id_info['number']:
                    entity['idNumbers'].append(id_info)
            
            return entity
            
        except Exception as e:
            logger.warning("ofac_parse_entry_error", error=str(e))
            return None
    
    def _parse_alias(self, aka: ET.Element) -> Optional[str]:
        """Parse an alias entry"""
        first = self._get_text(aka, f'{OFAC_NS}firstName') or ''
        last = self._get_text(aka, f'{OFAC_NS}lastName') or ''
        alias = f"{first} {last}".strip()
        return alias if alias else None
    
    def _parse_address(self, address: ET.Element) -> Optional[Dict]:
        """Parse an address entry"""
        addr = {
            'address1': self._get_text(address, f'{OFAC_NS}address1'),
            'address2': self._get_text(address, f'{OFAC_NS}address2'),
            'address3': self._get_text(address, f'{OFAC_NS}address3'),
            'city': self._get_text(address, f'{OFAC_NS}city'),
            'stateOrProvince': self._get_text(address, f'{OFAC_NS}stateOrProvince'),
            'postalCode': self._get_text(address, f'{OFAC_NS}postalCode'),
            'country': self._get_text(address, f'{OFAC_NS}country'),
        }
        
        # Only return if at least one field is populated
        if any(addr.values()):
            return addr
        return None

    
    def _get_text(self, element: ET.Element, tag: str) -> Optional[str]:
        """Safely get text from XML element"""
        child = element.find(tag)
        if child is not None and child.text:
            return child.text.strip()
        return None


# Convenience function
def download_ofac_sdn() -> List[Dict]:
    """Download OFAC SDN list and return entities"""
    downloader = OFACDownloader()
    return downloader.get_entities()
