"""
Enhanced Entity Importer

Imports entities from enhanced parsers into Supabase database with all 40+ fields.
Populates main table and related tables (identifications, addresses, regulations, timeline).
"""

import sys
from pathlib import Path
from typing import List, Dict, Any
import logging
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from parsers.enhanced_eu_parser import EnhancedEUParser
from supabase import create_client, Client
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class EnhancedEntityImporter:
    """Import enhanced entity data into Supabase"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        """
        Initialize importer
        
        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase service role key
        """
        self.client: Client = create_client(supabase_url, supabase_key)
        self.stats = {
            'total_entities': 0,
            'inserted': 0,
            'updated': 0,
            'failed': 0,
            'identifications_inserted': 0,
            'addresses_inserted': 0,
            'regulations_inserted': 0,
            'timeline_events_inserted': 0
        }
    
    def import_from_parser(self, parser: EnhancedEUParser) -> bool:
        """
        Import entities from enhanced parser
        
        Args:
            parser: Enhanced parser instance (already parsed)
        
        Returns:
            True if successful, False otherwise
        """
        logger.info("Starting enhanced entity import...")
        
        # Parse entities
        try:
            entities = parser.parse()
            self.stats['total_entities'] = len(entities)
            
            logger.info(f"Parsed {len(entities)} entities from source")
            
            # Import each entity
            for entity_dict in entities:
                try:
                    self._import_entity(entity_dict)
                except Exception as e:
                    logger.error(f"Failed to import entity {entity_dict.get('name', 'Unknown')}: {e}")
                    self.stats['failed'] += 1
            
            # Log statistics
            self._log_statistics()
            
            return self.stats['failed'] == 0
            
        except Exception as e:
            logger.error(f"Import failed: {e}", exc_info=True)
            return False
    
    def _import_entity(self, entity_dict: Dict[str, Any]):
        """Import a single entity with all related data"""
        
        # Prepare main entity record
        main_record = self._prepare_main_record(entity_dict)
        
        # Check if entity exists
        existing = self.client.table('sanctions_entities').select('id').eq(
            'external_id', main_record['external_id']
        ).execute()
        
        if existing.data:
            # Update existing
            entity_id = existing.data[0]['id']
            self.client.table('sanctions_entities').update(main_record).eq(
                'id', entity_id
            ).execute()
            self.stats['updated'] += 1
            logger.debug(f"Updated entity: {main_record['name']}")
        else:
            # Insert new
            result = self.client.table('sanctions_entities').insert(main_record).execute()
            entity_id = result.data[0]['id']
            self.stats['inserted'] += 1
            logger.debug(f"Inserted entity: {main_record['name']}")
        
        # Import related data
        self._import_identifications(entity_id, entity_dict.get('identifications', []))
        self._import_addresses(entity_id, entity_dict.get('addresses', []))
        self._import_regulations(entity_id, entity_dict.get('regulations', []))
        self._import_timeline_events(entity_id, entity_dict.get('timeline_events', []))
    
    def _prepare_main_record(self, entity_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare main sanctions_entities record"""
        
        return {
            # Core identity
            'external_id': entity_dict.get('external_id'),
            'name': entity_dict.get('name'),
            'entity_type': entity_dict.get('entity_type'),
            'source': entity_dict.get('source'),
            
            # Biographical
            'first_name': entity_dict.get('first_name'),
            'middle_name': entity_dict.get('middle_name'),
            'last_name': entity_dict.get('last_name'),
            'full_name': entity_dict.get('full_name'),
            'title': entity_dict.get('title'),
            'birth_date': entity_dict.get('birth_date'),
            'birth_place': entity_dict.get('birth_place'),
            'birth_city': entity_dict.get('birth_city'),
            'birth_country': entity_dict.get('birth_country'),
            'gender': entity_dict.get('gender'),
            
            # Geographic
            'citizenship_countries': entity_dict.get('citizenship_countries', []),
            'nationalities': entity_dict.get('nationalities', []),
            
            # Professional
            'positions': entity_dict.get('positions', []),
            'current_position': entity_dict.get('current_position'),
            'business_affiliations': entity_dict.get('business_affiliations', []),
            'industry_sectors': entity_dict.get('industry_sectors', []),
            
            # Sanctions (CRITICAL)
            'sanctions_reason': entity_dict.get('sanctions_reason'),
            'sanctions_summary': entity_dict.get('sanctions_summary'),
            'legal_basis': entity_dict.get('legal_basis'),
            'legal_articles': entity_dict.get('legal_articles', []),
            'measures': entity_dict.get('measures', []),
            'sanction_lists': entity_dict.get('sanction_lists', []),
            
            # Regulatory
            'regulation_ids': entity_dict.get('regulation_ids', []),
            'programmes': entity_dict.get('programmes', []),
            'first_listed_date': entity_dict.get('first_listed_date'),
            'last_updated_date': entity_dict.get('last_updated_date'),
            'designation_status': entity_dict.get('designation_status', 'Active'),
            
            # Risk (calculate if not provided)
            'risk_score': self._calculate_risk_score(entity_dict),
            'risk_level': self._calculate_risk_level(entity_dict),
            'risk_factors': self._identify_risk_factors(entity_dict),
            
            # Metadata
            'data_completeness_score': entity_dict.get('data_completeness_score', 0),
            'source_url': entity_dict.get('source_url'),
            'updated_at': datetime.utcnow().isoformat()
        }
    
    def _import_identifications(self, entity_id: str, identifications: List[Dict]):
        """Import identification documents"""
        if not identifications:
            return
        
        # Delete existing identifications for this entity
        self.client.table('entity_identifications').delete().eq(
            'entity_id', entity_id
        ).execute()
        
        # Insert new identifications
        for id_doc in identifications:
            record = {
                'entity_id': entity_id,
                'document_type': id_doc.get('document_type'),
                'document_number': id_doc.get('document_number'),
                'issuing_country': id_doc.get('issuing_country'),
                'country_code': id_doc.get('country_code'),
                'issue_date': id_doc.get('issue_date'),
                'expiry_date': id_doc.get('expiry_date'),
                'source': id_doc.get('source')
            }
            
            self.client.table('entity_identifications').insert(record).execute()
            self.stats['identifications_inserted'] += 1
    
    def _import_addresses(self, entity_id: str, addresses: List[Dict]):
        """Import addresses"""
        if not addresses:
            return
        
        # Delete existing addresses for this entity
        self.client.table('entity_addresses').delete().eq(
            'entity_id', entity_id
        ).execute()
        
        # Insert new addresses
        for addr in addresses:
            record = {
                'entity_id': entity_id,
                'full_address': addr.get('full_address'),
                'street': addr.get('street'),
                'city': addr.get('city'),
                'region': addr.get('region'),
                'postal_code': addr.get('postal_code'),
                'country': addr.get('country'),
                'country_code': addr.get('country_code'),
                'is_current': addr.get('is_current', True)
            }
            
            self.client.table('entity_addresses').insert(record).execute()
            self.stats['addresses_inserted'] += 1
    
    def _import_regulations(self, entity_id: str, regulations: List[Dict]):
        """Import regulations"""
        if not regulations:
            return
        
        # Delete existing regulations for this entity
        self.client.table('entity_regulations').delete().eq(
            'entity_id', entity_id
        ).execute()
        
        # Insert new regulations
        for reg in regulations:
            record = {
                'entity_id': entity_id,
                'regulation_id': reg.get('regulation_id'),
                'programme': reg.get('programme'),
                'regulation_type': reg.get('regulation_type'),
                'entry_into_force_date': reg.get('entry_into_force_date'),
                'last_amendment_date': reg.get('last_amendment_date'),
                'publication_date': reg.get('publication_date'),
                'legal_basis': reg.get('legal_basis'),
                'remarks': reg.get('remarks')
            }
            
            self.client.table('entity_regulations').insert(record).execute()
            self.stats['regulations_inserted'] += 1
    
    def _import_timeline_events(self, entity_id: str, events: List[Dict]):
        """Import timeline events"""
        if not events:
            return
        
        # Delete existing events for this entity
        self.client.table('entity_timeline_events').delete().eq(
            'entity_id', entity_id
        ).execute()
        
        # Insert new events
        for event in events:
            record = {
                'entity_id': entity_id,
                'event_type': event.get('event_type'),
                'event_date': event.get('event_date'),
                'event_description': event.get('event_description'),
                'regulation_id': event.get('regulation_id'),
                'source': event.get('source')
            }
            
            self.client.table('entity_timeline_events').insert(record).execute()
            self.stats['timeline_events_inserted'] += 1
    
    def _calculate_risk_score(self, entity_dict: Dict) -> int:
        """Calculate risk score (0-100) based on entity data"""
        score = 0
        
        # Base score for being sanctioned
        if entity_dict.get('is_sanctioned'):
            score += 50
        
        # Add points for measures
        measures = entity_dict.get('measures', [])
        if 'Asset Freeze' in measures:
            score += 20
        if 'Travel Ban' in measures:
            score += 10
        
        # Add points for multiple programmes
        programmes = entity_dict.get('programmes', [])
        score += min(len(programmes) * 5, 20)
        
        # Cap at 100
        return min(score, 100)
    
    def _calculate_risk_level(self, entity_dict: Dict) -> str:
        """Calculate risk level based on score"""
        score = self._calculate_risk_score(entity_dict)
        
        if score >= 75:
            return 'Critical'
        elif score >= 50:
            return 'High'
        elif score >= 25:
            return 'Medium'
        else:
            return 'Low'
    
    def _identify_risk_factors(self, entity_dict: Dict) -> List[str]:
        """Identify risk factors for entity"""
        factors = []
        
        if entity_dict.get('is_sanctioned'):
            factors.append('Active Sanctions')
        
        measures = entity_dict.get('measures', [])
        if measures:
            factors.extend(measures)
        
        programmes = entity_dict.get('programmes', [])
        if programmes:
            factors.append(f"{len(programmes)} Sanction Programmes")
        
        return factors
    
    def _log_statistics(self):
        """Log import statistics"""
        logger.info("\n" + "="*60)
        logger.info("Import Statistics")
        logger.info("="*60)
        logger.info(f"Total entities processed: {self.stats['total_entities']}")
        logger.info(f"Inserted: {self.stats['inserted']}")
        logger.info(f"Updated: {self.stats['updated']}")
        logger.info(f"Failed: {self.stats['failed']}")
        logger.info(f"\nRelated data:")
        logger.info(f"  Identifications: {self.stats['identifications_inserted']}")
        logger.info(f"  Addresses: {self.stats['addresses_inserted']}")
        logger.info(f"  Regulations: {self.stats['regulations_inserted']}")
        logger.info(f"  Timeline events: {self.stats['timeline_events_inserted']}")
        logger.info("="*60)


def main():
    """Main entry point"""
    
    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        sys.exit(1)
    
    # Find EU XML file
    data_dir = Path(__file__).parent.parent / 'data'
    eu_files = list(data_dir.glob('*eu*.xml'))
    
    if not eu_files:
        logger.error("No EU XML file found in data directory")
        logger.info("Please download EU sanctions data first")
        sys.exit(1)
    
    xml_file = eu_files[0]
    logger.info(f"Using EU data file: {xml_file}")
    
    # Create parser
    parser = EnhancedEUParser(str(xml_file))
    
    # Create importer
    importer = EnhancedEntityImporter(supabase_url, supabase_key)
    
    # Import data
    success = importer.import_from_parser(parser)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
