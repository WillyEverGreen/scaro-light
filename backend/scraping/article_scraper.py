"""
Article Scraper using newspaper3k

Robust article extraction with fallback to browser scraping for paywalled sites.
Extracts title, text, authors, images, and publish date.
"""

import asyncio
import logging
from typing import Optional
from dataclasses import dataclass
from datetime import datetime

from newspaper import Article, ArticleException
from scraping.browser import browser_manager

logger = logging.getLogger(__name__)


@dataclass
class ScrapedArticle:
    """Extracted article data."""
    url: str
    title: str
    text: str
    authors: list[str]
    publish_date: Optional[datetime]
    top_image: Optional[str]
    keywords: list[str]
    summary: str
    source_domain: str

    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "title": self.title,
            "text": self.text,
            "authors": self.authors,
            "publish_date": self.publish_date.isoformat() if self.publish_date else None,
            "top_image": self.top_image,
            "keywords": self.keywords,
            "summary": self.summary,
            "source_domain": self.source_domain,
        }


class ArticleScraper:
    """
    Article scraper using newspaper3k with browser fallback.
    
    Primary: newspaper3k (fast, lightweight)
    Fallback: BrowserManager (for paywalled/JS-heavy sites)
    """

    def __init__(self):
        self.browser_domains = [
            "reuters.com",
            "bloomberg.com",
            "wsj.com",
            "ft.com",
            "nytimes.com",
        ]

    async def scrape(self, url: str) -> Optional[ScrapedArticle]:
        """
        Scrape an article from URL.
        
        Args:
            url: Article URL to scrape
            
        Returns:
            ScrapedArticle or None if failed
        """
        # Check if domain needs browser scraping
        needs_browser = any(domain in url for domain in self.browser_domains)
        
        if needs_browser:
            return await self._scrape_with_browser(url)
        else:
            return await self._scrape_with_newspaper(url)

    async def _scrape_with_newspaper(self, url: str) -> Optional[ScrapedArticle]:
        """Use newspaper3k for article extraction."""
        try:
            article = Article(url)
            
            # Run download and parse in thread pool (blocking operations)
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, article.download)
            await loop.run_in_executor(None, article.parse)
            
            # NLP for keywords and summary
            try:
                await loop.run_in_executor(None, article.nlp)
            except Exception:
                pass  # NLP is optional
            
            # Extract domain
            from urllib.parse import urlparse
            domain = urlparse(url).netloc.replace("www.", "")
            
            return ScrapedArticle(
                url=url,
                title=article.title or "",
                text=article.text or "",
                authors=article.authors or [],
                publish_date=article.publish_date,
                top_image=article.top_image,
                keywords=article.keywords or [],
                summary=article.summary or "",
                source_domain=domain,
            )
        except ArticleException as e:
            logger.warning(f"newspaper3k failed for {url}: {e}. Trying browser fallback...")
            return await self._scrape_with_browser(url)
        except Exception as e:
            logger.error(f"Article scrape failed for {url}: {e}")
            return None

    async def _scrape_with_browser(self, url: str) -> Optional[ScrapedArticle]:
        """Use BrowserManager for JS-heavy or paywalled sites."""
        try:
            html = browser_manager.get_page(url, wait_time=3.0)
            if not html:
                return None
            
            # Use newspaper3k on the fetched HTML
            article = Article(url)
            article.set_html(html)
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, article.parse)
            
            try:
                await loop.run_in_executor(None, article.nlp)
            except Exception:
                pass
            
            from urllib.parse import urlparse
            domain = urlparse(url).netloc.replace("www.", "")
            
            return ScrapedArticle(
                url=url,
                title=article.title or "",
                text=article.text or "",
                authors=article.authors or [],
                publish_date=article.publish_date,
                top_image=article.top_image,
                keywords=article.keywords or [],
                summary=article.summary or "",
                source_domain=domain,
            )
        except Exception as e:
            logger.error(f"Browser scrape failed for {url}: {e}")
            return None


# Global instance
article_scraper = ArticleScraper()
