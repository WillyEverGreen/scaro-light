"""
Trade Restrictions Tracker

Track sanctions, embargoes, and trade restrictions affecting supply chains.
"""

from typing import Optional
from dataclasses import dataclass
from datetime import datetime

import httpx
from bs4 import BeautifulSoup

from scraping.anti_block import AntiBlocker


@dataclass
class TradeRestriction:
    """Trade restriction/sanction record."""
    restriction_type: str  # sanction, tariff, embargo, export_control
    source_country: str
    target_country: str
    description: str
    commodities_affected: list
    severity: float
    effective_date: Optional[datetime]
    expiry_date: Optional[datetime]
    source_url: str
    is_active: bool = True
    
    def to_dict(self) -> dict:
        return {
            "restriction_type": self.restriction_type,
            "source_country": self.source_country,
            "target_country": self.target_country,
            "description": self.description,
            "commodities_affected": self.commodities_affected,
            "severity": self.severity,
            "effective_date": self.effective_date.isoformat() if self.effective_date else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "source_url": self.source_url,
            "is_active": self.is_active,
        }


# Known major trade restrictions (hardcoded baseline)
KNOWN_RESTRICTIONS = [
    {
        "type": "export_control",
        "source": "USA",
        "target": "CHN",
        "description": "US semiconductor export controls on China - advanced chips and manufacturing equipment",
        "commodities": ["semiconductors", "chip manufacturing equipment", "AI chips"],
        "severity": 0.9,
    },
    {
        "type": "sanction",
        "source": "USA",
        "target": "RUS",
        "description": "US sanctions on Russia - comprehensive trade restrictions",
        "commodities": ["technology", "financial services", "energy equipment"],
        "severity": 0.95,
    },
    {
        "type": "sanction",
        "source": "USA",
        "target": "IRN",
        "description": "US sanctions on Iran - oil and financial restrictions",
        "commodities": ["oil", "petroleum", "financial services"],
        "severity": 0.9,
    },
    {
        "type": "tariff",
        "source": "USA",
        "target": "CHN",
        "description": "US-China trade tariffs on various goods",
        "commodities": ["electronics", "machinery", "consumer goods"],
        "severity": 0.6,
    },
    {
        "type": "export_control",
        "source": "NLD",
        "target": "CHN",
        "description": "Netherlands ASML export restrictions - advanced lithography machines",
        "commodities": ["lithography machines", "semiconductor equipment"],
        "severity": 0.85,
    },
    {
        "type": "export_control",
        "source": "JPN",
        "target": "CHN",
        "description": "Japan semiconductor equipment export restrictions",
        "commodities": ["semiconductor manufacturing equipment"],
        "severity": 0.8,
    },
    {
        "type": "sanction",
        "source": "GBR",
        "target": "RUS",
        "description": "UK sanctions on Russia",
        "commodities": ["technology", "luxury goods", "financial services"],
        "severity": 0.85,
    },
]


class TradeRestrictionsTracker:
    """
    Track trade restrictions and sanctions.
    
    Combines known restrictions with scraped updates.
    """
    
    def __init__(self):
        self.anti_blocker = AntiBlocker()
        self.known_restrictions = [
            TradeRestriction(
                restriction_type=r["type"],
                source_country=r["source"],
                target_country=r["target"],
                description=r["description"],
                commodities_affected=r["commodities"],
                severity=r["severity"],
                effective_date=None,
                expiry_date=None,
                source_url="",
            )
            for r in KNOWN_RESTRICTIONS
        ]
    
    async def get_all_restrictions(self) -> list[TradeRestriction]:
        """Get all known trade restrictions."""
        # Return baseline + any scraped updates
        return self.known_restrictions
    
    async def scrape_ofac_updates(self) -> list[dict]:
        """
        Scrape OFAC sanctions updates.
        
        Note: OFAC website may block automated access.
        """
        updates = []
        
        try:
            async with httpx.AsyncClient() as client:
                # OFAC recent actions page
                response = await client.get(
                    "https://ofac.treasury.gov/recent-actions",
                    headers=self.anti_blocker.get_headers(),
                    timeout=30,
                    follow_redirects=True,
                )
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "lxml")
                    
                    # Parse recent actions
                    for item in soup.select(".views-row"):
                        try:
                            title_el = item.select_one("h3, .views-field-title")
                            date_el = item.select_one(".date-display-single, .views-field-created")
                            
                            if title_el:
                                updates.append({
                                    "title": title_el.get_text(strip=True),
                                    "date": date_el.get_text(strip=True) if date_el else "",
                                    "source": "OFAC",
                                })
                        except Exception:
                            continue
        except Exception as e:
            print(f"OFAC scrape error: {e}")
        
        return updates
    
    def check_country_pair(
        self,
        source_country: str,
        target_country: str,
    ) -> list[TradeRestriction]:
        """Check restrictions between two countries."""
        return [
            r for r in self.known_restrictions
            if r.source_country == source_country and r.target_country == target_country
        ]
    
    def get_restrictions_by_commodity(
        self,
        commodity: str,
    ) -> list[TradeRestriction]:
        """Get restrictions affecting a specific commodity."""
        commodity_lower = commodity.lower()
        return [
            r for r in self.known_restrictions
            if any(commodity_lower in c.lower() for c in r.commodities_affected)
        ]
    
    def get_high_risk_routes(self) -> list[dict]:
        """Get high-risk trade routes based on restrictions."""
        routes = []
        
        for r in self.known_restrictions:
            if r.severity >= 0.7:
                routes.append({
                    "source": r.source_country,
                    "target": r.target_country,
                    "risk_score": r.severity,
                    "restriction_type": r.restriction_type,
                    "commodities": r.commodities_affected,
                })
        
        return sorted(routes, key=lambda x: x["risk_score"], reverse=True)


# Global instance
trade_tracker = TradeRestrictionsTracker()
