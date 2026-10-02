"""
News Article Scrapers

Scrape news articles using newspaper3k library.
"""

import asyncio
from typing import Optional, Callable
from dataclasses import dataclass
from datetime import datetime

from newspaper import Article
import httpx
import spacy

from config import settings
from scraping.anti_block import AntiBlocker
from scraping.browser import browser_manager

# Load spaCy
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")


@dataclass
class NewsArticle:
    """Parsed news article."""
    title: str
    url: str
    text: str
    summary: str
    authors: list
    publish_date: Optional[datetime]
    keywords: list
    organizations: list
    source_name: str
    country_mentions: list = None
    html: Optional[str] = None
    
    def __post_init__(self):
        if self.country_mentions is None:
            self.country_mentions = []
    
    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "url": self.url,
            "text": self.text,
            "summary": self.summary,
            "authors": self.authors,
            "publish_date": self.publish_date.isoformat() if self.publish_date else None,
            "keywords": self.keywords,
            "organizations": self.organizations,
            "source_name": self.source_name,
            "country_mentions": self.country_mentions,
        }


class NewsScraperService:
    """
    News article scraping service.
    
    Uses newspaper3k for article extraction with NLP enhancements.
    """
    
    # Major news sources for supply chain news
    NEWS_SOURCES = [
        ("Reuters", "https://www.reuters.com"),
        ("Bloomberg", "https://www.bloomberg.com"),
        ("Financial Times", "https://www.ft.com"),
        ("Supply Chain Dive", "https://www.supplychaindive.com"),
        ("Freight Waves", "https://www.freightwaves.com"),
        ("Logistics Management", "https://www.logisticsmgmt.com"),
    ]
    
    def __init__(self):
        self.anti_blocker = AntiBlocker()
    
    async def scrape_article(self, url: str) -> Optional[NewsArticle]:
        """
        Scrape a single news article using BrowserManager.
        
        Args:
            url: Article URL
            
        Returns:
            NewsArticle or None if failed
        """
        try:
            # Use BrowserManager to get page content (bypasses 403s/JS checks)
            html = browser_manager.get_page(url, wait_time=2.0)
            if not html:
                return None
                
            # Initialize newspaper Article with the browser-rendered HTML
            article = Article(url)
            article.set_html(html)
            article.parse()
            article.nlp()
            
            # Extract organizations using spaCy
            doc = nlp(article.text)
            organizations = list(set([
                ent.text for ent in doc.ents if ent.label_ == 'ORG'
            ]))
            
            # Extract country mentions
            country_mentions = list(set([
                ent.text for ent in doc.ents if ent.label_ == 'GPE'
            ]))
            
            # Determine source name from URL
            source_name = url.split("/")[2].replace("www.", "")
            
            return NewsArticle(
                title=article.title or "",
                url=url,
                text=article.text or "",
                summary=article.summary or "",
                authors=article.authors or [],
                publish_date=article.publish_date,
                keywords=article.keywords or [],
                organizations=organizations,
                source_name=source_name,
                country_mentions=country_mentions,
                html=html
            )
        except Exception as e:
            print(f"News scrape error for {url}: {e}")
            return None
    
    async def crawl_recursive(
        self, 
        start_url: str, 
        max_depth: int = 1, 
        current_depth: int = 0,
        visited: set = None
    ) -> list[NewsArticle]:
        """
        Recursively crawl and scrape articles starting from a URL.
        
        Args:
            start_url: URL to start crawling from
            max_depth: Maximum recursion depth
            current_depth: Current depth (internal use)
            visited: Set of visited URLs (internal use)
            
        Returns:
            List of scraped NewsArticles
        """
        if visited is None:
            visited = set()
            
        if start_url in visited or current_depth > max_depth:
            return []
            
        visited.add(start_url)
        articles = []
        
        # Scrape current article
        article = await self.scrape_article(start_url)
        if article:
            articles.append(article)
            
            # If we haven't reached max depth, find more links
            if current_depth < max_depth and article.html:
                links = self._extract_links(article.html, start_url)
                
                # Filter links to likely news/relevant content
                relevant_links = [
                    link for link in links 
                    if link not in visited and self._is_relevant_link(link)
                ]
                
                # Process relevant links (limit to 3 per article to prevent explosion)
                for link in relevant_links[:3]:
                    sub_articles = await self.crawl_recursive(link, max_depth, current_depth + 1, visited)
                    articles.extend(sub_articles)
                    
        return articles

    def _extract_links(self, html: str, base_url: str) -> list[str]:
        """Extract all valid absolute URLs from HTML."""
        from bs4 import BeautifulSoup
        from urllib.parse import urljoin
        
        if not html:
            return []
            
        soup = BeautifulSoup(html, "lxml")
        links = []
        for a in soup.find_all("a", href=True):
            href = a['href']
            # Join and clean fragment
            full_url = urljoin(base_url, href).split("#")[0]
            if full_url.startswith("http"):
                links.append(full_url)
        return list(set(links)) # Deduplicate

    def _is_relevant_link(self, url: str) -> bool:
        """Check if a link is likely a relevant news article."""
        # Simple heuristic: keep same domain, look for 'news'/'article' path, exclude common crap
        # This can be improved with more sophisticated filtering
        exclude_terms = ["login", "signup", "subscribe", "privacy", "terms", "facebook", "twitter", "linkedin"]
        if any(term in url.lower() for term in exclude_terms):
            return False
            
        return True
    
    async def scrape_articles(
        self,
        urls: list[str],
        progress_callback: Optional[Callable] = None,
    ) -> list[NewsArticle]:
        """
        Scrape multiple articles in parallel.
        
        Args:
            urls: List of article URLs
            progress_callback: Optional progress callback
        """
        articles = []
        
        for i, url in enumerate(urls):
            article = await self.scrape_article(url)
            if article:
                articles.append(article)
            
            if progress_callback:
                progress_callback((i + 1) / len(urls), len(articles))
            
            # Rate limiting
            await asyncio.sleep(0.5)
        
        return articles
    
    async def search_and_scrape(
        self,
        search_results: list,  # SearchResult objects
        max_articles: int = 20,
        progress_callback: Optional[Callable] = None,
    ) -> list[NewsArticle]:
        """
        Filter search results for news and scrape articles.
        
        Args:
            search_results: List of SearchResult objects
            max_articles: Maximum articles to scrape
            progress_callback: Optional progress callback
        """
        # Filter for likely news URLs
        news_urls = []
        news_domains = [
            "reuters", "bloomberg", "bbc", "cnn", "ft.com",
            "supplychaindive", "freightwaves", "wsj", "cnbc",
            "theguardian", "nytimes", "washingtonpost",
        ]
        
        for result in search_results:
            url_lower = result.url.lower()
            if any(domain in url_lower for domain in news_domains):
                news_urls.append(result.url)
            elif "/news/" in url_lower or "/article/" in url_lower:
                news_urls.append(result.url)
        
        # Limit and scrape
        urls_to_scrape = news_urls[:max_articles]
        return await self.scrape_articles(urls_to_scrape, progress_callback)


# Global instance
news_scraper = NewsScraperService()
