"""
Feed Manager for RSS/Atom feeds

Manages subscriptions to news feeds and polls for new articles.
Features continuous polling with Gemini processing.
"""

import asyncio
import logging
from typing import Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

import feedparser

logger = logging.getLogger(__name__)


@dataclass
class FeedSource:
    """RSS/Atom feed source."""
    name: str
    url: str
    category: str  # supply_chain, tech, finance, commodities, shipping
    priority: int = 3  # 1-5, higher = more important
    enabled: bool = True


@dataclass
class FeedStats:
    """Per-feed statistics."""
    articles_scraped: int = 0
    last_poll: Optional[datetime] = None
    errors: int = 0
    avg_articles_per_poll: float = 0.0


# Comprehensive list of supply chain news feeds
DEFAULT_FEEDS = [
    # === Tier 1: Primary Supply Chain Sources ===
    FeedSource("Supply Chain Dive", "https://www.supplychaindive.com/feeds/news/", "supply_chain", 5),
    FeedSource("The Loadstar", "https://theloadstar.com/feed/", "shipping", 5),
    FeedSource("FreightWaves", "https://www.freightwaves.com/feed", "shipping", 5),
    FeedSource("Semiconductor Engineering", "https://semiengineering.com/feed/", "tech", 5),
    
    # === Tier 2: Major Business/Finance ===
    FeedSource("Reuters Business", "https://feeds.reuters.com/reuters/businessNews", "finance", 5),
    FeedSource("Reuters Tech", "https://feeds.reuters.com/reuters/technologyNews", "tech", 4),
    FeedSource("Bloomberg Markets", "https://feeds.bloomberg.com/markets/news.rss", "finance", 5),
    
    # === Tier 3: Industry Specific ===
    FeedSource("Supply Chain Brain", "https://www.supplychainbrain.com/rss", "supply_chain", 4),
    FeedSource("Material Handling", "https://www.mhlnews.com/rss", "logistics", 3),
    FeedSource("JOC Shipping", "https://www.joc.com/rss.xml", "shipping", 4),
    FeedSource("SCMP Economy", "https://www.scmp.com/rss/5/feed", "finance", 4),
    
    # === Tier 4: Tech/Semiconductor ===
    FeedSource("Semiconductor Today", "https://www.semiconductor-today.com/rss.xml", "tech", 4),
    FeedSource("EE Times", "https://www.eetimes.com/feed/", "tech", 3),
    FeedSource("Ars Technica", "https://feeds.arstechnica.com/arstechnica/technology-lab", "tech", 3),
    
    # === Tier 5: Commodities/Trade ===
    FeedSource("Investing.com Commodities", "https://www.investing.com/rss/news_301.rss", "commodities", 3),
    FeedSource("Trade Gov News", "https://www.trade.gov/rss/news.xml", "trade", 4),
]


