"""
EU Consolidated Sanctions List Downloader (Fixed)

Downloads and parses the EU sanctions list.
Source: https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content

Schema: Attribute-based XML (CFSP format) with namespace.
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional
from .base_downloader import BaseDownloader
from src.utils.logger import get_logger
import requests

logger = get_logger(__name__)

# EU XML namespace
EU_NS = '{http://eu.europa.ec/fpi/fsd/export}'


class EUDownloader(BaseDownloader):
    """
    Downloads EU Consolidated Sanctions List
    
    The EU list uses an attribute-heavy XML schema.
    Most data is in attributes like firstName="...", not text content.
    """
    
    SOURCE_NAME = "EU Sanctions"
    SOURCE_COUNTRY = "EU"
    DATA_URL = "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw"
    UPDATE_FREQUENCY_HOURS = 24
    
    def _download_raw(self) -> bytes:
        """Override download to add specific headers for EU site"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        
        logger.info("downloading_raw_data", url=self.DATA_URL)
        response = requests.get(self.DATA_URL, timeout=120, headers=headers)
        response.raise_for_status()
        return response.content
    
    def download(self) -> List[Dict]:
        """Download and parse EU sanctions XML"""
        try:
            content = self._download_raw()
            root = self._parse_xml(content)
            
            entities = []
            
            # Find all sanction entities
            for entity_elem in root.findall(f'.//{EU_NS}sanctionEntity'):
                entity = self._parse_entity(entity_elem)
                if entity:
                    entities.append(entity)
            
            logger.info(
                "eu_download_complete",
                entity_count=len(entities)
            )
            
            return entities
            
        except Exception as e:
            logger.error("eu_download_error", error=str(e))
            raise
    
    def _parse_entity(self, elem: ET.Element) -> Optional[Dict]:
        """Parse a single EU sanction entity (Attribute-based)"""
        
        try:
            # Get logical ID
            logical_id = elem.get('logicalId', '')
            
            # Get subject type
            subject_type_elem = elem.find(f'{EU_NS}subjectType')
            subject_type = 'person'
            if subject_type_elem is not None:
                # classificationCode: P = Person, E = Enterprise
                code = subject_type_elem.get('classificationCode', 'P')
                subject_type = 'person' if code == 'P' else 'company'
            
            # Extract names
            names = []
            primary_name = None
            
            for name_alias in elem.findall(f'.//{EU_NS}nameAlias'):
                whole_name = name_alias.get('wholeName')
                first_name = name_alias.get('firstName')
                middle_name = name_alias.get('middleName')
                last_name = name_alias.get('lastName')
                language = name_alias.get('nameLanguage')
                
                # Construct name if wholeName missing
                if not whole_name:
                    parts = [p for p in [first_name, middle_name, last_name] if p]
                    whole_name = ' '.join(parts)
                
                if whole_name:
                    name_entry = {
                        'wholeName': whole_name,
                        'firstName': first_name,
                        'middleName': middle_name,
                        'lastName': last_name,
                        'nameLanguage': language,
                        'function': name_alias.get('function')
                    }
                    names.append(name_entry)
                    
                    # Prefer English or strong names as primary
                    is_strong = name_alias.get('strong', 'false') == 'true'
                    if primary_name is None or (is_strong and not primary_name):
                        primary_name = whole_name
            
            if not primary_name and names:
                primary_name = names[0]['wholeName']
            
            if not primary_name:
                return None
            
            entity = {
                'logicalId': logical_id,
                'name': primary_name,
                'type': 'Individual' if subject_type == 'person' else 'Entity',
                'subjectType': subject_type,  # Use subjectType to match normalizer
                'names': names,
                'aliases': [n['wholeName'] for n in names if n['wholeName'] != primary_name],
                'birthDates': [],
                'nationalities': [],
                'citizenships': [],
                'addresses': [],
                'regulations': [],
                'remarks': [],
            }
            
            # Extract birth dates
            for bd in elem.findall(f'.//{EU_NS}birthdate'):
                date_str = bd.get('birthdate')  # YYYY-MM-DD
                year = bd.get('year')
                month = bd.get('monthOfYear')
                day = bd.get('dayOfMonth')
                
                if date_str:
                    entity['birthDates'].append(date_str)
                elif year and year != '0':
                    # Construct partial date
                    if month and month != '0' and day and day != '0':
                        entity['birthDates'].append(f"{year}-{month.zfill(2)}-{day.zfill(2)}")
                    elif month and month != '0':
                        entity['birthDates'].append(f"{year}-{month.zfill(2)}")
                    else:
                        entity['birthDates'].append(year)
            
            # Extract citizenships/nationalities
            for cit in elem.findall(f'.//{EU_NS}citizenship'):
                country = cit.get('countryDescription')
                code = cit.get('countryIso2Code')
                if country and country != 'UNKNOWN':
                    entity['citizenships'].append(country)
                    entity['nationalities'].append(country)
            
            # Extract addresses
            for addr in elem.findall(f'.//{EU_NS}address'):
                street = addr.get('street')
                city = addr.get('city')
                country = addr.get('countryDescription')
                zip_code = addr.get('zipCode')
                
                address_parts = [street, city, zip_code, country]
                full_address = ', '.join([p for p in address_parts if p])
                
                if full_address:
                    entity['addresses'].append({
                        'street': street,
                        'city': city,
                        'zipCode': zip_code,
                        'country': country,
                        'fullAddress': full_address
                    })
            
            # Extract remarks
            for remark in elem.findall(f'{EU_NS}remark'):
                if remark.text:
                    entity['remarks'].append(remark.text.strip())
            
            # Extract regulations (programs) - store as dictionaries
            seen_programs = set()
            for reg in elem.findall(f'.//{EU_NS}regulation'):
                prog = reg.get('programme')
                pub_date = reg.get('publicationDate')
                entry_date = reg.get('entryIntoForceDate')
                
                if prog:
                    reg_dict = {
                        'programme': prog,
                        'publicationDate': pub_date,
                        'entryIntoForceDate': entry_date,
                        'regulationType': reg.get('regulationType'),
                        'numberTitle': reg.get('numberTitle')
                    }
                    entity['regulations'].append(reg_dict)
                    seen_programs.add(prog)
            
            entity['programs'] = list(seen_programs)
            
            return entity
            
        except Exception as e:
            logger.warning("eu_parse_entity_error", logical_id=elem.get('logicalId'), error=str(e))
            return None


# Convenience function
def download_eu_sanctions() -> List[Dict]:
    """Download EU sanctions list and return entities"""
    downloader = EUDownloader()
    return downloader.get_entities()
