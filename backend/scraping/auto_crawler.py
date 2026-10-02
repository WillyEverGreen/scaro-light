"""
AutoCrawler - Autonomous Website Crawler

Automatically discovers and scrapes articles from news websites.
Starts from seed URLs and recursively finds article links.
"""

import asyncio
import hashlib
import logging
import re
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass, field

import aiohttp
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


@dataclass
class CrawlStats:
    """Statistics for a crawl session."""
    pages_crawled: int = 0
    articles_found: int = 0
    articles_processed: int = 0
    errors: int = 0
    start_time: Optional[datetime] = None
    last_activity: Optional[datetime] = None


@dataclass
class CrawledArticle:
    """A discovered article."""
    url: str
    title: str
    content: str
    source_site: str
    discovered_at: datetime = field(default_factory=datetime.utcnow)


class AutoCrawler:
    """
    Autonomous website crawler for supply chain news.
    
    Starts from seed sites and discovers articles automatically.
    """
    
    # Seed sites with their article patterns
    SEED_SITES = [
        {
            "name": "Reuters Business",
            "base_url": "https://www.reuters.com",
            "start_paths": ["/business/", "/markets/commodities/", "/technology/"],
            "article_pattern": r"/\d{4}/\d{2}/\d{2}/",  # Date-based URLs
        },
        {
            "name": "Supply Chain Dive",
            "base_url": "https://www.supplychaindive.com",
            "start_paths": ["/news/", "/topic/logistics/", "/topic/technology/"],
            "article_pattern": r"/news/[a-z0-9-]+/\d+/",
        },
        {
            "name": "Supply Chain Lens",
            "base_url": "https://www.supplychainlens.com",
            "start_paths": ["/", "/news/"],
            "article_pattern": r"/news/article/[A-Z0-9]+/",
        },
        {
            "name": "The Loadstar",
            "base_url": "https://theloadstar.com",
            "start_paths": ["/", "/category/shipping/", "/category/air-freight/"],
            "article_pattern": r"/\d{4}/\d{2}/[a-z0-9-]+/",
        },
        {
            "name": "Semiconductor Engineering",
            "base_url": "https://semiengineering.com",
            "start_paths": ["/news/", "/knowledge-centers/"],
            "article_pattern": r"/\d{4}/\d{2}/[a-z0-9-]+/",
        },
        {
            "name": "FreightWaves",
            "base_url": "https://www.freightwaves.com",
            "start_paths": ["/news/", "/news/maritime/", "/news/air-cargo/"],
            "article_pattern": r"/news/[a-z0-9-]+",
        },
        {
            "name": "Journal of Commerce",
            "base_url": "https://www.joc.com",
            "start_paths": ["/", "/maritime-news/", "/port-news/"],
            "article_pattern": r"/[a-z0-9-]+_\d+\.html",
        },
        {
            "name": "Transport Topics",
            "base_url": "https://www.ttnews.com",
            "start_paths": ["/", "/trucking/", "/logistics/"],
            "article_pattern": r"/articles/[a-z0-9-]+",
        },
        {
            "name": "Logistics Management",
            "base_url": "https://www.logisticsmgmt.com",
            "start_paths": ["/", "/topic/global-trade/", "/topic/warehousing/"],
            "article_pattern": r"/article/[a-z0-9_]+",
        },
        {
            "name": "Air Cargo News",
            "base_url": "https://www.aircargonews.net",
            "start_paths": ["/", "/airlines/", "/airports/"],
            "article_pattern": r"/[a-z0-9-]+/",
        },
        {
            "name": "Maritime Executive",
            "base_url": "https://www.maritime-executive.com",
            "start_paths": ["/", "/article/", "/features/"],
            "article_pattern": r"/article/[a-z0-9-]+",
        },
        {
            "name": "Logistics Insider India",
            "base_url": "https://www.logisticsinsider.in",
            "start_paths": ["/", "/category/supply-chain/", "/category/warehousing/"],
            "article_pattern": r"/[a-z0-9-]+/",
        },
        {
            "name": "Port Technology",
            "base_url": "https://www.porttechnology.org",
            "start_paths": ["/", "/news/", "/technical-papers/"],
            "article_pattern": r"/news/[a-z0-9_]+",
        },
        {
            "name": "DC Velocity",
            "base_url": "https://www.dcvelocity.com",
            "start_paths": ["/", "/articles/", "/news/"],
            "article_pattern": r"/articles/\d+/[a-z0-9_]+",
        },
    ]
    
    # Keywords to prioritize supply chain articles
    PRIORITY_KEYWORDS = [
        "supply chain", "shortage", "logistics", "shipping", "semiconductor",
        "chip", "tariff", "trade", "port", "freight", "container", "inventory",
        "manufacturing", "TSMC", "Samsung", "Intel", "disruption", "delay",
    ]
    
    def __init__(self, max_pages_per_site: int = 30, crawl_delay: float = 2.0):
        self.max_pages_per_site = max_pages_per_site
        self.crawl_delay = crawl_delay  # Seconds between requests
        self.visited_urls: set = set()
        self.article_hashes: set = set()  # Dedupe by content hash
        self.stats = CrawlStats()
        self._running = False
        self._session: Optional[aiohttp.ClientSession] = None
    
    def _get_content_hash(self, content: str) -> str:
        """Generate hash for content deduplication."""
        return hashlib.md5(content.encode()[:1000]).hexdigest()
    
    async def _fetch_page(self, url: str) -> Optional[str]:
        """Fetch a page with proper headers."""
        if not self._session:
            timeout = aiohttp.ClientTimeout(total=30)
            self._session = aiohttp.ClientSession(timeout=timeout)
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        
        try:
            async with self._session.get(url, headers=headers, allow_redirects=True) as resp:
                if resp.status == 200:
                    return await resp.text()
                else:
                    logger.warning(f"HTTP {resp.status} for {url}")
                    return None
        except Exception as e:
            logger.warning(f"Fetch error for {url}: {e}")
            self.stats.errors += 1
            return None
    
    def _extract_links(self, html: str, base_url: str) -> list[str]:
        """Extract all links from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            
            # Skip non-article links
            if any(skip in href.lower() for skip in [
                'javascript:', 'mailto:', '#', 'login', 'signup',
                'subscribe', 'newsletter', 'twitter.com', 'facebook.com',
                'linkedin.com', '.pdf', '.jpg', '.png', 'video'
            ]):
                continue
            
            # Convert to absolute URL
            full_url = urljoin(base_url, href)
            
            # Only include same-domain links
            if urlparse(full_url).netloc == urlparse(base_url).netloc:
                links.append(full_url)
        
        return list(set(links))
    
    def _is_article(self, url: str, article_pattern: str) -> bool:
        """Check if URL looks like an article."""
        return bool(re.search(article_pattern, url))
    
    def _extract_article_content(self, html: str, url: str) -> Optional[CrawledArticle]:
        """Extract article title and content from HTML."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove script, style, nav, footer elements
        for element in soup.find_all(['script', 'style', 'nav', 'footer', 'aside', 'header']):
            element.decompose()
        
        # Get title
        title = None
        if soup.title:
            title = soup.title.string
        if not title:
            h1 = soup.find('h1')
            title = h1.get_text(strip=True) if h1 else None
        
        if not title:
            return None
        
        # Get article content
        content = ""
        
        # Try common article containers
        article = soup.find('article') or soup.find('main') or soup.find(class_=re.compile(r'article|content|post|story'))
        
        if article:
            paragraphs = article.find_all('p')
            content = " ".join(p.get_text(strip=True) for p in paragraphs)
        else:
            # Fallback: get all paragraphs
            paragraphs = soup.find_all('p')
            content = " ".join(p.get_text(strip=True) for p in paragraphs[:20])
        
        # Clean up
        content = re.sub(r'\s+', ' ', content).strip()
        
        if len(content) < 100:
            return None
        
        # Check for priority keywords
        text_lower = f"{title} {content}".lower()
        has_keywords = any(kw in text_lower for kw in self.PRIORITY_KEYWORDS)
        
        if not has_keywords:
            return None
        
        return CrawledArticle(
            url=url,
            title=title.strip(),
            content=content[:5000],  # Limit content length
            source_site=urlparse(url).netloc,
        )
    
    async def crawl_site(self, site_config: dict) -> list[CrawledArticle]:
        """Crawl a single site and return discovered articles."""
        articles = []
        base_url = site_config["base_url"]
        article_pattern = site_config["article_pattern"]
        
        # Build initial URLs
        urls_to_visit = [
            urljoin(base_url, path) for path in site_config["start_paths"]
        ]
        
        pages_crawled = 0
        
        while urls_to_visit and pages_crawled < self.max_pages_per_site:
            url = urls_to_visit.pop(0)
            
            if url in self.visited_urls:
                continue
            
            self.visited_urls.add(url)
            
            # Fetch page
            html = await self._fetch_page(url)
            if not html:
                continue
            
            pages_crawled += 1
            self.stats.pages_crawled += 1
            self.stats.last_activity = datetime.utcnow()
            
            # Check if this is an article
            if self._is_article(url, article_pattern):
                article = self._extract_article_content(html, url)
                if article:
                    content_hash = self._get_content_hash(article.content)
                    if content_hash not in self.article_hashes:
                        self.article_hashes.add(content_hash)
                        articles.append(article)
                        self.stats.articles_found += 1
                        logger.info(f"📰 Found: {article.title[:60]}...")
            
            # Extract more links
            new_links = self._extract_links(html, base_url)
            for link in new_links:
                if link not in self.visited_urls and link not in urls_to_visit:
                    urls_to_visit.append(link)
            
            # Rate limiting
            await asyncio.sleep(self.crawl_delay)
        
        logger.info(f"✓ {site_config['name']}: {len(articles)} articles from {pages_crawled} pages")
        return articles
    
    async def _process_article(self, article: CrawledArticle) -> bool:
        """Process a crawled article through NVIDIA and store to all DBs."""
        try:
            from data.processor import data_processor
            from data.scheduler import scheduler, ProcessedItem as SchedulerItem
            
            # Process with NVIDIA extraction
            processed = await data_processor.process_item(
                title=article.title,
                content=article.content,
                url=article.url,
                source="auto_crawler",
                source_name=article.source_site,
                use_ai=True,
            )
            
            # Store to Qdrant
            try:
                await data_processor.store_to_qdrant(processed)
            except Exception as e:
                logger.warning(f"Qdrant store failed: {e}")
            
            # Store to Neo4j
            try:
                await data_processor.store_to_neo4j(processed)
                logger.info(f"✓ Neo4j stored: {article.title[:50]}...")
            except Exception as e:
                logger.warning(f"Neo4j store failed: {e}")
            
            # Add to scheduler data store for dashboard visibility
            try:
                sched_item = SchedulerItem(
                    id=processed.id,
                    title=processed.title,
                    content=processed.content[:500],
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
            
            self.stats.articles_processed += 1
            logger.info(f"⚡ Processed: {article.title[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"Processing error: {e}")
            self.stats.errors += 1
            return False
    
    async def _process_batch(self, articles: list[CrawledArticle], batch_size: int = 20):
        """Process articles in batches with rate limiting."""
        total = len(articles)
        processed = 0
        
        for i in range(0, total, batch_size):
            batch = articles[i:i + batch_size]
            logger.info(f"📦 Processing batch {i//batch_size + 1} ({len(batch)} articles)")
            
            for article in batch:
                success = await self._process_article(article)
                if success:
                    processed += 1
                await asyncio.sleep(0.5)
            
            # Pause between batches
            if i + batch_size < total:
                logger.info(f"⏸️ Batch complete, waiting 2s...")
                await asyncio.sleep(2)
        
        logger.info(f"✅ Batch complete: {processed}/{total} articles processed")
        return processed
    
    async def run_full_crawl(self):
        """Run a full crawl of all seed sites."""
        logger.info("🕷️ Starting full crawl of all seed sites...")
        self.stats = CrawlStats(start_time=datetime.utcnow())
        
        for site in self.SEED_SITES:
            try:
                logger.info(f"🕷️ Crawling {site['name']}...")
                site_articles = await self.crawl_site(site)
                
                if site_articles:
                    logger.info(f"📝 Processing {len(site_articles)} articles from {site['name']}...")
                    # Process this site's articles immediately
                    await self._process_batch(site_articles, batch_size=10)
                    
            except Exception as e:
                logger.error(f"Error crawling {site['name']}: {e}")
                
        logger.info(f"✅ Crawl complete: {self.stats.articles_processed} articles processed")
        return self.stats
    
    async def start_continuous(self, interval_minutes: int = 30):
        """Start continuous crawling loop."""
        if self._running:
            return
        
        self._running = True
        logger.info(f"🔄 Starting continuous crawler (interval: {interval_minutes}m)")
        
        while self._running:
            try:
                await self.run_full_crawl()
            except Exception as e:
                logger.error(f"Crawl cycle error: {e}")
            
            if self._running:
                logger.info(f"⏰ Next crawl in {interval_minutes} minutes")
                await asyncio.sleep(interval_minutes * 60)
    
    def stop(self):
        """Stop continuous crawling."""
        self._running = False
        logger.info("🛑 Crawler stopped")
    
    async def close(self):
        """Clean up resources."""
        if self._session:
            await self._session.close()
            self._session = None


# Global instance
auto_crawler = AutoCrawler()
