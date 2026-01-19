"""
Test Enhanced EU Parser

Simple test script to verify the enhanced parser extracts all fields correctly.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from parsers.enhanced_eu_parser import EnhancedEUParser


def test_enhanced_parser():
    """Test the enhanced EU parser with sample data"""
    
    print("="*60)
    print("Enhanced EU Parser Test")
    print("="*60)
    
    # Find EU XML file
    data_dir = Path(__file__).parent.parent / 'data'
    eu_files = list(data_dir.glob('*eu*.xml'))
    
    if not eu_files:
        print("\n❌ No EU XML file found in data directory")
        print("Please download EU sanctions data first:")
        print("  python -m scripts.download_eu_sanctions")
        return False
    
    xml_file = eu_files[0]
    print(f"\n📄 Parsing: {xml_file.name}")
    
    # Create parser
    parser = EnhancedEUParser(str(xml_file))
    
    try:
        # Parse entities
        entities = parser.parse()
        
        print(f"\n✅ Successfully parsed {len(entities)} entities")
        
        if not entities:
            print("⚠️  No entities found in file")
            return False
        
        # Analyze first entity
        first = entities[0]
        
        print(f"\n{'='*60}")
        print(f"Sample Entity: {first.get('name', 'Unknown')}")
        print(f"{'='*60}")
        
        # Show completeness
        completeness = first.get('data_completeness_score', 0)
        print(f"\n📊 Data Completeness: {completeness}%")
        
        # Show field categories
        print(f"\n📋 Extracted Fields by Category:")
        
        # Core identity
        core_fields = ['name', 'first_name', 'middle_name', 'last_name', 'title', 'entity_type']
        core_count = sum(1 for f in core_fields if first.get(f))
        print(f"  Core Identity: {core_count}/{len(core_fields)} fields")
        
        # Biographical
        bio_fields = ['birth_date', 'birth_place', 'birth_city', 'birth_country', 'gender']
        bio_count = sum(1 for f in bio_fields if first.get(f))
        print(f"  Biographical: {bio_count}/{len(bio_fields)} fields")
        
        # Identifications
        ids = first.get('identifications', [])
        print(f"  Identifications: {len(ids)} documents")
        
        # Addresses
        addrs = first.get('addresses', [])
        print(f"  Addresses: {len(addrs)} addresses")
        
        # Professional
        positions = first.get('positions', [])
        print(f"  Professional: {len(positions)} positions")
        
        # Sanctions
        has_reasoning = bool(first.get('sanctions_reason'))
        programmes = first.get('programmes', [])
        measures = first.get('measures', [])
        print(f"  Sanctions: Reasoning={'✓' if has_reasoning else '✗'}, {len(programmes)} programmes, {len(measures)} measures")
        
        # Timeline
        events = first.get('timeline_events', [])
        print(f"  Timeline: {len(events)} events")
        
        # Show detailed example
        print(f"\n{'='*60}")
        print("Detailed Field Examples:")
        print(f"{'='*60}")
        
        if first.get('sanctions_reason'):
            reason = first['sanctions_reason']
            print(f"\n🔍 Sanctions Reasoning:")
            print(f"  {reason[:200]}..." if len(reason) > 200 else f"  {reason}")
        
        if ids:
            print(f"\n🆔 Identification Documents:")
            for doc in ids[:3]:  # Show first 3
                print(f"  - {doc.get('document_type')}: {doc.get('document_number')} ({doc.get('issuing_country')})")
        
        if addrs:
            print(f"\n📍 Addresses:")
            for addr in addrs[:2]:  # Show first 2
                print(f"  - {addr.get('full_address')}")
        
        # Show statistics
        stats = parser.get_statistics()
        
        print(f"\n{'='*60}")
        print("Parser Statistics:")
        print(f"{'='*60}")
        print(f"  Total entities: {stats['total_entities']}")
        print(f"  Successfully parsed: {stats['successfully_parsed']}")
        print(f"  Failed: {stats['failed']}")
        print(f"  Success rate: {stats['success_rate']:.1f}%")
        
        # Field extraction rates
        if stats.get('field_extraction_rates'):
            print(f"\n📈 Field Extraction Rates:")
            rates = stats['field_extraction_rates']
            for field, rate in sorted(rates.items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"  {field}: {rate:.1f}%")
        
        print(f"\n{'='*60}")
        print("✅ Enhanced Parser Test Complete!")
        print(f"{'='*60}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during parsing: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = test_enhanced_parser()
    sys.exit(0 if success else 1)
