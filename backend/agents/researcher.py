from typing import Any, List, Optional
from agents.base import BaseAgent
from agents.state import Task, UserContext, ScrapedEvidence
from scraping.search_engines import search_aggregator
import random

class ResearchAgent(BaseAgent):
    """
    Intelligent Research Agent.
    Generates dorks, executes searches, and filters results.
    """

    def __init__(self):
        super().__init__(name="Researcher", agent_type="researcher")

    async def process(self, task: Task, context: Optional[UserContext] = None) -> List[str]:
        """
        Executes search research.
        Returns a list of URLs to scrape.
        """
        query_base = task.description
        queries = [query_base]

        # Context-Aware query generation
        if context:
            if context.suppliers:
                # Prioritize user's suppliers
                for supplier in context.suppliers[:3]: # Limit to top 3 for efficient batching
                    queries.append(f'site:reuters.com "{supplier}" delay')
                    queries.append(f'"{supplier}" supply chain disruption')
            
            if context.parts:
                 for part in context.parts[:2]:
                     queries.append(f'"{part}" shortage news')

        # Dorking Strategy (if generic query)
        if "supply chain" in query_base.lower():
            queries.append(f'filetype:pdf "{query_base}" report 2026')
            queries.append(f'site:bloomberg.com "{query_base}"')

        self.logger.info(f"Generated {len(queries)} queries: {queries}")

        all_urls = []
        for q in queries:
            try:
                # search_aggregator is the existing tool from Phase 11
                results = await search_aggregator.search_all(q, max_results=5)
                urls = [r['url'] for r in results if r.get('url')]
                all_urls.extend(urls)
            except Exception as e:
                self.logger.warning(f"Search failed for '{q}': {e}")

        # Deduplicate
        unique_urls = list(set(all_urls))
        self.logger.info(f"Found {len(unique_urls)} unique URLs.")
        return unique_urls
