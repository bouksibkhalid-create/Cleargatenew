
import sys
import os
from collections import Counter

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.services.data_sources.local_search_service import get_local_sanctions_service

def main():
    print("Initializing Local Sanctions Service...")
    service = get_local_sanctions_service()
    
    print("Loading all sources (this may take a moment)...")
    counts = service.load_all_sources(force_refresh=False)
    print(f"Loaded sources: {counts}")
    
    total_individuals = 0
    total_entities = 0
    total_vessels = 0
    total_aircraft = 0
    display_lists = 8 # Official + Alternative
    
    # Iterate through all loaded entities to count types
    all_programs = set()
    
    if service._cache:
        for source, entities in service._cache.items():
            print(f"\nAnalyzing source: {source} ({len(entities)} entities)")
            source_types = Counter()
            
            for entity in entities:
                # entity_type is usually 'person', 'organization', 'vessel', etc.
                estype = entity.get('type', 'unknown').lower()
                source_types[estype] += 1
                
                # Count programs/lists
                # entity.get('programs') is often a list
                programs = entity.get('programs', [])
                if programs:
                    for p in programs:
                        all_programs.add(p)
                else:
                    # Some sources might use listName
                    list_name = entity.get('listName')
                    if list_name:
                        all_programs.add(list_name)

                if estype in ['person', 'individual', 'officer']:
                    total_individuals += 1
                elif estype in ['organization', 'entity', 'company', 'company']:
                    total_entities += 1
                elif estype in ['vessel', 'ship']:
                    total_vessels += 1
                elif estype in ['aircraft']:
                    total_aircraft += 1
            
            print(f"  Types: {dict(source_types)}")
            
    print("\n" + "="*30)
    print("GLOBAL STATISTICS")
    print("="*30)
    print(f"Data Sources: {len(counts)}")
    print(f"Total Unique Programs/Lists: {len(all_programs)}")
    print(f"Sanctioned Individuals: {total_individuals}")
    print(f"Sanctioned Organizations: {total_entities}")
    print(f"Sanctioned Vessels: {total_vessels}")
    print(f"Sanctioned Aircraft: {total_aircraft}")
    print("="*30)

if __name__ == "__main__":
    main()
