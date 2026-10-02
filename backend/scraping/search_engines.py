"""
Search Engine Scrapers (API-free)

Scrape search results from 8+ search engines without APIs.
Engines: DuckDuckGo, Google, Bing, Brave, Yahoo, Qwant, Ecosia, Startpage
"""

import asyncio
import random
from typing import Optional, Callable
from dataclasses import dataclass
from urllib.parse import quote_plus
import logging

import httpx
from bs4 import BeautifulSoup
try:
    from ddgs import DDGS
except ImportError:
    # Backward compatibility with older duckduckgo-search package layout.
    from duckduckgo_search import DDGS

from config import settings
from scraping.anti_block import AntiBlocker
from scraping.browser import browser_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Search result item."""
    title: str
    url: str
    snippet: str
    source: str  # google, bing, duckduckgo, brave, yahoo, qwant, ecosia, startpage
    rank: int


class SearchEngineAggregator:
    """
    Aggregate search results from 8+ search engines.
    
    Engines:
    1. DuckDuckGo (via library)
    2. Google (web scraping)
    3. Bing (web scraping)
    4. Brave Search (web scraping)
    5. Yahoo (web scraping)
    6. Qwant (web scraping)
    7. Ecosia (web scraping)
    8. Startpage (web scraping)
    """
    
    ENGINES = [
        "duckduckgo", "bing", "brave", 
        "yahoo", "qwant", "ecosia", "startpage"
    ]
    
    def __init__(self):
        self.anti_blocker = AntiBlocker()
        self.ddgs = DDGS()
    
    async def search(
        self,
        query: str,
        max_results: int = 30,
        progress_callback: Optional[Callable] = None,
        engines: Optional[list[str]] = None,
    ) -> list[SearchResult]:
        """
        Search across all engines and aggregate results.
        
        Args:
            query: Search query
            max_results: Maximum results per engine
            progress_callback: Optional callback for progress updates
            engines: Optional list of engines to use (defaults to all)
        """
        all_results = []
        engines_to_use = engines or self.ENGINES
        total_engines = len(engines_to_use)
        
        for idx, engine in enumerate(engines_to_use):
            try:
                logger.info(f"Searching {engine}...")
                results = await self._search_engine(engine, query, max_results // 2)
                all_results.extend(results)
                logger.info(f"{engine}: {len(results)} results")
                
                if progress_callback:
                    progress_callback((idx + 1) / total_engines, len(all_results))
                
                # Small delay between engines
                await asyncio.sleep(random.uniform(0.5, 1.5))
                
            except Exception as e:
                logger.warning(f"{engine} search failed: {e}")
        
        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for result in all_results:
            if result.url not in seen_urls and result.url:
                seen_urls.add(result.url)
                unique_results.append(result)
        
        logger.info(f"Total unique results: {len(unique_results)}")
        return unique_results
    
    async def _search_engine(
        self,
        engine: str,
        query: str,
        max_results: int,
    ) -> list[SearchResult]:
        """Route to appropriate search method."""
        methods = {
            "duckduckgo": self._search_duckduckgo,
            "bing": self._search_bing,
            "brave": self._search_brave,
            "yahoo": self._search_yahoo,
            "qwant": self._search_qwant,
            "ecosia": self._search_ecosia,
            "startpage": self._search_startpage,
        }
        return await methods[engine](query, max_results)
    async def _search_duckduckgo(self, query: str, max_results: int) -> list[SearchResult]:
        """Search DuckDuckGo using the duckduckgo-search library with browser fallback."""
        results = []
        try:
            ddg_results = self.ddgs.text(query, max_results=max_results)
            for i, result in enumerate(ddg_results):
                if result.get("href"):
                    results.append(SearchResult(
                        title=result.get("title", ""),
                        url=result.get("href", ""),
                        snippet=result.get("body", ""),
                        source="duckduckgo",
                        rank=i + 1,
                    ))
        except Exception as e:
            logger.warning(f"DuckDuckGo library error: {e}. Trying browser fallback...")
            # Browser fallback for DDG
            try:
                html = browser_manager.get_page(f"https://duckduckgo.com/html/?q={quote_plus(query)}")
                if html:
                    soup = BeautifulSoup(html, "lxml")
                    for i, result in enumerate(soup.select(".result")):
                        title = result.select_one(".result__title a")
                        snippet = result.select_one(".result__snippet")
                        if title:
                            results.append(SearchResult(
                                title=title.get_text(strip=True),
                                url=title.get("href", ""),
                                snippet=snippet.get_text(strip=True) if snippet else "",
                                source="duckduckgo",
                                rank=len(results) + 1,
                            ))
                            if len(results) >= max_results:
                                break
            except Exception as be:
                logger.warning(f"DuckDuckGo browser fallback failed: {be}")
        return results


    async def _search_bing(self, query: str, max_results: int) -> list[SearchResult]:
        """Scrape Bing search results using BrowserManager."""
        results = []
        encoded_query = quote_plus(query)
        url = f"https://www.bing.com/search?q={encoded_query}&count={max_results}"
        
        try:
            # Selector from run_24_linux.py: #b_results .b_algo h2 a
            # We wait for the results container #b_results
            html = browser_manager.get_page(
                url, 
                wait_selector="#b_results",
                wait_time=2.0
            )
            if html:
                soup = BeautifulSoup(html, "lxml")
                # Broadened selector: .b_algo instead of li.b_algo
                for i, li in enumerate(soup.select(".b_algo")):
                    link = li.select_one("h2 a")
                    snippet = li.select_one("p") or li.select_one(".b_caption")
                    if link:
                        href = link.get("href", "")
                        if href.startswith("http"):
                            results.append(SearchResult(
                                title=link.get_text(strip=True),
                                url=href,
                                snippet=snippet.get_text(strip=True) if snippet else "",
                                source="bing",
                                rank=len(results) + 1,
                            ))
                            if len(results) >= max_results:
                                break
        except Exception as e:
            logger.warning(f"Bing browser error: {e}")
        return results
    
    async def _search_brave(self, query: str, max_results: int) -> list[SearchResult]:
        """Scrape Brave Search results using BrowserManager."""
        results = []
        encoded_query = quote_plus(query)
        url = f"https://search.brave.com/search?q={encoded_query}"
        
    async def _search_brave(self, query: str, max_results: int) -> list[SearchResult]:
        """Scrape Brave Search results using BrowserManager."""
        results = []
        encoded_query = quote_plus(query)
        url = f"https://search.brave.com/search?q={encoded_query}"
        
        try:
            # Selector from run_24_linux.py: .snippet .url (we use .snippet for container)
            html = browser_manager.get_page(
                url,
                wait_selector="#results", # Brave results container ID
                wait_time=2.0
            )
            if html:
                soup = BeautifulSoup(html, "lxml")
                # Brave snippets often use diverse classes
                snippets = soup.select(".snippet") or soup.select(".result")
                for i, div in enumerate(snippets):
                    link = div.select_one("a.result-header") or div.select_one("a")
                    title = div.select_one("span.snippet-title") or div.select_one("h2")
                    snippet = div.select_one("p.snippet-description") or div.select_one("div.snippet-content")
                    if link:
                        href = link.get("href", "")
                        if href.startswith("http") and "brave.com" not in href:
                            results.append(SearchResult(
                                title=title.get_text(strip=True) if title else link.get_text(strip=True),
                                url=href,
                                snippet=snippet.get_text(strip=True) if snippet else "",
                                source="brave",
                                rank=len(results) + 1,
                            ))
                            if len(results) >= max_results:
                                break
        except Exception as e:
            logger.warning(f"Brave browser error: {e}")
        return results
    
    async def _search_yahoo(self, query: str, max_results: int) -> list[SearchResult]:
        """Scrape Yahoo search results using BrowserManager."""
        results = []
        encoded_query = quote_plus(query)
        url = f"https://search.yahoo.com/search?p={encoded_query}&n={max_results}"
        
    async def _search_yahoo(self, query: str, max_results: int) -> list[SearchResult]:
        """Scrape Yahoo search results using BrowserManager."""
        results = []
        encoded_query = quote_plus(query)
        url = f"https://search.yahoo.com/search?p={encoded_query}&n={max_results}"
        
        try:
            # Selector from run_24_linux.py: #web .algo .compTitle h3 a
            html = browser_manager.get_page(
                url,
                wait_selector="#web", # Yahoo main results container
                wait_time=2.0
            )
            if html:
                soup = BeautifulSoup(html, "lxml")
                # Yahoo results are in div.algo or div.dd.algo
                items = soup.select(".algo") or soup.select(".dd.algo") or soup.select("li .compTitle")
                for i, div in enumerate(items):
                    link = div.select_one("h3 a") or div.select_one("a")
                    snippet = div.select_one("div.compText") or div.select_one("p")
                    if link:
                        href = link.get("href", "")
                        if href.startswith("http") and "yahoo.com" not in href:
                            results.append(SearchResult(
                                title=link.get_text(strip=True),
                                url=href,
                                snippet=snippet.get_text(strip=True) if snippet else "",
                                source="yahoo",
                                rank=len(results) + 1,
                            ))
                            if len(results) >= max_results:
                                break
        except Exception as e:
            logger.warning(f"Yahoo browser error: {e}")
        return results
    
    async def _search_qwant(self, query: str, max_results: int) -> list[SearchResult]:
        """Scrape Qwant search results using BrowserManager."""
        results = []
        encoded_query = quote_plus(query)
        url = f"https://www.qwant.com/?q={encoded_query}&t=web"
        
        try:
            html = browser_manager.get_page(url, wait_time=4.0) # Qwant needs more time for JS
            if html:
                soup = BeautifulSoup(html, "lxml")
                for i, div in enumerate(soup.select("div[data-testid='webResult']")):
                    link = div.select_one("a")
                    title = div.select_one("h2") or div.select_one("div.title")
                    snippet = div.select_one("p") or div.select_one("div.snippet")
                    if link:
                        href = link.get("href", "")
                        if href.startswith("http"):
                            results.append(SearchResult(
                                title=title.get_text(strip=True) if title else "",
                                url=href,
                                snippet=snippet.get_text(strip=True) if snippet else "",
                                source="qwant",
                                rank=len(results) + 1,
                            ))
                            if len(results) >= max_results:
                                break
        except Exception as e:
            logger.warning(f"Qwant browser error: {e}")
        return results
    
    async def _search_ecosia(self, query: str, max_results: int) -> list[SearchResult]:
        """Scrape Ecosia search results using BrowserManager."""
        results = []
        encoded_query = quote_plus(query)
        url = f"https://www.ecosia.org/search?q={encoded_query}"
        
    async def _search_ecosia(self, query: str, max_results: int) -> list[SearchResult]:
        """Scrape Ecosia search results using BrowserManager."""
        results = []
        encoded_query = quote_plus(query)
        url = f"https://www.ecosia.org/search?q={encoded_query}"
        
        try:
            # Selector from run_24_linux.py: .result a.js-result-url
            html = browser_manager.get_page(
                url,
                wait_selector=".result",
                wait_time=2.0
            ) 
            if html:
                soup = BeautifulSoup(html, "lxml")
                for i, div in enumerate(soup.select("div.result")):
                    link = div.select_one("a.result-url")
                    title = div.select_one("a.result-title")
                    snippet = div.select_one("p.result-snippet")
                    if link or title:
                        href = (link or title).get("href", "")
                        if href.startswith("http"):
                            results.append(SearchResult(
                                title=title.get_text(strip=True) if title else "",
                                url=href,
                                snippet=snippet.get_text(strip=True) if snippet else "",
                                source="ecosia",
                                rank=len(results) + 1,
                            ))
                            if len(results) >= max_results:
                                break
        except Exception as e:
            logger.warning(f"Ecosia browser error: {e}")
        return results

    async def _search_startpage(self, query: str, max_results: int) -> list[SearchResult]:
        """Scrape Startpage search results using BrowserManager."""
        results = []
        encoded_query = quote_plus(query)
        # Using the POST search URL of startpage often works better
        url = f"https://www.startpage.com/sp/search?query={encoded_query}"
        
        try:
            # Selector from run_24_linux.py: .w-gl__result h3 a
            html = browser_manager.get_page(
                url,
                wait_selector=".w-gl__result",
                wait_time=3.0 # Startpage is slower
            )
            if html:
                soup = BeautifulSoup(html, "lxml")
                for i, div in enumerate(soup.select("div.w-gl__result")):
                    link = div.select_one("a.w-gl__result-title")
                    snippet = div.select_one("p.w-gl__description")
                    if link:
                        href = link.get("href", "")
                        if href.startswith("http"):
                            results.append(SearchResult(
                                title=link.get_text(strip=True),
                                url=href,
                                snippet=snippet.get_text(strip=True) if snippet else "",
                                source="startpage",
                                rank=len(results) + 1,
                            ))
                            if len(results) >= max_results:
                                break
        except Exception as e:
            logger.warning(f"Startpage browser error: {e}")
        return results
    
    def get_supply_chain_queries(self) -> list[str]:
        """Get predefined supply chain related queries."""
        return [
            "supply chain disruption news",
            "semiconductor shortage latest",
            "port congestion shipping delays",
            "trade sanctions embargo news",
            "commodity shortage global",
            "logistics supply chain crisis",
            "manufacturing supply chain issues",
            "export controls technology",
            "rare earth minerals shortage",
            "automotive chip shortage",
        ]
    
    async def search_all(
        self,
        query: str,
        max_results: int = 30,
    ) -> list[dict]:
        """
        Search all engines and return as list of dicts.
        
        This is an alias for frontend compatibility.
        """
        results = await self.search(query, max_results)
        return [
            {
                "title": r.title,
                "url": r.url,
                "snippet": r.snippet,
                "source": r.source,
                "rank": r.rank,
            }
            for r in results
        ]


# Global instance
search_aggregator = SearchEngineAggregator()
