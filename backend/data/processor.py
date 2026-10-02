"""
Data Processing Pipeline

Process scraped data, extract entities, classify events, and store in databases.
Uses NVIDIA for intelligent entity extraction and risk scoring.
"""

import asyncio
import hashlib
import logging
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import async_session_factory
from db.models import Event, EventCategory, EventSeverity, Country, Vendor, RiskScore
from db.neo4j_client import neo4j_client
from db.qdrant_client import qdrant_client
from ai.embeddings import embeddings_service
from scraping.country_classifier import country_classifier

logger = logging.getLogger(__name__)


@dataclass
class ProcessedItem:
    """A processed scraped item."""
    id: str
    title: str
    content: str
    url: str
    source: str  # search_engines, news, twitter, etc.
    source_name: str  # duckduckgo, reuters, etc.
    scraped_at: datetime
    countries: list[str] = field(default_factory=list)
    organizations: list[str] = field(default_factory=list)
    commodities: list[str] = field(default_factory=list)
    category: Optional[str] = None
    severity: Optional[str] = None
    ai_summary: Optional[str] = None
    risk_score: float = 0.0
    processed_at: Optional[datetime] = None


class DataProcessor:
    """
    Process scraped data through the analysis pipeline.
    
    Steps:
    1. Deduplicate by URL/content hash
    2. Extract entities (countries, orgs, commodities)
    3. Classify event category and severity
    4. Generate AI summary
    5. Store in PostgreSQL, Neo4j, Qdrant
    """
    
    COMMODITY_KEYWORDS = [
        "semiconductor", "chip", "lithium", "rare earth", "oil", "gas",
        "steel", "aluminum", "copper", "cobalt", "nickel", "battery",
        "solar panel", "ev", "electric vehicle", "automotive",
    ]
    
    CATEGORY_KEYWORDS = {
        "trade_restriction": ["sanction", "tariff", "embargo", "export control", "ban"],
        "commodity_shortage": ["shortage", "scarcity", "supply constraint", "deficit"],
        "logistics": ["port", "shipping", "freight", "container", "congestion"],
        "geopolitical": ["war", "conflict", "tension", "diplomatic", "government"],
        "weather": ["hurricane", "typhoon", "flood", "drought", "storm"],
        "labor": ["strike", "labor", "workforce", "worker", "union"],
    }
    
    def generate_id(self, url: str, content: str) -> str:
        """Generate unique ID from URL and content."""
        combined = f"{url}:{content[:500]}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def extract_commodities(self, text: str) -> list[str]:
        """Extract commodity mentions from text."""
        text_lower = text.lower()
        found = []
        for keyword in self.COMMODITY_KEYWORDS:
            if keyword in text_lower:
                found.append(keyword)
        return found
    
    def classify_category(self, text: str) -> str:
        """Classify event category based on keywords."""
        text_lower = text.lower()
        scores = {}
        
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[category] = score
        
        if scores:
            return max(scores, key=scores.get)
        return "other"
    
    def estimate_severity(self, text: str, category: str) -> str:
        """Estimate event severity."""
        text_lower = text.lower()
        
        critical_words = ["critical", "severe", "crisis", "emergency", "immediate"]
        high_words = ["major", "significant", "substantial", "widespread"]
        medium_words = ["moderate", "notable", "considerable"]
        
        if any(w in text_lower for w in critical_words):
            return "critical"
        if any(w in text_lower for w in high_words):
            return "high"
        if any(w in text_lower for w in medium_words):
            return "medium"
        return "low"
    
    async def process_item(
        self,
        title: str,
        content: str,
        url: str,
        source: str,
        source_name: str,
        use_ai: bool = True,
    ) -> ProcessedItem:
        """
        Process a single scraped item using NVIDIA for extraction.
        
        Args:
            title: Item title
            content: Full text content
            url: Source URL
            source: Source type (search_engines, news, etc.)
            source_name: Specific source (duckduckgo, reuters)
            use_ai: Whether to use NVIDIA for intelligent extraction
        """
        item_id = self.generate_id(url, content)
        full_text = f"{title} {content}"
        
        # Default extraction (fallback)
        countries = country_classifier.extract_countries(full_text)
        commodities = self.extract_commodities(full_text)
        category = self.classify_category(full_text)
        severity = self.estimate_severity(full_text, category)
        ai_summary = None
        risk_score = 0.3
        overconfidence_score = 0.5
        
        # Use NVIDIA for intelligent extraction
        if use_ai and len(content) > 100:
            try:
                from ai.nvidia_extractor import nvidia_extractor
                
                # Extract entities with NVIDIA
                entities = await nvidia_extractor.extract_entities(content, title)
                
                if entities:
                    # Override with NVIDIA-extracted data
                    commodities = [c["name"] for c in entities.commodities]
                    for country in entities.countries:
                        if country["name"] not in countries:
                            countries.append(country["name"])
                    
                    # Get event category/severity from extracted events
                    if entities.events:
                        evt = entities.events[0]
                        category = evt.get("type", category)
                        severity = evt.get("severity", severity)
                    
                    # Score risk with NVIDIA
                    risk_assessment = await nvidia_extractor.score_risk(content, entities)
                    if risk_assessment:
                        risk_score = risk_assessment.risk_score
                        overconfidence_score = risk_assessment.overconfidence_score
                        ai_summary = risk_assessment.summary
                        commodities = risk_assessment.affected_supply_chains or commodities
                    
                    # Generate and store graph nodes
                    nodes = await nvidia_extractor.generate_graph_nodes(entities, url)
                    links = nvidia_extractor.generate_graph_links(entities, nodes)
                    
                    # Store nodes to Neo4j
                    await self._store_extracted_graph(nodes, links)
                    logger.info(f"Stored {len(nodes)} nodes and {len(links)} links to Neo4j")
                    
            except Exception as e:
                logger.warning(f"NVIDIA extraction failed, using fallback: {e}")
        
        # Calculate risk score from severity if not set by NVIDIA
        if risk_score == 0.3:
            severity_scores = {"critical": 0.9, "high": 0.7, "medium": 0.4, "low": 0.2}
            risk_score = severity_scores.get(severity, 0.3)
        
        return ProcessedItem(
            id=item_id,
            title=title,
            content=content,
            url=url,
            source=source,
            source_name=source_name,
            scraped_at=datetime.utcnow(),
            countries=countries,
            organizations=[],
            commodities=commodities,
            category=category,
            severity=severity,
            ai_summary=ai_summary,
            risk_score=risk_score,
            processed_at=datetime.utcnow(),
        )
    
    async def _store_extracted_graph(self, nodes: list[dict], links: list[dict]):
        """Store NVIDIA-extracted nodes and links to Neo4j."""
        try:
            for node in nodes:
                if node["type"] == "vendor":
                    await neo4j_client.create_vendor_node({
                        "id": node["id"],
                        "name": node["label"],
                        "country": node["properties"].get("country", ""),
                        "industry": node["properties"].get("company_type", ""),
                        "tier": 1,
                        "risk_score": node.get("risk_score", 0.3),
                    })
                elif node["type"] == "country":
                    await neo4j_client.create_country_node({
                        "code": node["id"].replace("country-", "").upper(),
                        "name": node["label"],
                        "region": node["properties"].get("role", ""),
                        "risk_score": node.get("risk_score", 0.3),
                        "is_sanctioned": False,
                    })
                elif node["type"] == "product":
                    await neo4j_client.create_product_node({
                        "id": node["id"],
                        "name": node["label"],
                        "category": node["properties"].get("category", "other"),
                        "risk_score": node.get("risk_score", 0.3),
                    })
                elif node["type"] == "event":
                    await neo4j_client.create_event_node({
                        "id": node["id"],
                        "title": node["label"],
                        "category": node["properties"].get("event_type", ""),
                        "severity": node["properties"].get("severity", "medium"),
                        "impact_score": node.get("risk_score", 0.5),
                        "country": "",
                    })
            
            # Create relationships
            for link in links:
                source_type = link["source"].split("-")[0].capitalize()
                target_type = link["target"].split("-")[0].capitalize()
                if source_type == "Product":
                    source_type = "Product"
                if target_type == "Product":
                    target_type = "Product"
                    
                await neo4j_client.create_relationship(
                    from_type=source_type,
                    from_id=link["source"],
                    to_type=target_type,
                    to_id=link["target"],
                    rel_type=link["type"].upper(),
                )
        except Exception as e:
            logger.error(f"Failed to store graph: {e}")

    
    async def store_to_postgres(self, item: ProcessedItem, session: AsyncSession):
        """Store processed item in PostgreSQL."""
        # Check for duplicate
        existing = await session.execute(
            select(Event).where(Event.source_url == item.url)
        )
        if existing.scalar():
            return False  # Already exists
        
        # Map severity
        severity_map = {
            "critical": EventSeverity.CRITICAL,
            "high": EventSeverity.HIGH,
            "medium": EventSeverity.MEDIUM,
            "low": EventSeverity.LOW,
        }
        
        # Map category
        category_map = {
            "trade_restriction": EventCategory.TRADE_RESTRICTION,
            "commodity_shortage": EventCategory.COMMODITY_SHORTAGE,
            "logistics": EventCategory.LOGISTICS,
            "geopolitical": EventCategory.GEOPOLITICAL,
            "weather": EventCategory.WEATHER,
            "labor": EventCategory.LABOR,
            "other": EventCategory.OTHER,
        }
        
        event = Event(
            title=item.title[:500],
            description=item.content[:2000] if item.content else None,
            category=category_map.get(item.category, EventCategory.OTHER),
            severity=severity_map.get(item.severity, EventSeverity.MEDIUM),
            source=item.source_name,
            source_url=item.url,
            raw_content=item.content,
            ai_summary=item.ai_summary,
            countries_affected=item.countries,
            commodities_affected=item.commodities,
        )
        
        session.add(event)
        return True
    
    async def store_to_neo4j(self, item: ProcessedItem):
        """Store processed item in Neo4j graph."""
        try:
            # Create event node using the correct method
            await neo4j_client.create_event_node({
                "id": item.id,
                "title": item.title[:200],  # Limit title length
                "category": item.category or "unknown",
                "severity": item.severity or "medium",
                "impact_score": item.risk_score,
                "country": item.countries[0].name if item.countries and hasattr(item.countries[0], 'name') else (item.countries[0] if item.countries else ""),
            })
            
            # Create relationships to countries
            for country in item.countries:
                # Handle both string and CountryMention objects
                country_code = country.code if hasattr(country, 'code') else str(country)[:3].upper()
                country_name = country.name if hasattr(country, 'name') else str(country)
                
                await neo4j_client.create_country_node({
                    "code": country_code,
                    "name": country_name,
                    "region": "",
                    "risk_score": item.risk_score,
                    "is_sanctioned": False,
                })
                
                await neo4j_client.create_relationship(
                    "Event", item.id,
                    "Country", country_code,
                    "AFFECTS",
                )
            
            # Create relationships to commodities
            for commodity in item.commodities:
                await neo4j_client.create_product_node({
                    "id": f"product-{commodity.lower().replace(' ', '_')}",
                    "name": commodity,
                    "category": "commodity",
                    "risk_score": item.risk_score,
                })
                
                await neo4j_client.create_relationship(
                    "Event", item.id,
                    "Product", f"product-{commodity.lower().replace(' ', '_')}",
                    "IMPACTS",
                )
                
        except Exception as e:
            print(f"Neo4j store error: {e}")
    
    async def store_to_qdrant(self, item: ProcessedItem):
        """Store processed item in Qdrant for RAG."""
        try:
            await embeddings_service.index_document(
                doc_id=item.id,
                title=item.title,
                content=item.content,
                metadata={
                    "source": item.source,
                    "source_name": item.source_name,
                    "url": item.url,
                    "category": item.category,
                    "severity": item.severity,
                    "countries": item.countries,
                    "scraped_at": item.scraped_at.isoformat(),
                },
            )
        except Exception as e:
            print(f"Qdrant store error: {e}")
    
    async def process_batch(
        self,
        items: list[dict],
        source: str,
        store_to_db: bool = True,
        use_ai: bool = False,  # Disable AI by default for batch
    ) -> list[ProcessedItem]:
        """
        Process a batch of scraped items.
        
        Args:
            items: List of {"title": ..., "content": ..., "url": ..., "source_name": ...}
            source: Source type
            store_to_db: Whether to persist to databases
            use_ai: Whether to use AI summarization
        """
        processed = []
        
        for item_data in items:
            try:
                item = await self.process_item(
                    title=item_data.get("title", ""),
                    content=item_data.get("content", item_data.get("snippet", "")),
                    url=item_data.get("url", ""),
                    source=source,
                    source_name=item_data.get("source_name", item_data.get("source", source)),
                    use_ai=use_ai,
                )
                processed.append(item)
                
                if store_to_db:
                    # Store to all databases
                    async with async_session_factory() as session:
                        await self.store_to_postgres(item, session)
                        await session.commit()
                    
                    await self.store_to_neo4j(item)
                    await self.store_to_qdrant(item)
                    
            except Exception as e:
                print(f"Error processing item: {e}")
                continue
        
        return processed


# Global instance
data_processor = DataProcessor()
