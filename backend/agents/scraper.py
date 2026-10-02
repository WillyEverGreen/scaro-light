from typing import Any, List, Optional
from agents.base import BaseAgent
from agents.state import Task, ScrapedEvidence
# Import existing tools
from scraping.browser import browser_manager
from scraping.news_scrapers import news_scraper

class ScraperAgent(BaseAgent):
    """
    Robust Scraper Agent.
    Handles browser fetching, markdown conversion, and error recovery.
    """

    def __init__(self):
        super().__init__(name="Scraper", agent_type="scraper")

    async def process(self, task: Task, context: Any = None) -> ScrapedEvidence:
        """
        Scrapes a single URL (passed in task description).
        Returns ScrapedEvidence.
        """
        url = task.description
        if not url.startswith("http"):
             raise ValueError(f"Invalid URL: {url}")

        self.logger.info(f"Scraping: {url}")
        
        # Strategy 1: Specialized News Scraper (Fast)
        try:
             article = await news_scraper.scrape_article(url)
             if article and len(article['content']) > 500:
                 return ScrapedEvidence(
                     url=url,
                     title=article['title'],
                     content=article['content'],
                     source_type="news_scraper"
                 )
        except Exception as e:
            self.logger.warning(f"News scraper failed, trying browser: {e}")

        # Strategy 2: Full Browser (Robust)
        try:
            # browser_manager handles undetected-chromedriver logic
            html = await browser_manager.get_page(url)
            
            # Convert HTML to Markdown (simplistic for now, can perform better parsing)
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'lxml')
            
            # Remove scripts and styles
            for script in soup(["script", "style", "nav", "footer"]):
                script.decompose()
            
            text = soup.get_text(separator="\n\n")
            lines = (line.strip() for line in text.splitlines())
            content = "\n".join(line for line in lines if line)
            
            title = soup.title.string if soup.title else "No Title"

            return ScrapedEvidence(
                url=url,
                title=title,
                content=content[:10000], # Limit content size
                source_type="browser"
            )

        except Exception as e:
            self.logger.error(f"Browser scraping failed: {e}")
            raise e
