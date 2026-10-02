"""
Continuous Scraping Scheduler

Runs scraping jobs on a schedule and processes results.
Uses lazy imports to avoid startup issues.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass, field
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Imports for persistence
try:
    from data.processor import data_processor
    from db.postgres import async_session
except ImportError:
    pass


@dataclass
class SchedulerStats:
    """Scheduler statistics."""
    total_runs: int = 0
    total_items_scraped: int = 0
    total_items_processed: int = 0
    total_errors: int = 0
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    is_running: bool = False
    
    def to_dict(self) -> dict:
        return {
            "total_runs": self.total_runs,
            "total_items_scraped": self.total_items_scraped,
            "total_items_processed": self.total_items_processed,
            "total_errors": self.total_errors,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "next_run": self.next_run.isoformat() if self.next_run else None,
            "is_running": self.is_running,
        }


@dataclass
class ProcessedItem:
    """A processed scraped item."""
    id: str
    title: str
    content: str
    url: str
    source: str
    source_name: str
    scraped_at: datetime
    countries: list = field(default_factory=list)
    organizations: list = field(default_factory=list)
    commodities: list = field(default_factory=list)
    category: Optional[str] = None
    severity: Optional[str] = None
    ai_summary: Optional[str] = None
    risk_score: float = 0.0
    processed_at: Optional[datetime] = None


@dataclass
class ScrapedDataStore:
    """In-memory store for scraped data (for debug viewing)."""
    items: list = field(default_factory=list)
    max_items: int = 1000
    
    def add(self, item: ProcessedItem):
        self.items.insert(0, item)
        if len(self.items) > self.max_items:
            self.items = self.items[:self.max_items]
    
    def get_all(self, limit: int = 100, offset: int = 0) -> list:
        return self.items[offset:offset + limit]
    
    def search(
        self,
        query: Optional[str] = None,
        source: Optional[str] = None,
        category: Optional[str] = None,
        country: Optional[str] = None,
        limit: int = 50,
    ) -> list:
        results = self.items
        
        if query:
            query_lower = query.lower()
            results = [
                i for i in results
                if query_lower in i.title.lower() or query_lower in i.content.lower()
            ]
        
        if source:
            results = [i for i in results if i.source == source]
        
        if category:
            results = [i for i in results if i.category == category]
        
        if country:
            results = [i for i in results if country in i.countries]
        
        return results[:limit]
    
    def get_stats(self) -> dict:
        """Get statistics about stored data."""
        sources = {}
        categories = {}
        countries = {}
        
        for item in self.items:
            sources[item.source] = sources.get(item.source, 0) + 1
            if item.category:
                categories[item.category] = categories.get(item.category, 0) + 1
            for c in item.countries:
                # Handle both string countries and CountryMention objects
                country_name = c.name if hasattr(c, 'name') else str(c)
                countries[country_name] = countries.get(country_name, 0) + 1
        
        return {
            "total_items": len(self.items),
            "by_source": sources,
            "by_category": categories,
            "by_country": dict(sorted(countries.items(), key=lambda x: x[1], reverse=True)[:10]),
        }


class ContinuousScheduler:
    """
    Continuous scraping scheduler.
    """
    
    DEFAULT_KEYWORDS = [
        # General Disruption
        "supply chain disruption",
        "logistics delay port congestion",
        "freight rate spike container",
        "production halt shortage",
        "supplier bankruptcy risk",
        "force majeure declaration",
        
        # Tech & Manufacturing
        "semiconductor shortage 2026",
        "chip manufacturing delay",
        "raw material scarcity",
        "automotive supply chain issues",
        
        # Geopolitical & Trade
        "trade sanctions export control",
        "tariff increase trade war",
        "geopolitical tension supply chain",
        "critical mineral restriction",
        
        # Dorks (Advanced Queries)
        'site:reuters.com "supply chain"',
        'site:bloomberg.com "logistics"',
        'filetype:pdf "supply chain risk report" 2026',
        'intitle:"shortage" AND "raw materials"',
        '"forecast" AND "supply chain" AND "disruption"',
    ]
    
    COMMODITY_KEYWORDS = [
        "semiconductor", "chip", "lithium", "cobalt", "nickel", "rare earth", 
        "gallium", "germanium", "copper", "aluminum", "steel", "oil", "gas",
        "lng", "grain", "wheat", "corn", "fertilizer", "battery", "ev battery",
        "pharmaceutical", "api", "active pharmaceutical ingredient",
    ]
    
    CATEGORY_KEYWORDS = {
        "trade_restriction": ["sanction", "tariff", "embargo", "export control", "ban"],
        "commodity_shortage": ["shortage", "scarcity", "supply constraint"],
        "logistics": ["port", "shipping", "freight", "container", "congestion"],
        "geopolitical": ["war", "conflict", "tension", "diplomatic"],
        "weather": ["hurricane", "typhoon", "flood", "drought", "storm"],
        "labor": ["strike", "labor", "workforce", "worker"],
    }
    
    def __init__(self):
        self.stats = SchedulerStats()
        self.data_store = ScrapedDataStore()
        self._running = False
        self._task = None
        self.interval_minutes = 15
    
    def _detect_language(self, text: str) -> str:
        """Detect language using langdetect library."""
        if not text or len(text) < 20:
            return "en"
        
        try:
            from langdetect import detect
            lang = detect(text[:500])
            return lang
        except Exception:
            return "en"
    
    def _translate_to_english(self, text: str) -> str:
        """
        Translate non-English text to English using deep-translator.
        Uses Google Translate (API-free via googletrans/deep-translator).
        """
        if not text or len(text) < 10:
            return text
        
        try:
            lang = self._detect_language(text)
            
            if lang == "en":
                return text
            
            from deep_translator import GoogleTranslator
            
            # Translate in chunks if text is long (max 5000 chars per request)
            if len(text) > 4500:
                text = text[:4500]
            
            translated = GoogleTranslator(source=lang, target='en').translate(text)
            logger.info(f"Translated from {lang} to en: {text[:50]}...")
            return translated or text
            
        except Exception as e:
            logger.warning(f"Translation failed: {e}")
            return text
    
    async def _analyze_with_ai(self, title: str, content: str) -> dict:
        """
        Use NVIDIA NIM to extract structured information from content.
        
        Returns dict with:
        - category: str (trade_restriction, commodity_shortage, logistics, etc.)
        - severity: str (critical, high, medium, low)
        - countries: list[str]
        - organizations: list[str]
        - commodities: list[str]
        - summary: str (2-3 sentence summary)
        - impact: str (description of supply chain impact)
        - risk_score: float (0.0 to 1.0)
        """
        try:
            from ai.nvidia_client import nvidia_client
            
            prompt = f"""Analyze this supply chain news article and extract structured information.

