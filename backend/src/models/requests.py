"""Request models for API validation"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Literal


class SearchRequest(BaseModel):
    """
    Enhanced request model for entity search with multi-source support
    """
    query: str = Field(
        ..., 
        min_length=2,
        max_length=200,
        description="Name or entity to search for"
    )
    
    search_type: Literal["exact", "fuzzy"] = Field(
        default="exact",
        description="Search mode: exact for perfect matches, fuzzy for similar names"
    )
    
    sources: List[Literal["opensanctions", "sanctions_io", "offshore_leaks"]] = Field(
        default=["opensanctions", "sanctions_io"],
        description="Data sources to search (opensanctions, sanctions_io, offshore_leaks)"
    )
    
    limit: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of results per source"
    )
    
    fuzzy_threshold: int = Field(
        default=80,
        ge=50,
        le=100,
        description="Minimum similarity score for fuzzy matching (0-100)"
    )
    
    @field_validator('query')
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Sanitize and validate search query"""
        v = v.strip()
        
        if not v:
            raise ValueError("Query cannot be empty")
        
        # Basic sanitization
        v = ''.join(char for char in v if char.isprintable())
        
        return v
    
    @field_validator('sources')
    @classmethod
    def validate_sources(cls, v: List[str]) -> List[str]:
        """Ensure at least one source is selected"""
        if not v or len(v) == 0:
            raise ValueError("At least one source must be selected")
        return v
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "query": "Vladimir Putin",
                    "search_type": "fuzzy",
                    "sources": ["opensanctions", "sanctions_io", "offshore_leaks"],
                    "limit": 10,
                    "fuzzy_threshold": 80
                }
            ]
        }
    }