class FeedManager:
    """
    Manages RSS/Atom feed subscriptions and polling.
    
    Features:
    - Continuous background polling
    - Per-feed statistics
    - Gemini-powered article processing
    - Custom feed support
    """

    def __init__(self, feeds: Optional[list[FeedSource]] = None):
        self.feeds = feeds or DEFAULT_FEEDS.copy()
        self.seen_urls: set[str] = set()
        self.feed_stats: dict[str, FeedStats] = {f.name: FeedStats() for f in self.feeds}
        self._running = False
        self._poll_count = 0
        self._total_articles = 0

    def add_feed(self, name: str, url: str, category: str = "custom", priority: int = 3) -> bool:
        """Add a custom feed."""
        # Check for duplicates
        if any(f.url == url for f in self.feeds):
            logger.warning(f"Feed already exists: {url}")
            return False
        
        feed = FeedSource(name=name, url=url, category=category, priority=priority)
        self.feeds.append(feed)
        self.feed_stats[name] = FeedStats()
        logger.info(f"Added feed: {name}")
        return True

    def remove_feed(self, name: str) -> bool:
        """Remove a feed by name."""
        for i, feed in enumerate(self.feeds):
            if feed.name == name:
                self.feeds.pop(i)
                self.feed_stats.pop(name, None)
                logger.info(f"Removed feed: {name}")
                return True
        return False

    async def poll_feed(self, feed: FeedSource) -> list[dict]:
        """
        Poll a single feed for new entries.
        
        Returns list of new entry dicts with url, title, summary, published.
        """
        new_entries = []
        
        if not feed.enabled:
            return new_entries
        
        try:
            loop = asyncio.get_event_loop()
            parsed = await loop.run_in_executor(None, feedparser.parse, feed.url)
            
            for entry in parsed.entries[:15]:  # Check latest 15
                url = entry.get("link", "")
                if not url or url in self.seen_urls:
                    continue
                
                self.seen_urls.add(url)
                
                # Parse publish date
                published = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        published = datetime(*entry.published_parsed[:6])
                    except Exception:
                        pass
                
                new_entries.append({
                    "url": url,
                    "title": entry.get("title", ""),
                    "summary": entry.get("summary", "")[:500],
                    "published": published,
                    "feed_name": feed.name,
                    "category": feed.category,
                    "priority": feed.priority,
                })
            
            # Update stats
            stats = self.feed_stats.get(feed.name)
            if stats:
                stats.articles_scraped += len(new_entries)
                stats.last_poll = datetime.utcnow()
                # Running average
                stats.avg_articles_per_poll = (
                    stats.avg_articles_per_poll * 0.8 + len(new_entries) * 0.2
                )
            
            if new_entries:
                logger.info(f"📰 {feed.name}: {len(new_entries)} new articles")
                
        except Exception as e:
            logger.warning(f"Feed error '{feed.name}': {e}")
            if feed.name in self.feed_stats:
                self.feed_stats[feed.name].errors += 1
        
        return new_entries

    async def poll_all(self) -> list[dict]:
        """
        Poll all feeds for new entries.
        
        Returns combined list of new entries, sorted by priority.
        """
        all_entries = []
        
        for feed in self.feeds:
            if feed.enabled:
                entries = await self.poll_feed(feed)
                all_entries.extend(entries)
                await asyncio.sleep(0.3)  # Rate limit
        
        # Sort by priority (highest first)
        all_entries.sort(key=lambda x: x["priority"], reverse=True)
        
        self._poll_count += 1
        self._total_articles += len(all_entries)
        
        if all_entries:
            logger.info(f"✓ Poll #{self._poll_count}: {len(all_entries)} new articles total")
        
        return all_entries

    async def _process_entry(self, entry: dict):
        """Process a single feed entry through Gemini and store to all DBs."""
        try:
            from data.processor import data_processor
            from data.scheduler import scheduler  # Add to scheduler store for dashboard
            
            # Process with Gemini extraction
            processed = await data_processor.process_item(
                title=entry["title"],
                content=entry.get("summary", "") or entry["title"],  # Use summary or title
                url=entry["url"],
                source="rss_feed",
                source_name=entry["feed_name"],
                use_ai=True,  # Enable Gemini extraction
            )
            
            # Store to all databases
            try:
                await data_processor.store_to_qdrant(processed)
                logger.debug(f"✓ Qdrant: {entry['title'][:40]}...")
            except Exception as e:
                logger.warning(f"Qdrant store failed: {e}")
            
            try:
                await data_processor.store_to_neo4j(processed)
                logger.info(f"✓ Neo4j stored: {processed.title[:50]}...")
            except Exception as e:
                logger.warning(f"Neo4j store failed: {e}")
            
            # Add to scheduler data store for dashboard visibility
            try:
                from data.scheduler import ProcessedItem as SchedulerItem
                sched_item = SchedulerItem(
                    id=processed.id,
                    title=processed.title,
                    content=processed.content,
                    url=processed.url,
                    source=processed.source,
                    source_name=processed.source_name,
                    scraped_at=processed.scraped_at,
                    countries=processed.countries,
                    commodities=processed.commodities,
                    category=processed.category,
                    severity=processed.severity,
                    ai_summary=processed.ai_summary,
                    risk_score=processed.risk_score,
                    processed_at=processed.processed_at,
                )
                scheduler.data_store.add(sched_item)
            except Exception as e:
                logger.debug(f"Scheduler store skipped: {e}")
            
            logger.info(f"⚡ Processed: {entry['title'][:50]}...")
            return True
            
        except Exception as e:
            logger.warning(f"Processing error: {e}")
            return False

    async def _process_batch(self, entries: list[dict], batch_size: int = 20):
        """Process entries in batches with proper rate limiting."""
        total = len(entries)
        processed = 0
        
        for i in range(0, total, batch_size):
            batch = entries[i:i + batch_size]
            logger.info(f"📦 Processing batch {i//batch_size + 1} ({len(batch)} items)")
            
            for entry in batch:
                success = await self._process_entry(entry)
                if success:
                    processed += 1
                await asyncio.sleep(0.5)  # Rate limit within batch
            
            # Pause between batches
            if i + batch_size < total:
                logger.info(f"⏸️ Batch complete, waiting 2s before next...")
                await asyncio.sleep(2)
        
        logger.info(f"✅ Batch processing complete: {processed}/{total} articles")
        return processed

    async def start_continuous(self, interval_minutes: int = 5):
        """
        Start continuous RSS polling.
        
        Args:
            interval_minutes: Minutes between poll cycles
        """
        if self._running:
            logger.warning("Feed manager already running")
            return
        
        self._running = True
        logger.info(f"🔄 Starting RSS polling (interval: {interval_minutes}m, {len(self.feeds)} feeds)")
        
        while self._running:
            try:
                entries = await self.poll_all()
                
                if entries:
                    # Process all entries in batches of 20
                    await self._process_batch(entries, batch_size=20)
                    
            except Exception as e:
                logger.error(f"Poll cycle error: {e}")
            
            if self._running:
                await asyncio.sleep(interval_minutes * 60)

    def stop(self):
        """Stop continuous polling."""
        self._running = False
        logger.info("RSS polling stopped")

    def get_stats(self) -> dict:
        """Get feed manager statistics."""
        feed_details = []
        for feed in self.feeds:
            stats = self.feed_stats.get(feed.name, FeedStats())
            feed_details.append({
                "name": feed.name,
                "category": feed.category,
                "priority": feed.priority,
                "enabled": feed.enabled,
                "articles_scraped": stats.articles_scraped,
                "last_poll": stats.last_poll.isoformat() if stats.last_poll else None,
                "errors": stats.errors,
                "avg_per_poll": round(stats.avg_articles_per_poll, 1),
            })
        
        return {
            "feeds_count": len(self.feeds),
            "enabled_count": sum(1 for f in self.feeds if f.enabled),
            "total_articles": self._total_articles,
            "poll_count": self._poll_count,
            "seen_urls_count": len(self.seen_urls),
            "is_running": self._running,
            "feeds": feed_details,
        }

    def get_activity_log(self, limit: int = 20) -> list[dict]:
        """Get recent feed activity for UI display."""
        # This would be enhanced with actual activity logging
        active_feeds = [
            {
                "feed": f.name,
                "status": "active" if f.enabled else "paused",
                "last_poll": self.feed_stats[f.name].last_poll.isoformat() 
                    if f.name in self.feed_stats and self.feed_stats[f.name].last_poll 
                    else None,
                "articles": self.feed_stats.get(f.name, FeedStats()).articles_scraped,
            }
            for f in self.feeds[:limit]
        ]
        return active_feeds


# Global instance
feed_manager = FeedManager()


