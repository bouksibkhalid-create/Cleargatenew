"""
Base Downloader for Sanctions Data Sources

Abstract base class providing common functionality:
- HTTP requests with retry logic
- XML/CSV parsing utilities
- Caching and update tracking
- Error handling and logging
"""

import os
import json
import hashlib
import requests
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from tenacity import retry, stop_after_attempt, wait_exponential

from src.utils.logger import get_logger

logger = get_logger(__name__)

# Cache directory
CACHE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "sanctions_cache"


class BaseDownloader(ABC):
    """
    Abstract base class for sanctions data downloaders.
    
    Provides:
    - HTTP download with retry
    - XML/CSV parsing helpers
    - Local file caching
    - Update tracking
    """
    
    # Override in subclasses
    SOURCE_NAME: str = "Unknown"
    SOURCE_COUNTRY: str = "XX"
    DATA_URL: str = ""
    UPDATE_FREQUENCY_HOURS: int = 24
    
    def __init__(self):
        self.cache_dir = CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._last_update: Optional[datetime] = None
    
    @property
    def cache_file(self) -> Path:
        """Path to cached data file"""
        safe_name = self.SOURCE_NAME.lower().replace(" ", "_")
        return self.cache_dir / f"{safe_name}_data.json"
    
    @property
    def metadata_file(self) -> Path:
        """Path to cache metadata file"""
        safe_name = self.SOURCE_NAME.lower().replace(" ", "_")
        return self.cache_dir / f"{safe_name}_meta.json"
    
    def needs_update(self) -> bool:
        """Check if data needs to be refreshed"""
        if not self.cache_file.exists():
            return True
        
        if not self.metadata_file.exists():
            return True
        
        try:
            with open(self.metadata_file, 'r') as f:
                meta = json.load(f)
                last_update = datetime.fromisoformat(meta['last_update'])
                age_hours = (datetime.utcnow() - last_update).total_seconds() / 3600
                return age_hours > self.UPDATE_FREQUENCY_HOURS
        except Exception:
            return True
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def _download_raw(self, url: str = None) -> bytes:
        """Download raw data with retry logic"""
        url = url or self.DATA_URL
        
        logger.info(
            "downloading_sanctions_data",
            source=self.SOURCE_NAME,
            url=url
        )
        
        # Use browser-like headers to avoid 403 from gov sites
        response = requests.get(
            url,
            timeout=120,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/xml, text/xml, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
            }
        )
        response.raise_for_status()
        
        logger.info(
            "download_complete",
            source=self.SOURCE_NAME,
            size_bytes=len(response.content)
        )
        
        return response.content
    
    def _parse_xml(self, content: bytes) -> ET.Element:
        """Parse XML content"""
        return ET.fromstring(content)
    
    def _save_cache(self, entities: List[Dict]) -> None:
        """Save entities to cache file"""
        with open(self.cache_file, 'w') as f:
            json.dump(entities, f)
        
        with open(self.metadata_file, 'w') as f:
            json.dump({
                'source': self.SOURCE_NAME,
                'last_update': datetime.utcnow().isoformat(),
                'entity_count': len(entities),
                'data_hash': hashlib.md5(json.dumps(entities).encode()).hexdigest()
            }, f)
        
        logger.info(
            "cache_saved",
            source=self.SOURCE_NAME,
            count=len(entities)
        )
    
    def _load_cache(self) -> Optional[List[Dict]]:
        """Load entities from cache"""
        if not self.cache_file.exists():
            return None
        
        try:
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error("cache_load_error", error=str(e))
            return None
    
    @abstractmethod
    def download(self) -> List[Dict]:
        """
        Download and parse data from source.
        
        Returns:
            List of entity dictionaries in source-specific format
        """
        pass
    
    def get_entities(self, force_refresh: bool = False) -> List[Dict]:
        """
        Get entities, from cache or fresh download.
        
        Args:
            force_refresh: Force new download even if cache is fresh
            
        Returns:
            List of entity dictionaries
        """
        if not force_refresh and not self.needs_update():
            cached = self._load_cache()
            if cached is not None:
                logger.info(
                    "using_cached_data",
                    source=self.SOURCE_NAME,
                    count=len(cached)
                )
                return cached
        
        # Download fresh data
        entities = self.download()
        self._save_cache(entities)
        return entities
    
    def search(self, query: str, entities: List[Dict] = None) -> List[Dict]:
        """
        Search entities by name (basic implementation).
        
        Override in subclass for optimized search.
        """
        if entities is None:
            entities = self.get_entities()
        
        query_lower = query.lower()
        results = []
        
        for entity in entities:
            name = entity.get('name', '').lower()
            aliases = [a.lower() for a in entity.get('aliases', [])]
            
            if query_lower in name or any(query_lower in a for a in aliases):
                results.append(entity)
        
        return results
