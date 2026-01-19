"""
Enhanced EU Sanctions Parser

Comprehensive parser for EU CFSP sanctions data that extracts ALL available fields
including biographical data, identifications, professional information, and detailed
sanctions reasoning.

Extracts 40+ fields per entity compared to previous 20 fields.
"""

import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from .enhanced_base_parser import EnhancedBaseParser
from .field_extractors import FieldExtractor

logger = logging.getLogger(__name__)

# EU XML namespace
EU_NS = '{http://eu.europa.ec/fpi/fsd/export}'


class EnhancedEUParser(EnhancedBaseParser):
    """
    Enhanced EU Sanctions Parser
    
    Extracts ALL available fields from EU CFSP XML format including:
    - Complete name variations (first, middle, last, aliases)
    - Full biographical data (birth date, place, gender, title)
    - Identification documents (passports, IDs with details)
    - Structured addresses (street, city, postal, country)
    - Professional information (positions, affiliations)
    - Comprehensive sanctions reasoning (full text + summary)
    - Detailed regulatory data (programmes, regulations, legal basis)
    - Timeline events (listing, updates, amendments)
    """
    
    SOURCE_NAME = "EU"
    
    def __init__(self, file_path: str):
        super().__init__(file_path)
        self.extractor = FieldExtractor()
    
    def parse(self) -> List[Dict[str, Any]]:
        """Main parsing method"""
        self.logger.info(f"Starting enhanced EU parsing: {self.file_path}")
        
        entities = []
        
        try:
            tree = ET.parse(self.file_path)
            root = tree.getroot()
            
            # Parse all sanctionEntity elements
            for entity_elem in root.findall(f'.//{EU_NS}sanctionEntity'):
                try:
                    entity_dict = self._parse_entity(entity_elem)
                    if entity_dict:
                        entities.append(entity_dict)
                        self.stats['successfully_parsed'] += 1
                except Exception as e:
                    self.logger.error(f"Failed to parse entity: {e}", exc_info=True)
                    self.stats['failed'] += 1
                finally:
                    self.stats['total_entities'] += 1
            
            self.logger.info(f"Parsing complete: {len(entities)} entities extracted")
            
        except ET.ParseError as e:
            self.logger.error(f"XML parsing error: {e}")
            raise
        
        return entities
    
    def _parse_entity(self, entity_elem: ET.Element) -> Optional[Dict[str, Any]]:
        """Parse a single sanctionEntity element"""
        
        # Determine entity type
        entity_type = self._extract_entity_type(entity_elem)
        
        if entity_type == 'Person':
            return self._parse_person(entity_elem)
        elif entity_type == 'Entity':
            return self._parse_organization(entity_elem)
        else:
            self.logger.warning(f"Unknown entity type: {entity_type}")
            return None
    
    def _extract_entity_type(self, entity_elem: ET.Element) -> str:
        """Determine if Person or Entity"""
        subtype = entity_elem.find(f'{EU_NS}subjectType')
        
        if subtype is not None:
            code = subtype.get('classificationCode', '').strip().upper()
            if code == 'P':
                return 'Person'
            elif code == 'E':
                return 'Entity'
        
        return 'Other'
    
    def _parse_person(self, entity_elem: ET.Element) -> Dict[str, Any]:
        """Parse individual/person entity with ALL fields"""
        
        entity_dict = {
            'source': self.SOURCE_NAME,
            'entity_type': 'Person',
            'is_sanctioned': True,
            'designation_status': 'Active'
        }
        
        # 1. NAMES - Extract all name variations
        names_data = self._extract_names(entity_elem)
        entity_dict.update(names_data)
        
        # 2. BIOGRAPHICAL DATA (birth info, gender, title)
        biographical_data = self._extract_biographical(entity_elem)
        entity_dict.update(biographical_data)
        
        # 3. IDENTIFICATIONS (Passports, IDs, Tax numbers)
        entity_dict['identifications'] = self._extract_identifications(entity_elem)
        
        # 4. ADDRESSES (Structured with all components)
        entity_dict['addresses'] = self._extract_addresses(entity_elem)
        
        # 5. CITIZENSHIP/NATIONALITY
        entity_dict['citizenship_countries'] = self._extract_citizenships(entity_elem)
        entity_dict['nationalities'] = entity_dict['citizenship_countries']  # Alias
        
        # 6. PROFESSIONAL INFORMATION
        professional_data = self._extract_professional(entity_elem)
        entity_dict.update(professional_data)
        
        # 7. SANCTIONS DETAILS (reasoning, legal basis, measures)
        sanctions_data = self._extract_sanctions_details(entity_elem)
        entity_dict.update(sanctions_data)
        
        # 8. REGULATIONS (detailed regulatory data)
        entity_dict['regulations'] = self._extract_regulatory_data(entity_elem)
        
        # 9. TIMELINE EVENTS
        entity_dict['timeline_events'] = self.build_timeline_events(entity_dict['regulations'])
        
        # 10. EXTRACT DATES FOR SUMMARY
        dates_summary = self._extract_dates_summary(entity_dict['regulations'])
        entity_dict.update(dates_summary)
        
        # 11. GENERATE EXTERNAL ID
        entity_dict['external_id'] = self.generate_external_id(entity_dict)
        
        # 12. CALCULATE COMPLETENESS
        entity_dict['data_completeness_score'] = self.calculate_completeness_score(entity_dict)
        
        # 13. METADATA
        entity_dict['updated_at'] = datetime.utcnow().isoformat()
        entity_dict['source_url'] = 'https://webgate.ec.europa.eu/fsd/fsf'
        
        return entity_dict
    
    def _extract_names(self, entity_elem: ET.Element) -> Dict[str, Any]:
        """Extract all name variations with components"""
        names_data = {
            'aliases': [],
            'first_name': None,
            'middle_name': None,
            'last_name': None,
            'full_name': None,
            'name': None,
            'title': None
        }
        
        # Find all nameAlias elements
        name_aliases = entity_elem.findall(f'.//{EU_NS}nameAlias')
        
        if not name_aliases:
            return names_data
        
        # First nameAlias is usually primary
        primary_alias = name_aliases[0]
        
        # Extract components from attributes
        whole_name = primary_alias.get('wholeName', '').strip()
        first_name = primary_alias.get('firstName', '').strip()
        last_name = primary_alias.get('lastName', '').strip()
        middle_name = primary_alias.get('middleName', '').strip()
        title = primary_alias.get('title', '').strip()
        
        # Set primary name
        if whole_name:
            names_data['full_name'] = whole_name
            names_data['name'] = whole_name
        elif first_name or last_name:
            # Construct from components
            parts = [p for p in [first_name, middle_name, last_name] if p]
            names_data['full_name'] = ' '.join(parts)
            names_data['name'] = names_data['full_name']
        
        # Set name components
        names_data['first_name'] = first_name if first_name else None
        names_data['middle_name'] = middle_name if middle_name else None
        names_data['last_name'] = last_name if last_name else None
        names_data['title'] = title if title else None
        
        # Track field extraction
        self.track_field_extraction('name', bool(names_data['name']))
        self.track_field_extraction('first_name', bool(first_name))
        self.track_field_extraction('middle_name', bool(middle_name))
        self.track_field_extraction('last_name', bool(last_name))
        self.track_field_extraction('title', bool(title))
        
        # Extract all aliases
        all_aliases = []
        for alias_elem in name_aliases:
            alias_whole = alias_elem.get('wholeName', '').strip()
            if alias_whole and alias_whole != names_data['full_name']:
                all_aliases.append(alias_whole)
        
        names_data['aliases'] = self.extractor.deduplicate_list(all_aliases)
        self.track_field_extraction('aliases', len(names_data['aliases']) > 0)
        
        return names_data
    
    def _extract_biographical(self, entity_elem: ET.Element) -> Dict[str, Any]:
        """Extract comprehensive biographical information"""
        bio_data = {
            'birth_date': None,
            'birth_city': None,
            'birth_country': None,
            'birth_place': None,
            'gender': None
        }
        
        # Extract birth date and location
        birthdate_elem = entity_elem.find(f'.//{EU_NS}birthdate')
        if birthdate_elem is not None:
            # Try full date string first (DD/MM/YYYY format)
            birth_str = birthdate_elem.get('birthdate', '').strip()
            if birth_str:
                birth_date = self.extractor.parse_date_flexible(birth_str)
                if birth_date:
                    bio_data['birth_date'] = birth_date.isoformat()
            
            # If that failed, try separated fields
            if not bio_data['birth_date']:
                day = birthdate_elem.get('day', '').strip()
                month = birthdate_elem.get('monthOfYear', '').strip()
                year = birthdate_elem.get('year', '').strip()
                
                if year and year != '0':
                    birth_date = self.extractor.parse_separated_date(day, month, year)
                    if birth_date:
                        bio_data['birth_date'] = birth_date.isoformat()
            
            # Extract birth location
            birth_city = birthdate_elem.get('city', '').strip()
            birth_country = birthdate_elem.get('countryDescription', '').strip()
            
            if birth_city:
                bio_data['birth_city'] = birth_city
            if birth_country:
                bio_data['birth_country'] = birth_country
            
            # Construct full birth place
            if birth_city and birth_country:
                bio_data['birth_place'] = f"{birth_city}, {birth_country}"
            elif birth_city:
                bio_data['birth_place'] = birth_city
            elif birth_country:
                bio_data['birth_place'] = birth_country
        
        # Track extraction
        self.track_field_extraction('birth_date', bio_data['birth_date'] is not None)
        self.track_field_extraction('birth_place', bio_data['birth_place'] is not None)
        
        # Extract gender from nameAlias
        name_alias = entity_elem.find(f'.//{EU_NS}nameAlias')
        if name_alias is not None:
            gender_str = name_alias.get('gender', '').strip()
            if gender_str:
                bio_data['gender'] = self.extractor.extract_gender(gender_str)
                self.track_field_extraction('gender', bio_data['gender'] is not None)
        
        return bio_data
    
    def _extract_identifications(self, entity_elem: ET.Element) -> List[Dict[str, Any]]:
        """Extract all identification documents"""
        identifications = []
        
        for id_elem in entity_elem.findall(f'.//{EU_NS}identification'):
            doc_type = id_elem.get('identificationType', '').strip()
            doc_number = id_elem.get('number', '').strip()
            country = id_elem.get('countryDescription', '').strip()
            country_code = id_elem.get('countryIso2Code', '').strip()
            
            if doc_number:
                identification = {
                    'document_type': doc_type if doc_type else 'Unknown',
                    'document_number': doc_number,
                    'issuing_country': country if country else None,
                    'country_code': country_code if country_code else None,
                    'source': self.SOURCE_NAME
                }
                identifications.append(identification)
        
        self.track_field_extraction('identifications', len(identifications) > 0)
        
        return identifications
    
    def _extract_addresses(self, entity_elem: ET.Element) -> List[Dict[str, Any]]:
        """Extract all addresses with full structure"""
        addresses = []
        
        for addr_elem in entity_elem.findall(f'.//{EU_NS}address'):
            street = addr_elem.get('street', '').strip()
            city = addr_elem.get('city', '').strip()
            region = addr_elem.get('region', '').strip()
            postal = addr_elem.get('zipCode', '').strip()
            country = addr_elem.get('countryDescription', '').strip()
            country_code = addr_elem.get('countryIso2Code', '').strip()
            
            # Build full address
            parts = [p for p in [street, city, region, postal, country] if p]
            full_address = ', '.join(parts) if parts else None
            
            if full_address or city or country:
                address = {
                    'full_address': full_address,
                    'street': street if street else None,
                    'city': city if city else None,
                    'region': region if region else None,
                    'postal_code': postal if postal else None,
                    'country': country if country else None,
                    'country_code': country_code if country_code else None,
                    'is_current': True
                }
                addresses.append(address)
        
        self.track_field_extraction('addresses', len(addresses) > 0)
        
        return addresses
    
    def _extract_citizenships(self, entity_elem: ET.Element) -> List[str]:
        """Extract citizenship/nationality countries"""
        countries = []
        
        for citizenship_elem in entity_elem.findall(f'.//{EU_NS}citizenship'):
            country = citizenship_elem.get('countryDescription', '').strip()
            country_code = citizenship_elem.get('countryIso2Code', '').strip()
            
            if country_code:
                countries.append(country_code)
            elif country:
                normalized = self.extractor.normalize_country_code(country)
                countries.append(normalized)
        
        self.track_field_extraction('citizenship', len(countries) > 0)
        
        return self.extractor.deduplicate_list(countries)
    
    def _extract_professional(self, entity_elem: ET.Element) -> Dict[str, Any]:
        """Extract professional/business information"""
        professional_data = {
            'positions': [],
            'current_position': None,
            'business_affiliations': [],
            'industry_sectors': []
        }
        
        # Extract function/position from nameAlias
        for name_alias in entity_elem.findall(f'.//{EU_NS}nameAlias'):
            function = name_alias.get('function', '').strip()
            if function:
                professional_data['positions'].append(function)
                if not professional_data['current_position']:
                    professional_data['current_position'] = function
        
        # Deduplicate positions
        professional_data['positions'] = self.extractor.deduplicate_list(
            professional_data['positions']
        )
        
        self.track_field_extraction('positions', len(professional_data['positions']) > 0)
        self.track_field_extraction('current_position', 
                                   professional_data['current_position'] is not None)
        
        return professional_data
    
    def extract_sanctions_details(self, entity_elem: ET.Element) -> Dict[str, Any]:
        """Extract detailed sanctions reasoning and measures"""
        sanctions_data = {
            'sanctions_reason': None,
            'sanctions_summary': None,
            'legal_basis': None,
            'legal_articles': [],
            'measures': [],
            'programmes': [],
            'sanction_lists': []
        }
        
        # Extract from all regulations
        regulations = entity_elem.findall(f'.//{EU_NS}regulation')
        
        all_reasons = []
        all_programmes = []
        all_legal_basis = []
        
        for reg_elem in regulations:
            # Programme
            programme = reg_elem.get('programme', '').strip()
            if programme:
                all_programmes.append(programme)
                sanctions_data['sanction_lists'].append(f"EU {programme}")
            
            # Reasoning from remark
            remark = reg_elem.get('remark', '').strip()
            if remark:
                all_reasons.append(remark)
            
            # Legal basis
            summary = reg_elem.get('regulationSummary', '').strip()
            if summary:
                all_legal_basis.append(summary)
            
            # Regulation ID as legal article
            reg_id = reg_elem.get('numberTitle', '').strip()
            if reg_id:
                sanctions_data['legal_articles'].append(reg_id)
        
        # Combine all reasoning
        if all_reasons:
            full_reason = ' '.join(all_reasons)
            sanctions_data['sanctions_reason'] = self.extractor.clean_text(full_reason)
            sanctions_data['sanctions_summary'] = self.extractor.summarize_text(
                sanctions_data['sanctions_reason'], 
                max_length=200
            )
        
        # Track extraction
        self.track_field_extraction('sanctions_reason', 
                                   sanctions_data['sanctions_reason'] is not None)
        
        # Set legal basis
        if all_legal_basis:
            sanctions_data['legal_basis'] = all_legal_basis[0]
        
        # Set programmes
        sanctions_data['programmes'] = self.extractor.deduplicate_list(all_programmes)
        
        # Extract measures from reasoning text
        if sanctions_data['sanctions_reason']:
            sanctions_data['measures'] = self.extractor.extract_measures_from_text(
                sanctions_data['sanctions_reason']
            )
        else:
            # Default EU measures
            sanctions_data['measures'] = ['Asset Freeze', 'Travel Ban']
        
        return sanctions_data
    
    def extract_regulatory_data(self, entity_elem: ET.Element) -> List[Dict[str, Any]]:
        """Extract detailed regulation information"""
        regulations = []
        
        for reg_elem in entity_elem.findall(f'.//{EU_NS}regulation'):
            reg_id = reg_elem.get('numberTitle', '').strip()
            programme = reg_elem.get('programme', '').strip()
            reg_type = reg_elem.get('regulationType', '').strip()
            
            # Dates
            entry_date_str = reg_elem.get('entryIntoForceDate', '').strip()
            pub_date_str = reg_elem.get('publicationDate', '').strip()
            
            entry_date = None
            pub_date = None
            
            if entry_date_str:
                parsed_date = self.extractor.parse_date_flexible(entry_date_str)
                if parsed_date:
                    entry_date = parsed_date.isoformat()
            
            if pub_date_str:
                parsed_date = self.extractor.parse_date_flexible(pub_date_str)
                if parsed_date:
                    pub_date = parsed_date.isoformat()
            
            # Remarks
            remarks = reg_elem.get('remark', '').strip()
            
            regulation = {
                'regulation_id': reg_id if reg_id else 'Unknown',
                'programme': programme if programme else None,
                'regulation_type': reg_type if reg_type else None,
                'entry_into_force_date': entry_date,
                'publication_date': pub_date,
                'remarks': remarks if remarks else None
            }
            
            regulations.append(regulation)
        
        return regulations
    
    def _extract_dates_summary(self, regulations: List[Dict]) -> Dict[str, Any]:
        """Extract first listed and last updated dates from regulations"""
        dates_summary = {
            'first_listed_date': None,
            'last_updated_date': None,
            'regulation_ids': []
        }
        
        all_dates = []
        
        for reg in regulations:
            # Collect regulation IDs
            if reg.get('regulation_id'):
                dates_summary['regulation_ids'].append(reg['regulation_id'])
            
            # Collect dates
            if reg.get('entry_into_force_date'):
                all_dates.append(reg['entry_into_force_date'])
            if reg.get('publication_date'):
                all_dates.append(reg['publication_date'])
        
        # Set first and last dates
        if all_dates:
            all_dates.sort()
            dates_summary['first_listed_date'] = all_dates[0]
            dates_summary['last_updated_date'] = all_dates[-1]
        
        return dates_summary
    
    def _parse_organization(self, entity_elem: ET.Element) -> Dict[str, Any]:
        """Parse entity/organization with all fields"""
        
        entity_dict = {
            'source': self.SOURCE_NAME,
            'entity_type': 'Entity',
            'is_sanctioned': True,
            'designation_status': 'Active'
        }
        
        # Names
        names_data = self._extract_organization_names(entity_elem)
        entity_dict.update(names_data)
        
        # Professional/business info
        professional_data = self._extract_professional(entity_elem)
        entity_dict.update(professional_data)
        
        # Addresses
        entity_dict['addresses'] = self._extract_addresses(entity_elem)
        
        # Sanctions details
        sanctions_data = self.extract_sanctions_details(entity_elem)
        entity_dict.update(sanctions_data)
        
        # Regulations
        entity_dict['regulations'] = self.extract_regulatory_data(entity_elem)
        
        # Timeline
        entity_dict['timeline_events'] = self.build_timeline_events(entity_dict['regulations'])
        
        # Dates summary
        dates_summary = self._extract_dates_summary(entity_dict['regulations'])
        entity_dict.update(dates_summary)
        
        # External ID
        entity_dict['external_id'] = self.generate_external_id(entity_dict)
        
        # Completeness
        entity_dict['data_completeness_score'] = self.calculate_completeness_score(entity_dict)
        
        # Metadata
        entity_dict['updated_at'] = datetime.utcnow().isoformat()
        entity_dict['source_url'] = 'https://webgate.ec.europa.eu/fsd/fsf'
        
        return entity_dict
    
    def _extract_organization_names(self, entity_elem: ET.Element) -> Dict[str, Any]:
        """Extract organization names"""
        names_data = {
            'aliases': [],
            'name': None,
            'full_name': None
        }
        
        # Find all nameAlias elements
        name_aliases = entity_elem.findall(f'.//{EU_NS}nameAlias')
        
        if not name_aliases:
            return names_data
        
        # First is primary
        primary_alias = name_aliases[0]
        whole_name = primary_alias.get('wholeName', '').strip()
        
        names_data['name'] = whole_name
        names_data['full_name'] = whole_name
        
        # Collect aliases
        all_aliases = []
        for alias_elem in name_aliases[1:]:  # Skip first (primary)
            alias_whole = alias_elem.get('wholeName', '').strip()
            if alias_whole:
                all_aliases.append(alias_whole)
        
        names_data['aliases'] = self.extractor.deduplicate_list(all_aliases)
        
        return names_data


# Convenience function
def parse_eu_sanctions_enhanced(file_path: str) -> List[Dict]:
    """Parse EU sanctions XML with enhanced field extraction"""
    parser = EnhancedEUParser(file_path)
    return parser.parse()
