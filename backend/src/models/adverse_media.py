"""Adverse media data models for M2: Adverse Media Service."""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AdverseMediaRequest(BaseModel):
    """Input for adverse media search."""
    name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Entity name (required)"
    )
    entity_type: str = Field(
        default="individual",
        description="'individual' or 'organization'"
    )
    country: Optional[str] = Field(
        default=None,
        description="Country for context (e.g., 'France')"
    )
    aliases: List[str] = Field(
        default_factory=list,
        description="Alternative names to also search"
    )
    max_results: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Max results to return after dedup"
    )


class AdverseMediaHit(BaseModel):
    """Single adverse media result."""
    title: str
    snippet: str
    url: str
    source_name: str
    published_date: Optional[str] = None
    severity: str = Field(
        description="'high' | 'medium' | 'low'"
    )
    categories: List[str] = Field(
        default_factory=list,
        description="e.g., ['corruption', 'investigation']"
    )
    query_used: str = Field(
        description="Which search query produced this hit"
    )


class AdverseMediaResponse(BaseModel):
    """Complete adverse media search result."""
    entity_name: str
    total_hits: int = 0
    high_severity_count: int = 0
    medium_severity_count: int = 0
    low_severity_count: int = 0
    hits: List[AdverseMediaHit] = Field(default_factory=list)
    queries_executed: List[str] = Field(default_factory=list)
    search_provider: str = "serper"
    search_timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat()
    )
    error: Optional[str] = None
