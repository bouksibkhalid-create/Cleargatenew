#!/usr/bin/env python3
"""
Sync Sanctions Data to Supabase

Downloads sanctions data from government sources and syncs to Supabase.
Run this script periodically (e.g., daily via cron or Supabase pg_cron).

Usage:
    python -m scripts.sync_to_supabase [--source SOURCE] [--force]
"""

import argparse
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.services.data_sources.ofac_downloader import OFACDownloader
from src.services.data_sources.eu_downloader import EUDownloader
from src.services.data_sources.uk_downloader import UKDownloader
from src.services.data_sources.un_downloader import UNDownloader
from src.services.data_sources.canada_downloader import CanadaDownloader
from src.services.data_sources.data_normalizer import SanctionsNormalizer
from src.services.data_sources.supabase_search_service import get_supabase_search_service
from src.services.supabase_client import get_supabase_client
from src.utils.logger import get_logger

logger = get_logger(__name__)


def sync_source(downloader_class, source_name: str, normalizer_source: str, force: bool = False) -> int:
    """Generic sync function for any sanctions source"""
    logger.info(f"sync_{normalizer_source.lower()}_started", force=force)
    
    try:
        # Update source status
        client = get_supabase_client()
        client.table('sanctions_sources').update({
            'status': 'syncing'
        }).eq('name', source_name).execute()
        
        # Download data
        downloader = downloader_class()
        raw_entities = downloader.get_entities(force_refresh=force)
        
        # Normalize
        normalizer = SanctionsNormalizer()
        entities = normalizer.normalize_all(raw_entities, normalizer_source)
        
        logger.info(f"sync_{normalizer_source.lower()}_normalized", count=len(entities))
        
        # Sync to Supabase
        service = get_supabase_search_service()
        count = service.bulk_upsert_entities(entities, source_name)
        
        logger.info(f"sync_{normalizer_source.lower()}_complete", count=count)
        return count
        
    except Exception as e:
        logger.error(f"sync_{normalizer_source.lower()}_error", error=str(e))
        
        # Update source status to error
        try:
            client = get_supabase_client()
            client.table('sanctions_sources').update({
                'status': 'error',
                'error_message': str(e)
            }).eq('name', source_name).execute()
        except:
            pass
        
        raise


def sync_ofac(force: bool = False) -> int:
    return sync_source(OFACDownloader, 'OFAC SDN List', 'OFAC', force)


def sync_eu(force: bool = False) -> int:
    return sync_source(EUDownloader, 'EU Sanctions', 'EU', force)


def sync_uk(force: bool = False) -> int:
    return sync_source(UKDownloader, 'UK HM Treasury', 'UK', force)


def sync_un(force: bool = False) -> int:
    return sync_source(UNDownloader, 'UN Sanctions', 'UN', force)


def sync_canada(force: bool = False) -> int:
    return sync_source(CanadaDownloader, 'Canada SEMA', 'Canada', force)


def main():
    parser = argparse.ArgumentParser(description='Sync sanctions data to Supabase')
    parser.add_argument(
        '--force', 
        action='store_true',
        help='Force re-download even if cache is fresh'
    )
    parser.add_argument(
        '--source',
        choices=['ofac', 'eu', 'uk', 'un', 'canada', 'all'],
        default='all',
        help='Which source to sync (default: all)'
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Sanctions Data Sync to Supabase")
    print("=" * 60)
    
    sources = {
        'ofac': ('OFAC SDN List', sync_ofac),
        'uk': ('UK HM Treasury', sync_uk),
        'un': ('UN Sanctions', sync_un),
        'canada': ('Canada SEMA', sync_canada),
        'eu': ('EU Sanctions', sync_eu),
    }
    
    # Determine which sources to sync
    if args.source == 'all':
        to_sync = ['ofac', 'uk', 'un', 'canada', 'eu']
    else:
        to_sync = [args.source]
    
    total = 0
    step = 0
    
    for source_key in to_sync:
        step += 1
        source_name, sync_fn = sources[source_key]
        print(f"\n[{step}/{len(to_sync)}] Syncing {source_name}...")
        
        try:
            count = sync_fn(force=args.force)
            print(f"  ✓ Synced {count} entities")
            total += count
        except Exception as e:
            print(f"  ✗ Failed: {e}")
    
    print("\n" + "=" * 60)
    print(f"Total entities synced: {total}")
    print("=" * 60)


if __name__ == '__main__':
    main()
