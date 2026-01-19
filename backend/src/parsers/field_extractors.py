"""
Field Extraction Utilities

Utility functions for extracting and normalizing various field types
from sanctions data sources.
"""

import re
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from dateutil import parser as date_parser


class FieldExtractor:
    """Utility class for extracting and normalizing fields"""
    
    @staticmethod
    def extract_name_components(name_element: Any) -> Dict[str, Optional[str]]:
        """
        Extract first, middle, last name from various formats
        
        Handles:
        - Separate firstName/middleName/lastName fields
        - wholeName parsing
        - Multiple name formats
        """
        # This will be implemented based on specific XML structure
        return {
            'first_name': None,
            'middle_name': None,
            'last_name': None,
            'full_name': None
        }
    
    @staticmethod
    def parse_date_flexible(date_string: str) -> Optional[date]:
        """
        Parse date from multiple formats:
        - DD/MM/YYYY (EU format)
        - YYYY-MM-DD (ISO)
        - MM/DD/YYYY (US format)
        - Text dates (e.g., "2 January 1968")
        
        Returns:
            date object or None if parsing fails
        """
        if not date_string:
            return None
        
        # Clean string
        date_string = date_string.strip()
        
        if not date_string:
            return None
        
        # Try EU format first (DD/MM/YYYY)
        try:
            return datetime.strptime(date_string, '%d/%m/%Y').date()
        except:
            pass
        
        # Try ISO format (YYYY-MM-DD)
        try:
            return datetime.strptime(date_string, '%Y-%m-%d').date()
        except:
            pass
        
        # Try US format (MM/DD/YYYY)
        try:
            return datetime.strptime(date_string, '%m/%d/%Y').date()
        except:
            pass
        
        # Try dateutil parser (handles many formats)
        try:
            parsed = date_parser.parse(date_string, dayfirst=True)
            # Sanity check year
            if 1900 <= parsed.year <= datetime.now().year + 1:
                return parsed.date()
        except:
            pass
        
        return None
    
    @staticmethod
    def parse_separated_date(day: str, month: str, year: str) -> Optional[date]:
        """
        Parse date from separated components
        
        Args:
            day: Day as string (1-31)
            month: Month as string (1-12)
            year: Year as string (YYYY)
        
        Returns:
            date object or None if invalid
        """
        try:
            # Default to 1 if day/month missing
            d = int(day) if day and day != '0' else 1
            m = int(month) if month and month != '0' else 1
            y = int(year) if year and year != '0' else None
            
            if y is None:
                return None
            
            # Validate ranges
            if not (1 <= d <= 31 and 1 <= m <= 12 and 1900 <= y <= datetime.now().year + 1):
                return None
            
            return date(y, m, d)
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def normalize_country_code(country: str) -> str:
        """
        Normalize country name to ISO 3166-1 alpha-2 code
        
        Args:
            country: Country name or code
        
        Returns:
            2-letter ISO code or original if not found
        """
        if not country:
            return ''
        
        # Comprehensive country mapping
        country_map = {
            'RUSSIA': 'RU',
            'RUSSIAN FEDERATION': 'RU',
            'UNITED KINGDOM': 'GB',
            'GREAT BRITAIN': 'GB',
            'UNITED STATES': 'US',
            'UNITED STATES OF AMERICA': 'US',
            'USA': 'US',
            'CHINA': 'CN',
            'PEOPLE\'S REPUBLIC OF CHINA': 'CN',
            'FRANCE': 'FR',
            'GERMANY': 'DE',
            'ITALY': 'IT',
            'SPAIN': 'ES',
            'CANADA': 'CA',
            'JAPAN': 'JP',
            'SOUTH KOREA': 'KR',
            'KOREA, REPUBLIC OF': 'KR',
            'NORTH KOREA': 'KP',
            'KOREA, DEMOCRATIC PEOPLE\'S REPUBLIC OF': 'KP',
            'IRAN': 'IR',
            'ISLAMIC REPUBLIC OF IRAN': 'IR',
            'SYRIA': 'SY',
            'SYRIAN ARAB REPUBLIC': 'SY',
            'UKRAINE': 'UA',
            'BELARUS': 'BY',
            'VENEZUELA': 'VE',
            'CUBA': 'CU',
            'MYANMAR': 'MM',
            'BURMA': 'MM',
            'LIBYA': 'LY',
            'YEMEN': 'YE',
            'SOMALIA': 'SO',
            'SUDAN': 'SD',
            'SOUTH SUDAN': 'SS',
            'ZIMBABWE': 'ZW',
            'NICARAGUA': 'NI',
            'LEBANON': 'LB',
            'IRAQ': 'IQ',
            'AFGHANISTAN': 'AF',
            'PAKISTAN': 'PK',
            'INDIA': 'IN',
            'BRAZIL': 'BR',
            'MEXICO': 'MX',
            'ARGENTINA': 'AR',
            'AUSTRALIA': 'AU',
            'NEW ZEALAND': 'NZ',
            'SOUTH AFRICA': 'ZA',
            'EGYPT': 'EG',
            'TURKEY': 'TR',
            'SAUDI ARABIA': 'SA',
            'UNITED ARAB EMIRATES': 'AE',
            'UAE': 'AE',
            'QATAR': 'QA',
            'KUWAIT': 'KW',
            'BAHRAIN': 'BH',
            'OMAN': 'OM',
            'ISRAEL': 'IL',
            'PALESTINE': 'PS',
            'JORDAN': 'JO',
            'MOROCCO': 'MA',
            'ALGERIA': 'DZ',
            'TUNISIA': 'TN',
            'ETHIOPIA': 'ET',
            'KENYA': 'KE',
            'NIGERIA': 'NG',
            'GHANA': 'GH',
            'SENEGAL': 'SN',
            'TANZANIA': 'TZ',
            'UGANDA': 'UG',
            'DEMOCRATIC REPUBLIC OF THE CONGO': 'CD',
            'CONGO': 'CG',
            'ANGOLA': 'AO',
            'MOZAMBIQUE': 'MZ',
            'MADAGASCAR': 'MG',
            'CAMEROON': 'CM',
            'IVORY COAST': 'CI',
            'CÔTE D\'IVOIRE': 'CI',
            'MALI': 'ML',
            'BURKINA FASO': 'BF',
            'NIGER': 'NE',
            'CHAD': 'TD',
            'GUINEA': 'GN',
            'RWANDA': 'RW',
            'BURUNDI': 'BI',
            'BENIN': 'BJ',
            'TOGO': 'TG',
            'SIERRA LEONE': 'SL',
            'LIBERIA': 'LR',
            'MAURITANIA': 'MR',
            'ERITREA': 'ER',
            'DJIBOUTI': 'DJ',
            'CENTRAL AFRICAN REPUBLIC': 'CF',
            'GABON': 'GA',
            'EQUATORIAL GUINEA': 'GQ',
            'ZAMBIA': 'ZM',
            'MALAWI': 'MW',
            'BOTSWANA': 'BW',
            'NAMIBIA': 'NA',
            'LESOTHO': 'LS',
            'SWAZILAND': 'SZ',
            'ESWATINI': 'SZ',
            'MAURITIUS': 'MU',
            'COMOROS': 'KM',
            'SEYCHELLES': 'SC',
            'CAPE VERDE': 'CV',
            'SÃO TOMÉ AND PRÍNCIPE': 'ST',
        }
        
        country_upper = country.upper().strip()
        
        # Already a 2-letter code
        if len(country_upper) == 2 and country_upper.isalpha():
            return country_upper
        
        # Look up in map
        return country_map.get(country_upper, country_upper)
    
    @staticmethod
    def extract_gender(gender_string: str) -> Optional[str]:
        """
        Normalize gender from various formats
        
        Args:
            gender_string: Gender indicator (M, F, Male, Female, Mr, Mrs, etc.)
        
        Returns:
            'M', 'F', or None
        """
        if not gender_string:
            return None
        
        gender_map = {
            'M': 'M',
            'MALE': 'M',
            'MR': 'M',
            'MR.': 'M',
            'F': 'F',
            'FEMALE': 'F',
            'MRS': 'F',
            'MRS.': 'F',
            'MS': 'F',
            'MS.': 'F',
            'MISS': 'F',
            'MISS.': 'F'
        }
        
        return gender_map.get(gender_string.upper().strip())
    
    @staticmethod
    def clean_text(text: str) -> str:
        """
        Clean and normalize text
        
        - Removes extra whitespace
        - Removes control characters
        - Normalizes line breaks
        """
        if not text:
            return ""
        
        # Remove control characters
        text = re.sub(r'[\x00-\x1F\x7F]', '', text)
        
        # Normalize whitespace
        text = " ".join(text.split())
        
        return text.strip()
    
    @staticmethod
    def deduplicate_list(items: List[str]) -> List[str]:
        """
        Remove duplicates while preserving order
        
        Case-insensitive deduplication
        """
        if not items:
            return []
        
        seen = set()
        result = []
        
        for item in items:
            if not item:
                continue
            
            item_lower = item.lower().strip()
            
            if item_lower and item_lower not in seen:
                seen.add(item_lower)
                result.append(item.strip())
        
        return result
    
    @staticmethod
    def extract_measures_from_text(text: str) -> List[str]:
        """
        Extract sanctions measures from text
        
        Looks for common measures like:
        - Asset Freeze
        - Travel Ban
        - Arms Embargo
        - etc.
        """
        if not text:
            return []
        
        text_upper = text.upper()
        measures = []
        
        measure_keywords = {
            'ASSET FREEZE': 'Asset Freeze',
            'FREEZE': 'Asset Freeze',
            'FREEZING': 'Asset Freeze',
            'TRAVEL BAN': 'Travel Ban',
            'TRAVEL RESTRICTION': 'Travel Ban',
            'ARMS EMBARGO': 'Arms Embargo',
            'WEAPONS EMBARGO': 'Arms Embargo',
            'TRADE RESTRICTION': 'Trade Restrictions',
            'IMPORT BAN': 'Import Ban',
            'EXPORT BAN': 'Export Ban',
            'INVESTMENT BAN': 'Investment Ban',
            'FINANCIAL RESTRICTION': 'Financial Restrictions'
        }
        
        for keyword, measure in measure_keywords.items():
            if keyword in text_upper and measure not in measures:
                measures.append(measure)
        
        # Default measures for EU sanctions
        if not measures:
            measures = ['Asset Freeze', 'Travel Ban']
        
        return measures
    
    @staticmethod
    def summarize_text(text: str, max_length: int = 200) -> str:
        """
        Create a summary of text by truncating intelligently
        
        Args:
            text: Full text
            max_length: Maximum length of summary
        
        Returns:
            Summarized text with ellipsis if truncated
        """
        if not text:
            return ""
        
        text = FieldExtractor.clean_text(text)
        
        if len(text) <= max_length:
            return text
        
        # Try to break at sentence
        truncated = text[:max_length]
        
        # Find last period, exclamation, or question mark
        last_sentence = max(
            truncated.rfind('.'),
            truncated.rfind('!'),
            truncated.rfind('?')
        )
        
        if last_sentence > max_length * 0.7:  # At least 70% of desired length
            return truncated[:last_sentence + 1]
        
        # Otherwise break at word
        last_space = truncated.rfind(' ')
        if last_space > 0:
            return truncated[:last_space] + '...'
        
        return truncated + '...'
