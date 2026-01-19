"""
UK OFSI Consolidated Sanctions List Downloader (Fixed)

Downloads and parses the UK OFSI consolidated sanctions list.
Source: https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.xml

Schema: ArrayOfFinancialSanctionsTarget -> FinancialSanctionsTarget entries
Each entry represents one alias/name variation with a GroupID for deduplication.
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Set
from .base_downloader import BaseDownloader
from src.utils.logger import get_logger
import re

logger = get_logger(__name__)

# UK OFSI XML namespace
UK_NS = '{http://schemas.hmtreasury.gov.uk/ofsi/consolidatedlist}'


class UKDownloader(BaseDownloader):
    """
    Downloads UK OFSI Consolidated Sanctions List
    
    The UK list is a flat structure where each FinancialSanctionsTarget 
    represents one name/alias. Multiple entries share the same GroupID.
    We aggregate these into single entities.
    """
    
    SOURCE_NAME = "UK HM Treasury"
    SOURCE_COUNTRY = "UK"
    DATA_URL = "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.xml"
    UPDATE_FREQUENCY_HOURS = 24
    
    def download(self) -> List[Dict]:
        """Download and parse UK OFSI XML"""
        
        try:
            content = self._download_raw()
            root = self._parse_xml(content)
            
            # Group entries by GroupID
            groups: Dict[str, List[ET.Element]] = {}
            
            # Find all FinancialSanctionsTarget entries (with namespace)
            for target in root.findall(f'{UK_NS}FinancialSanctionsTarget'):
                group_id = self._get_text(target, f'{UK_NS}GroupID')
                if group_id:
                    if group_id not in groups:
                        groups[group_id] = []
                    groups[group_id].append(target)
            
            # Also try without namespace (some XML variations)
            if not groups:
                for target in root.findall('FinancialSanctionsTarget'):
                    group_id = self._get_text(target, 'GroupID')
                    if group_id:
                        if group_id not in groups:
                            groups[group_id] = []
                        groups[group_id].append(target)
            
            logger.info(
                "uk_groups_found",
                group_count=len(groups)
            )
            
            # Parse each group into an entity
            entities = []
            for group_id, targets in groups.items():
                entity = self._parse_group(group_id, targets)
                if entity:
                    entities.append(entity)
            
            logger.info(
                "uk_download_complete",
                entity_count=len(entities)
            )
            
            return entities
            
        except Exception as e:
            logger.error("uk_download_error", error=str(e))
            raise
    
    def _parse_group(self, group_id: str, targets: List[ET.Element]) -> Optional[Dict]:
        """Parse a group of targets (same GroupID) into one entity"""
        
        try:
            # Use first target as primary (usually AliasType="Primary name")
            primary = None
            for target in targets:
                alias_type = self._get_text(target, f'{UK_NS}AliasType') or self._get_text(target, 'AliasType')
                if alias_type and 'primary name' in alias_type.lower():
                    primary = target
                    break
            
            if primary is None:
                primary = targets[0]
            
            # Build full name from name parts
            primary_name = self._build_name(primary)
            if not primary_name:
                return None
            
            # Collect aliases from other targets
            aliases = []
            seen_names: Set[str] = {primary_name.lower()}
            
            for target in targets:
                name = self._build_name(target)
                if name and name.lower() not in seen_names:
                    aliases.append(name)
                    seen_names.add(name.lower())
            
            # Get entity type
            group_type = self._get_text(primary, f'{UK_NS}GroupTypeDescription') or \
                         self._get_text(primary, 'GroupTypeDescription') or 'Individual'
            
            entity_type = 'person' if group_type == 'Individual' else 'company'
            if 'ship' in group_type.lower():
                entity_type = 'vessel'
            
            # Build entity
            entity = {
                'groupId': group_id,
                'name': primary_name,
                'type': group_type,
                'entityType': entity_type,
                'aliases': aliases,
                'dateOfBirth': [],
                'nationalities': [],
                'addresses': [],
                'regimes': [],
                'dateAdded': None,
                'lastUpdated': None,
                'ukRef': None,
                'remarks': None,
            }
            
            # Extract additional fields from primary
            dob = self._get_text(primary, f'{UK_NS}Individual_DateOfBirth') or \
                  self._get_text(primary, 'Individual_DateOfBirth')
            if dob and dob.strip() and dob != '00/00/0':
                entity['dateOfBirth'].append(self._normalize_date(dob))
            
            nationality = self._get_text(primary, f'{UK_NS}Individual_Nationality') or \
                          self._get_text(primary, 'Individual_Nationality')
            if nationality:
                entity['nationalities'].append(nationality)
            
            # Get address
            address = self._build_address(primary)
            if address:
                entity['addresses'].append(address)
            
            # Get regime (sanctions program)
            regime = self._get_text(primary, f'{UK_NS}RegimeName') or \
                     self._get_text(primary, 'RegimeName')
            if regime:
                entity['regimes'].append(regime)
            
            # Get dates
            date_listed = self._get_text(primary, f'{UK_NS}DateListed') or \
                          self._get_text(primary, 'DateListed')
            if date_listed:
                entity['dateAdded'] = date_listed[:10]  # YYYY-MM-DD
            
            last_updated = self._get_text(primary, f'{UK_NS}LastUpdated') or \
                           self._get_text(primary, 'LastUpdated')
            if last_updated:
                entity['lastUpdated'] = last_updated[:10]
            
            # Get UK reference
            uk_ref = self._get_text(primary, f'{UK_NS}UKSanctionsListRef') or \
                     self._get_text(primary, 'UKSanctionsListRef')
            if uk_ref:
                entity['ukRef'] = uk_ref
            
            # Get statement of reasons
            reasons = self._get_text(primary, f'{UK_NS}UKStatementOfReasons') or \
                      self._get_text(primary, 'UKStatementOfReasons')
            if reasons:
                entity['remarks'] = reasons[:1000]  # Truncate long text
            
            # Map to standard format
            entity['programs'] = entity['regimes']
            
            return entity
            
        except Exception as e:
            logger.warning("uk_parse_group_error", group_id=group_id, error=str(e))
            return None
    
    def _build_name(self, target: ET.Element) -> Optional[str]:
        """Build full name from name1-6 parts"""
        parts = []
        
        for i in range(1, 7):
            # Try both cases (name1 and Name1)
            text = self._get_text(target, f'{UK_NS}name{i}') or \
                   self._get_text(target, f'name{i}') or \
                   self._get_text(target, f'{UK_NS}Name{i}') or \
                   self._get_text(target, f'Name{i}')
            if text:
                parts.append(text.strip())
        
        full_name = ' '.join(parts).strip()
        return full_name if full_name else None
    
    def _build_address(self, target: ET.Element) -> Optional[Dict]:
        """Build address from Address1-6 parts"""
        parts = []
        
        for i in range(1, 7):
            text = self._get_text(target, f'{UK_NS}Address{i}') or \
                   self._get_text(target, f'Address{i}')
            if text:
                parts.append(text.strip())
        
        country = self._get_text(target, f'{UK_NS}Country') or \
                  self._get_text(target, 'Country')
        post_code = self._get_text(target, f'{UK_NS}PostCode') or \
                    self._get_text(target, 'PostCode')
        
        if parts or country:
            return {
                'street': ', '.join(parts) if parts else None,
                'city': None,
                'postCode': post_code,
                'country': country,
            }
        return None
    
    def _normalize_date(self, date_str: str) -> str:
        """Normalize various UK date formats to YYYY-MM-DD or year"""
        if not date_str:
            return date_str
        
        date_str = date_str.strip()
        
        # Handle DD/MM/YYYY format
        match = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', date_str)
        if match:
            day, month, year = match.groups()
            if day != '00' and month != '00':
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            elif month != '00':
                return f"{year}-{month.zfill(2)}"
            else:
                return year
        
        # Handle ISO format YYYY-MM-DD
        match = re.match(r'(\d{4})-(\d{2})-(\d{2})', date_str)
        if match:
            return date_str[:10]
        
        # Handle year only
        match = re.match(r'^(\d{4})$', date_str)
        if match:
            return date_str
        
        return date_str
    
    def _get_text(self, element: ET.Element, tag: str) -> Optional[str]:
        """Safely get text from XML element"""
        child = element.find(tag)
        if child is not None and child.text:
            return child.text.strip()
        return None


# Convenience function
def download_uk_sanctions() -> List[Dict]:
    """Download UK OFSI sanctions list"""
    downloader = UKDownloader()
    return downloader.get_entities()