Title: {title}
Content: {content[:1500]}

Respond ONLY with a JSON object (no markdown, no explanation):
{{
    "category": "<one of: trade_restriction, commodity_shortage, logistics, geopolitical, weather, labor, infrastructure, regulatory, other>",
    "severity": "<one of: critical, high, medium, low>",
    "countries": ["<list of country names mentioned>"],
    "organizations": ["<list of company/organization names mentioned>"],
    "commodities": ["<list of commodities/materials mentioned: semiconductors, chips, oil, lithium, etc>"],
    "summary": "<2-3 sentence summary of the article>",
    "impact": "<1-2 sentence description of supply chain impact>",
    "risk_score": <float from 0.0 to 1.0 based on severity and impact>
}}"""

            response = await nvidia_client.generate(
                prompt,
                system="You are a supply chain analyst. Extract structured information from news articles. Return ONLY valid JSON, no other text.",
                temperature=0.1,
                max_tokens=800,
            )
            
            # Parse JSON from response
            import json
            import re
            
            # Clean response - find JSON object
            json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                    logger.info(f"AI analysis complete: {title[:50]}...")
                    return data
                except json.JSONDecodeError:
                    pass
            
            # Try parsing entire response
            try:
                # Remove any <think> blocks
                clean_response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
                # Find JSON in cleaned response
                json_match = re.search(r'\{.*\}', clean_response, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group())
                    return data
            except Exception:
                pass
            
            logger.warning(f"Could not parse AI response for: {title[:50]}...")
            return {}
            
        except Exception as e:
            logger.warning(f"AI analysis failed: {e}")
            return {}
    
    def _extract_countries(self, text: str) -> list:
        """Simple country extraction."""
        countries = []
        country_map = {
            "united states": "USA", "us": "USA", "america": "USA",
            "china": "CHN", "chinese": "CHN", "beijing": "CHN",
            "taiwan": "TWN", "taiwanese": "TWN", "taipei": "TWN",
            "japan": "JPN", "japanese": "JPN", "tokyo": "JPN",
            "korea": "KOR", "korean": "KOR", "seoul": "KOR",
            "germany": "DEU", "german": "DEU", "berlin": "DEU",
            "russia": "RUS", "russian": "RUS", "moscow": "RUS",
            "india": "IND", "indian": "IND", "delhi": "IND",
            "europe": "EU", "european": "EU",
        }
        text_lower = text.lower()
        for keyword, code in country_map.items():
            if keyword in text_lower and code not in countries:
                countries.append(code)
        return countries
    
    def _extract_commodities(self, text: str) -> list:
        """Extract commodity mentions."""
        text_lower = text.lower()
        return [kw for kw in self.COMMODITY_KEYWORDS if kw in text_lower]
    
    def _classify_category(self, text: str) -> str:
        """Classify text category."""
        text_lower = text.lower()
        scores = {}
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[category] = score
        return max(scores, key=scores.get) if scores else "other"
    
    def _estimate_severity(self, text: str) -> str:
        """Estimate severity."""
        text_lower = text.lower()
        if any(w in text_lower for w in ["critical", "severe", "crisis", "emergency"]):
            return "critical"
        if any(w in text_lower for w in ["major", "significant", "substantial"]):
            return "high"
        if any(w in text_lower for w in ["moderate", "notable"]):
            return "medium"
        return "low"
    
    async def _process_search_result(self, result: dict, source: str) -> ProcessedItem:
        """Process a single search result with translation and AI analysis."""
        import hashlib
        
        title = result.get("title", "")
        content = result.get("snippet", result.get("content", ""))
        url = result.get("url", "")
        
        # Translate non-English content using library
        title = self._translate_to_english(title)
        content = self._translate_to_english(content)
        
        item_id = hashlib.md5(f"{url}:{content[:200]}".encode()).hexdigest()
        
        # Use AI to extract structured information
        ai_data = await self._analyze_with_ai(title, content)
        
        # Fall back to rule-based extraction if AI fails
        full_text = f"{title} {content}"
        
        countries = ai_data.get("countries", []) or self._extract_countries(full_text)
        commodities = ai_data.get("commodities", []) or self._extract_commodities(full_text)
        organizations = ai_data.get("organizations", [])
        category = ai_data.get("category") or self._classify_category(full_text)
        severity = ai_data.get("severity") or self._estimate_severity(full_text)
        ai_summary = ai_data.get("summary", "")
        impact = ai_data.get("impact", "")
        
        # Get risk score from AI or calculate from severity
        severity_scores = {"critical": 0.9, "high": 0.7, "medium": 0.4, "low": 0.2}
        risk_score = ai_data.get("risk_score") or severity_scores.get(severity, 0.3)
        
        # Combine summary and impact for the full AI summary
        full_summary = f"{ai_summary}\n\nImpact: {impact}" if impact else ai_summary
        
        return ProcessedItem(
            id=item_id,
            title=title,
            content=content,
            url=url,
            source=source,
            source_name=result.get("source", source),
            scraped_at=datetime.utcnow(),
            countries=countries if isinstance(countries, list) else [],
            organizations=organizations if isinstance(organizations, list) else [],
            commodities=commodities if isinstance(commodities, list) else [],
            category=category,
            severity=severity,
            ai_summary=full_summary,
            processed_at=datetime.utcnow(),
        )
    
    async def _persist_item(self, item: ProcessedItem):
        """Store item to databases via data processor."""
        try:
            # Check if persistence modules are available
            if 'data_processor' not in globals() or 'async_session' not in globals():
                return

            # Store to PostgreSQL
            async with async_session() as session:
                await data_processor.store_to_postgres(item, session)
                await session.commit()
            
            # Store to Neo4j and Qdrant
            await data_processor.store_to_neo4j(item)
            await data_processor.store_to_qdrant(item)
            
        except Exception as e:
            logger.warning(f"Persistence failed for {item.id}: {e}")
    
    async def run_scraping_cycle(self, store_to_db: bool = False):
        """Run one complete scraping cycle."""
        self.stats.is_running = True
        self.stats.last_run = datetime.utcnow()
        cycle_items = 0
        
        try:
            logger.info("Starting scraping cycle...")
            
            # Try to import and use search engines
            try:
                from scraping.search_engines import search_aggregator
                
                for keyword in self.DEFAULT_KEYWORDS[:2]:
                    logger.info(f"Searching: {keyword}")
                    try:
                        results = await search_aggregator.search_all(keyword, max_results=5)
                        
                        for result in results:
                            item = await self._process_search_result(result, "search_engines")
                            self.data_store.add(item)
                            cycle_items += 1
                            
                            if store_to_db:
                                await self._persist_item(item)
                        
                        self.stats.total_items_scraped += len(results)
                        self.stats.total_items_processed += len(results)
                        
                        await asyncio.sleep(2)
                    except Exception as e:
                        logger.warning(f"Search error: {e}")
                        self.stats.total_errors += 1
            except ImportError as e:
                logger.warning(f"Search engines not available: {e}")
                # Add mock data for testing
                mock_items = [
                    {"title": "Semiconductor shortage continues in Q1", "snippet": "Major chip shortage affecting Taiwan and China production", "url": "https://example.com/1", "source": "mock"},
                    {"title": "Port congestion at Shanghai delays shipments", "snippet": "Container shipping delays at major Chinese ports", "url": "https://example.com/2", "source": "mock"},
                    {"title": "US announces new export controls", "snippet": "Export controls targeting semiconductor equipment to China", "url": "https://example.com/3", "source": "mock"},
                ]
                for result in mock_items:
                    item = await self._process_search_result(result, "mock")
                    self.data_store.add(item)
                    cycle_items += 1
                    
                    if store_to_db:
                        await self._persist_item(item)
                    self.stats.total_items_processed += 1
            
            # Try weather data
            try:
                from data.weather_monitor import weather_monitor
                alerts = await weather_monitor.get_active_alerts()
                
                for alert in alerts:
                    item = ProcessedItem(
                        id=f"weather-{alert.latitude}-{alert.longitude}",
                        title=f"Weather Alert: {alert.alert_type}",
                        content=alert.description,
                        url="",
                        source="weather",
                        source_name="open-meteo",
                        scraped_at=datetime.utcnow(),
                        countries=[alert.country_code] if hasattr(alert, 'country_code') and alert.country_code else [],
                        category="weather",
                        severity=alert.severity if hasattr(alert, 'severity') else "medium",
                        risk_score=alert.impact_score if hasattr(alert, 'impact_score') else 0.5,
                        processed_at=datetime.utcnow(),
                    )
                    self.data_store.add(item)
                    cycle_items += 1
                    
                    if store_to_db:
                        await self._persist_item(item)
            except Exception as e:
                logger.warning(f"Weather data not available: {e}")
            
            # Log if no data was scraped (no demo fallback)
            if cycle_items == 0:
                logger.warning("No data scraped from any source. Check network connectivity and search engine availability.")
            
            self.stats.total_runs += 1
            logger.info(f"Scraping cycle complete. Processed {cycle_items} items.")
            
        except Exception as e:
            logger.error(f"Scraping cycle error: {e}")
            self.stats.total_errors += 1
        finally:
            self.stats.is_running = False
            self.stats.next_run = datetime.utcnow() + timedelta(minutes=self.interval_minutes)
    
    async def start_continuous(self):
        """Start continuous scraping loop."""
        if self._running:
            return
        
        self._running = True
        logger.info(f"Starting continuous scheduler (interval: {self.interval_minutes}m)")
        
        while self._running:
            await self.run_scraping_cycle()
            
            # Poll RSS feeds for new articles
            try:
                from feeds.feed_manager import feed_manager
                entries = await feed_manager.poll_all()
                if entries:
                    logger.info(f"RSS feeds: {len(entries)} new entries")
            except Exception as e:
                logger.warning(f"RSS polling error: {e}")
            
            # Check social media
            try:
                from feeds.social_monitor import social_monitor
                posts = await social_monitor.check_all()
                if posts:
                    logger.info(f"Social media: {len(posts)} new posts")
            except Exception as e:
                logger.warning(f"Social monitoring error: {e}")
            
            if self._running:
                logger.info(f"Next run in {self.interval_minutes} minutes")
                await asyncio.sleep(self.interval_minutes * 60)
    
    def stop(self):
        """Stop the continuous scheduler."""
        self._running = False
        if self._task:
            self._task.cancel()
        logger.info("Scheduler stopped")
    
    def is_running(self) -> bool:
        return self._running


# Global instance
scheduler = ContinuousScheduler()
