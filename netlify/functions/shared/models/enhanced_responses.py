"""
Enhanced Response Models for API

Extended models to support 40+ entity fields including sanctions reasoning,
identifications, addresses, regulations, and timeline events.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date, datetime


class IdentificationDocument(BaseModel):
    """Identification document (passport, ID, tax number)"""
    id: Optional[str] = None
    document_type: str = Field(..., description="Passport, National ID, Tax ID, etc.")
    document_number: str = Field(..., description="Document number")
    issuing_country: Optional[str] = Field(None, description="Issuing country")
    country_code: Optional[str] = Field(None, description="ISO country code")
    issue_date: Optional[date] = Field(None, description="Issue date")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    is_verified: bool = Field(default=False, description="Whether verified")
    source: Optional[str] = Field(None, description="Data source")


class StructuredAddress(BaseModel):
    """Structured address information"""
    id: Optional[str] = None
    full_address: Optional[str] = Field(None, description="Complete address string")
    street: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City")
    region: Optional[str] = Field(None, description="Region/state")
    postal_code: Optional[str] = Field(None, description="Postal/ZIP code")
    country: Optional[str] = Field(None, description="Country name")
    country_code: Optional[str] = Field(None, description="ISO country code")
    address_type: Optional[str] = Field(None, description="Residential, Business, etc.")
    is_primary: bool = Field(default=False, description="Primary address")
    is_current: bool = Field(default=True, description="Current address")


class RegulationDetail(BaseModel):
    """Detailed regulation/programme information"""
    id: Optional[str] = None
    regulation_id: str = Field(..., description="Regulation identifier")
    programme: Optional[str] = Field(None, description="Programme name")
    regulation_type: Optional[str] = Field(None, description="Type of regulation")
    entry_into_force_date: Optional[date] = Field(None, description="Entry date")
    last_amendment_date: Optional[date] = Field(None, description="Last amendment")
    publication_date: Optional[date] = Field(None, description="Publication date")
    legal_basis: Optional[str] = Field(None, description="Legal basis")
    remarks: Optional[str] = Field(None, description="Additional remarks")
    official_journal_url: Optional[str] = Field(None, description="Official URL")


class TimelineEvent(BaseModel):
    """Timeline event (listing, update, amendment)"""
    id: Optional[str] = None
    event_type: str = Field(..., description="Listed, Updated, Amended, Delisted, etc.")
    event_date: date = Field(..., description="Event date")
    event_description: Optional[str] = Field(None, description="Event description")
    regulation_id: Optional[str] = Field(None, description="Related regulation")
    source: Optional[str] = Field(None, description="Event source")


class EnhancedEntity(BaseModel):
    """
    Enhanced entity model with 40+ fields
    
    Includes comprehensive biographical, professional, sanctions, and regulatory data.
    """
    # Core Identity (7 fields)
    id: str = Field(..., description="Entity ID")
    external_id: str = Field(..., description="External/source ID")
    name: str = Field(..., description="Primary name")
    full_name: Optional[str] = Field(None, description="Complete name")
    first_name: Optional[str] = Field(None, description="First name")
    middle_name: Optional[str] = Field(None, description="Middle name")
    last_name: Optional[str] = Field(None, description="Last name")
    title: Optional[str] = Field(None, description="Mr, Mrs, Dr, etc.")
    aliases: List[str] = Field(default_factory=list, description="All name variations")
    
    # Entity Classification
    entity_type: str = Field(..., description="Person, Entity, Vessel, etc.")
    source: str = Field(..., description="Data source (EU, OFAC, etc.)")
    
    # Biographical Data (5 fields)
    birth_date: Optional[date] = Field(None, description="Date of birth")
    birth_place: Optional[str] = Field(None, description="Full birthplace")
    birth_city: Optional[str] = Field(None, description="City of birth")
    birth_country: Optional[str] = Field(None, description="Country of birth")
    gender: Optional[str] = Field(None, description="M, F, or Other")
    
    # Geographic Data (2 fields)
    citizenship_countries: List[str] = Field(default_factory=list, description="Citizenships")
    nationalities: List[str] = Field(default_factory=list, description="Nationalities")
    
    # Identification Documents (array)
    identifications: List[IdentificationDocument] = Field(
        default_factory=list,
        description="Passports, IDs, tax numbers"
    )
    
    # Addresses (array)
    addresses: List[StructuredAddress] = Field(
        default_factory=list,
        description="Structured addresses"
    )
    
    # Professional Information (4 fields)
    positions: List[str] = Field(default_factory=list, description="All positions/roles")
    current_position: Optional[str] = Field(None, description="Primary position")
    business_affiliations: List[str] = Field(default_factory=list, description="Affiliations")
    industry_sectors: List[str] = Field(default_factory=list, description="Industry sectors")
    
    # Sanctions Details (7 fields) - CRITICAL
    is_sanctioned: bool = Field(..., description="Whether sanctioned")
    sanctions_reason: Optional[str] = Field(
        None,
        description="Full text explanation of why sanctioned (CRITICAL)"
    )
    sanctions_summary: Optional[str] = Field(
        None,
        description="Brief summary of sanctions reasoning"
    )
    legal_basis: Optional[str] = Field(None, description="Legal grounds for sanctions")
    legal_articles: List[str] = Field(default_factory=list, description="Legal articles")
    measures: List[str] = Field(
        default_factory=list,
        description="Asset Freeze, Travel Ban, etc."
    )
    sanction_lists: List[str] = Field(default_factory=list, description="Sanction list names")
    
    # Regulatory Data (5 fields)
    regulation_ids: List[str] = Field(default_factory=list, description="Regulation IDs")
    programmes: List[str] = Field(default_factory=list, description="Sanction programmes")
    first_listed_date: Optional[date] = Field(None, description="When first sanctioned")
    last_updated_date: Optional[date] = Field(None, description="Most recent update")
    designation_status: str = Field(
        default="Active",
        description="Active, Delisted, or Amended"
    )
    
    # Regulations (array)
    regulations: List[RegulationDetail] = Field(
        default_factory=list,
        description="Detailed regulation information"
    )
    
    # Timeline (array)
    timeline_events: List[TimelineEvent] = Field(
        default_factory=list,
        description="Chronological event history"
    )
    
    # Risk Assessment (3 fields)
    risk_score: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Risk score (0-100)"
    )
    risk_level: Optional[str] = Field(None, description="Low, Medium, High, Critical")
    risk_factors: List[str] = Field(default_factory=list, description="Risk factors")
    
    # Metadata (5 fields)
    data_completeness_score: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Data completeness (0-100%)"
    )
    last_verified_at: Optional[datetime] = Field(None, description="Last verification")
    source_url: Optional[str] = Field(None, description="Source URL")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    # Match score (for search results)
    match_score: int = Field(
        default=100,
        ge=0,
        le=100,
        description="Search match score (0-100)"
    )


class EnhancedSearchResponse(BaseModel):
    """Enhanced search response with full entity data"""
    query: str = Field(..., description="Search query")
    search_type: str = Field(..., description="exact or fuzzy")
    
    # Results
    results: List[EnhancedEntity] = Field(
        default_factory=list,
        description="Enhanced entities with all fields"
    )
    
    # Statistics
    total_results: int = Field(..., description="Total results found")
    total_sanctioned: int = Field(..., description="Sanctioned entities")
    
    # Metadata
    sources_searched: List[str] = Field(..., description="Sources queried")
    sources_succeeded: List[str] = Field(..., description="Successful sources")
    sources_failed: List[str] = Field(default_factory=list, description="Failed sources")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Search time")


class EntityDetailResponse(BaseModel):
    """Detailed entity response with all related data"""
    entity: EnhancedEntity = Field(..., description="Complete entity data")
    
    # Additional context
    related_entities: List[EnhancedEntity] = Field(
        default_factory=list,
        description="Related entities (same programme, etc.)"
    )
    
    # Metadata
    retrieved_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Retrieval timestamp"
    )


class TimelineResponse(BaseModel):
    """Timeline events response"""
    entity_id: str = Field(..., description="Entity ID")
    entity_name: str = Field(..., description="Entity name")
    events: List[TimelineEvent] = Field(..., description="Timeline events")
    total_events: int = Field(..., description="Total event count")
