#!/usr/bin/env python3
"""
Quick test script for enhanced importer

Tests the enhanced importer with a small sample of entities.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.import_enhanced_entities import EnhancedEntityImporter
from src.parsers.enhanced_eu_parser import EnhancedEUParser
import os

def test_importer():
    """Test the enhanced importer with sample data"""
    
    print("="*60)
    print("Enhanced Importer Test")
    print("="*60)
    
    # Get credentials
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url:
        print("\n❌ SUPABASE_URL not set")
        return False
    
    if not supabase_key:
        print("\n❌ SUPABASE_SERVICE_KEY not set")
        return False
    
    # Find EU XML file
    data_dir = Path(__file__).parent.parent / 'data'
    eu_files = list(data_dir.glob('*eu*.xml'))
    
    if not eu_files:
        print("\n❌ No EU XML file found")
        return False
    
    xml_file = eu_files[0]
    print(f"\n📄 Using: {xml_file.name}")
    
    # Create parser
    print("\n🔍 Parsing entities...")
    parser = EnhancedEUParser(str(xml_file))
    
    try:
        entities = parser.parse()
        print(f"✅ Parsed {len(entities)} entities")
        
        if not entities:
            print("⚠️  No entities found")
            return False
        
        # Show sample entity
        sample = entities[0]
        print(f"\n📋 Sample Entity: {sample.get('name')}")
        print(f"  Completeness: {sample.get('data_completeness_score')}%")
        print(f"  Sanctions Reasoning: {'✓' if sample.get('sanctions_reason') else '✗'}")
        print(f"  Identifications: {len(sample.get('identifications', []))}")
        print(f"  Addresses: {len(sample.get('addresses', []))}")
        
        # Create importer
        print(f"\n💾 Importing to Supabase...")
        importer = EnhancedEntityImporter(supabase_url, supabase_key)
        
        # Import (limit to first 10 for testing)
        test_entities = entities[:10]
        print(f"Testing with {len(test_entities)} entities...")
        
        for entity in test_entities:
            try:
                importer._import_entity(entity)
            except Exception as e:
                print(f"❌ Failed to import {entity.get('name')}: {e}")
                importer.stats['failed'] += 1
        
        # Show results
        importer._log_statistics()
        
        print("\n✅ Test Complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = test_importer()
    sys.exit(0 if success else 1)
