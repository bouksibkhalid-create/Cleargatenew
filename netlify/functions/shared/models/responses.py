"""Response models for API responses"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal, Union
from datetime import datetime
from src.models.graph_models import OffshoreEntity


class SanctionProgram(BaseModel):
    """Individual sanction program details"""
    program: str = Field(..., description="Sanction program name")
    authority: Optional[str] = Field(None, description="Sanctioning authority")
    start_date: Optional[str] = Field(None, description="Sanction start date")
    reason: Optional[str] = Field(None, description="Reason for sanction")


class OpenSanctionsEntity(BaseModel):
    """Single entity from OpenSanctions"""
    id: str = Field(..., description="OpenSanctions entity ID")
    name: str = Field(..., description="Entity name")
    entity_schema: str = Field(..., description="Entity type (Person, Company, etc.)", alias="schema")
    
    # Personal/Entity Information
    aliases: List[str] = Field(default_factory=list, description="Alternative names")
    birth_date: Optional[str] = Field(None, description="Date of birth (YYYY-MM-DD)")
    death_date: Optional[str] = Field(None, description="Date of death (YYYY-MM-DD)")
    nationalities: List[str] = Field(default_factory=list, description="Nationalities (ISO codes)")
    countries: List[str] = Field(default_factory=list, description="Associated countries")
    
    # Sanction Information
    is_sanctioned: bool = Field(..., description="Whether entity is sanctioned")
    sanction_programs: List[SanctionProgram] = Field(
        default_factory=list, 
        description="List of sanction programs"
    )
    
    # Metadata
    datasets: List[str] = Field(default_factory=list, description="Source datasets")
    first_seen: Optional[str] = Field(None, description="First seen timestamp")
    last_seen: Optional[str] = Field(None, description="Last updated timestamp")
    
    # Additional properties
    properties: Dict[str, Any] = Field(
        default_factory=dict, 
        description="Additional entity properties"
    )
    
    # Links
    url: str = Field(..., description="OpenSanctions entity URL")
    
    # Enhanced with fuzzy matching (Module 2)
    match_score: int = Field(
        default=100,
        ge=0,
        le=100,
        description="Match score (0-100, 100 = exact match)"
    )
    source: Literal["opensanctions"] = "opensanctions"


class SanctionsIoEntity(BaseModel):
    """Single entity from Sanctions.io"""
    id: str = Field(..., description="Sanctions.io entity ID")
    name: str = Field(..., description="Entity name")
    entity_type: str = Field(..., description="Individual or Entity")
    
    # Sanction Information
    list_type: str = Field(..., description="SDN, Non-SDN, etc.")
    programs: List[str] = Field(default_factory=list, description="Sanction programs")
    
    # Personal/Entity Information
    aliases: List[str] = Field(default_factory=list, description="Alternative names")
    birth_dates: List[str] = Field(default_factory=list, description="Dates of birth")
    nationalities: List[str] = Field(default_factory=list, description="Nationalities")
    
    # Address Information
    addresses: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Addresses with country info"
    )
    
    # Additional Info
    remarks: Optional[str] = Field(None, description="Additional remarks")
    sources: List[str] = Field(default_factory=list, description="Source URLs")
    
    # Metadata
    is_sanctioned: bool = Field(default=True, description="Always true for Sanctions.io")
    
    # Fuzzy Matching
    match_score: int = Field(
        default=100,
        ge=0,
        le=100,
        description="Match score (0-100)"
    )
    source: Literal["sanctions_io"] = "sanctions_io"


class SourceResults(BaseModel):
    """Results from a specific source"""
    found: bool = Field(..., description="Whether any results were found")
    count: int = Field(default=0, description="Number of results")
    sanctioned_count: int = Field(default=0, description="Number of sanctioned entities")
    error: Optional[str] = Field(None, description="Error message if source failed")
    results: List[Union[OpenSanctionsEntity, SanctionsIoEntity, OffshoreEntity]] = Field(
        default_factory=list, 
        description="List of entities"
    )


class AggregatedResults(BaseModel):
    """Results aggregated by source"""
    opensanctions: SourceResults
    sanctions_io: SourceResults
    offshore_leaks: SourceResults


class SearchResponse(BaseModel):
    """Enhanced response model for multi-source search"""
    query: str = Field(..., description="Original search query")
    search_type: Literal["exact", "fuzzy"] = Field(..., description="Search mode used")
    
    # Aggregated results
    results_by_source: AggregatedResults = Field(
        ..., 
        description="Results grouped by source"
    )
    
    # Combined results (all sources)
    all_results: List[Union[OpenSanctionsEntity, SanctionsIoEntity]] = Field(
        default_factory=list,
        description="All results from all sources, sorted by match score"
    )
    
    # Summary statistics
    total_results: int = Field(..., description="Total results across all sources")
    total_sanctioned: int = Field(..., description="Total sanctioned entities found")
    sources_searched: List[str] = Field(..., description="Sources that were queried")
    sources_succeeded: List[str] = Field(..., description="Sources that returned successfully")
    sources_failed: List[str] = Field(default_factory=list, description="Sources that failed")
    
    # Metadata
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Search timestamp"
    )
    
    # Fuzzy matching info
    fuzzy_threshold: Optional[int] = Field(
        None,
        description="Fuzzy threshold used (if fuzzy search)"
    )


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[str] = Field(None, description="Additional error details")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Error timestamp"
    )
