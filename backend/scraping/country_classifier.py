"""
Country Classifier

Classify and extract country information from text content.
"""

import re
from typing import Optional
from dataclasses import dataclass

import spacy

# Load spaCy
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")


# Country name to ISO code mapping (partial list)
COUNTRY_MAPPING = {
    "united states": "USA", "usa": "USA", "us": "USA", "america": "USA",
    "china": "CHN", "chinese": "CHN", "prc": "CHN",
    "japan": "JPN", "japanese": "JPN",
    "germany": "DEU", "german": "DEU",
    "united kingdom": "GBR", "uk": "GBR", "britain": "GBR", "british": "GBR",
    "france": "FRA", "french": "FRA",
    "india": "IND", "indian": "IND",
    "south korea": "KOR", "korea": "KOR", "korean": "KOR",
    "taiwan": "TWN", "taiwanese": "TWN",
    "vietnam": "VNM", "vietnamese": "VNM",
    "mexico": "MEX", "mexican": "MEX",
    "canada": "CAN", "canadian": "CAN",
    "brazil": "BRA", "brazilian": "BRA",
    "russia": "RUS", "russian": "RUS",
    "australia": "AUS", "australian": "AUS",
    "netherlands": "NLD", "dutch": "NLD",
    "singapore": "SGP", "singaporean": "SGP",
    "malaysia": "MYS", "malaysian": "MYS",
    "indonesia": "IDN", "indonesian": "IDN",
    "thailand": "THA", "thai": "THA",
    "philippines": "PHL", "philippine": "PHL", "filipino": "PHL",
    "italy": "ITA", "italian": "ITA",
    "spain": "ESP", "spanish": "ESP",
    "saudi arabia": "SAU", "saudi": "SAU",
    "uae": "ARE", "emirates": "ARE", "dubai": "ARE",
    "israel": "ISR", "israeli": "ISR",
    "turkey": "TUR", "turkish": "TUR",
    "poland": "POL", "polish": "POL",
    "switzerland": "CHE", "swiss": "CHE",
    "sweden": "SWE", "swedish": "SWE",
    "belgium": "BEL", "belgian": "BEL",
    "austria": "AUT", "austrian": "AUT",
    "norway": "NOR", "norwegian": "NOR",
    "denmark": "DNK", "danish": "DNK",
    "finland": "FIN", "finnish": "FIN",
    "ireland": "IRL", "irish": "IRL",
    "portugal": "PRT", "portuguese": "PRT",
    "greece": "GRC", "greek": "GRC",
    "czech republic": "CZE", "czech": "CZE",
    "romania": "ROU", "romanian": "ROU",
    "hungary": "HUN", "hungarian": "HUN",
    "south africa": "ZAF",
    "egypt": "EGY", "egyptian": "EGY",
    "nigeria": "NGA", "nigerian": "NGA",
    "argentina": "ARG", "argentine": "ARG",
    "chile": "CHL", "chilean": "CHL",
    "colombia": "COL", "colombian": "COL",
    "peru": "PER", "peruvian": "PER",
    "iran": "IRN", "iranian": "IRN",
    "iraq": "IRQ", "iraqi": "IRQ",
    "pakistan": "PAK", "pakistani": "PAK",
    "bangladesh": "BGD", "bangladeshi": "BGD",
    "ukraine": "UKR", "ukrainian": "UKR",
    "north korea": "PRK", "dprk": "PRK",
}


@dataclass
class CountryMention:
    """Country mention in text."""
    name: str
    code: str
    count: int
    context: list  # Surrounding text snippets


class CountryClassifier:
    """
    Classify content by country/region.
    
    Uses NLP to extract geographic entities and map to ISO codes.
    """
    
    def __init__(self):
        self.country_mapping = COUNTRY_MAPPING
    
    def extract_countries(self, text: str) -> list[CountryMention]:
        """
        Extract country mentions from text.
        
        Args:
            text: Input text
            
        Returns:
            List of CountryMention objects
        """
        doc = nlp(text)
        
        # Extract GPE (geopolitical entities) from spaCy
        country_counts = {}
        country_contexts = {}
        
        for ent in doc.ents:
            if ent.label_ == "GPE":
                country_name = ent.text.lower()
                code = self.country_mapping.get(country_name)
                
                if code:
                    if code not in country_counts:
                        country_counts[code] = 0
                        country_contexts[code] = []
                    
                    country_counts[code] += 1
                    
                    # Get surrounding context
                    start = max(0, ent.start_char - 50)
                    end = min(len(text), ent.end_char + 50)
                    context = text[start:end].strip()
                    if context and len(country_contexts[code]) < 3:
                        country_contexts[code].append(context)
        
        # Also do direct string matching for common variations
        text_lower = text.lower()
        for name, code in self.country_mapping.items():
            if name in text_lower:
                if code not in country_counts:
                    country_counts[code] = 0
                    country_contexts[code] = []
                
                # Count occurrences
                count = len(re.findall(rf'\b{re.escape(name)}\b', text_lower))
                if count > country_counts[code]:
                    country_counts[code] = count
        
        # Convert to CountryMention objects
        result = []
        for code, count in country_counts.items():
            # Find full name for code
            name = next(
                (n for n, c in self.country_mapping.items() if c == code and len(n) > 3),
                code
            )
            result.append(CountryMention(
                name=name.title(),
                code=code,
                count=count,
                context=country_contexts.get(code, []),
            ))
        
        # Sort by count descending
        result.sort(key=lambda x: x.count, reverse=True)
        return result
    
    def get_primary_country(self, text: str) -> Optional[str]:
        """Get the most mentioned country code."""
        mentions = self.extract_countries(text)
        return mentions[0].code if mentions else None
    
    def classify_by_region(self, country_codes: list[str]) -> dict[str, list[str]]:
        """Group countries by region."""
        regions = {
            "Asia Pacific": ["CHN", "JPN", "KOR", "TWN", "VNM", "THA", "MYS", "SGP", "IDN", "PHL", "IND", "AUS", "BGD", "PAK"],
            "Europe": ["DEU", "GBR", "FRA", "ITA", "ESP", "NLD", "BEL", "CHE", "SWE", "NOR", "DNK", "FIN", "AUT", "POL", "CZE", "ROU", "HUN", "GRC", "PRT", "IRL", "UKR"],
            "North America": ["USA", "CAN", "MEX"],
            "South America": ["BRA", "ARG", "CHL", "COL", "PER"],
            "Middle East": ["SAU", "ARE", "ISR", "TUR", "IRN", "IRQ"],
            "Africa": ["ZAF", "EGY", "NGA"],
        }
        
        result = {}
        for region, region_codes in regions.items():
            matching = [c for c in country_codes if c in region_codes]
            if matching:
                result[region] = matching
        
        return result


# Global instance
country_classifier = CountryClassifier()
