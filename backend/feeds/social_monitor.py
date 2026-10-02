"""
Social Media Monitor

Monitors Twitter and Reddit for supply chain intelligence.
"""

import asyncio
import logging
from typing import Optional
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class SocialPost:
    """Represents a social media post."""
    platform: str  # twitter, reddit
    url: str
    text: str
    author: str
    timestamp: Optional[datetime]
    engagement: int  # likes + retweets/upvotes
    subreddit: Optional[str] = None  # Reddit only


# Supply chain focused subreddits
SUPPLY_CHAIN_SUBREDDITS = [
    "supplychain",
    "logistics",
    "semiconductors",
    "hardware",
    "buildapc",
    "globaltradewar",
]

# Supply chain keywords for Twitter monitoring
SUPPLY_CHAIN_KEYWORDS = [
    "supply chain disruption",
    "semiconductor shortage",
    "chip shortage",
    "port congestion",
    "shipping delays",
    "logistics crisis",
    "component shortage",
    "SSD shortage",
    "GPU shortage",
    "memory prices",
]


class SocialMonitor:
    """
    Monitors social media platforms for supply chain intelligence.
    
    Uses:
    - Twitter: backend/scraping/twitter_scraper.py
    - Reddit: asyncpraw (async PRAW wrapper)
    """

    def __init__(self):
        self.reddit_client = None
        self._twitter_scraper = None
        self.seen_urls: set[str] = set()

    async def _get_twitter_scraper(self):
        """Lazy load Twitter scraper."""
        if self._twitter_scraper is None:
            try:
                from scraping.twitter_scraper import twitter_scraper
                self._twitter_scraper = twitter_scraper
            except ImportError:
                logger.warning("Twitter scraper not available")
        return self._twitter_scraper

    async def _init_reddit(self):
        """Initialize Reddit client if not already done."""
        if self.reddit_client is not None:
            return True
            
        try:
            import asyncpraw
            from config import settings
            
            # Reddit API credentials (optional, works without for read-only)
            self.reddit_client = asyncpraw.Reddit(
                client_id=getattr(settings, 'reddit_client_id', 'script'),
                client_secret=getattr(settings, 'reddit_client_secret', ''),
                user_agent="Edgecase/1.0 (Supply Chain Intelligence)",
                check_for_async=False,
            )
            return True
        except Exception as e:
            logger.warning(f"Failed to initialize Reddit client: {e}")
            return False

    async def check_twitter(self, keywords: Optional[list[str]] = None) -> list[SocialPost]:
        """
        Check Twitter for supply chain posts.
        
        Args:
            keywords: Keywords to search, defaults to SUPPLY_CHAIN_KEYWORDS
            
        Returns:
            List of SocialPost objects
        """
        posts = []
        keywords = keywords or SUPPLY_CHAIN_KEYWORDS[:3]  # Limit to avoid rate limiting
        
        scraper = await self._get_twitter_scraper()
        if not scraper:
            return posts
        
        for keyword in keywords:
            try:
                results = await scraper.search(keyword, max_results=10)
                
                for tweet in results:
                    url = tweet.get("url", "")
                    if url in self.seen_urls:
                        continue
                    
                    self.seen_urls.add(url)
                    posts.append(SocialPost(
                        platform="twitter",
                        url=url,
                        text=tweet.get("text", ""),
                        author=tweet.get("author", ""),
                        timestamp=tweet.get("timestamp"),
                        engagement=tweet.get("likes", 0) + tweet.get("retweets", 0),
                    ))
                    
                await asyncio.sleep(2.0)  # Rate limit between searches
                
            except Exception as e:
                logger.warning(f"Twitter search failed for '{keyword}': {e}")
        
        logger.info(f"Twitter: Found {len(posts)} new posts")
        return posts

    async def check_reddit(self, subreddits: Optional[list[str]] = None) -> list[SocialPost]:
        """
        Check Reddit for supply chain posts.
        
        Args:
            subreddits: Subreddits to monitor, defaults to SUPPLY_CHAIN_SUBREDDITS
            
        Returns:
            List of SocialPost objects
        """
        posts = []
        subreddits = subreddits or SUPPLY_CHAIN_SUBREDDITS
        
        if not await self._init_reddit():
            return posts
        
        for sub_name in subreddits:
            try:
                subreddit = await self.reddit_client.subreddit(sub_name)
                
                async for submission in subreddit.hot(limit=10):
                    url = f"https://reddit.com{submission.permalink}"
                    if url in self.seen_urls:
                        continue
                    
                    self.seen_urls.add(url)
                    
                    # Combine title and selftext
                    text = submission.title
                    if hasattr(submission, 'selftext') and submission.selftext:
                        text += "\n\n" + submission.selftext[:500]
                    
                    posts.append(SocialPost(
                        platform="reddit",
                        url=url,
                        text=text,
                        author=str(submission.author) if submission.author else "[deleted]",
                        timestamp=datetime.fromtimestamp(submission.created_utc),
                        engagement=submission.score,
                        subreddit=sub_name,
                    ))
                
                await asyncio.sleep(1.0)  # Rate limit
                
            except Exception as e:
                logger.warning(f"Reddit check failed for r/{sub_name}: {e}")
        
        logger.info(f"Reddit: Found {len(posts)} new posts")
        return posts

    async def check_all(self) -> list[SocialPost]:
        """
        Check all social media platforms.
        
        Returns:
            Combined list of posts, sorted by engagement.
        """
        twitter_posts = await self.check_twitter()
        reddit_posts = await self.check_reddit()
        
        all_posts = twitter_posts + reddit_posts
        all_posts.sort(key=lambda x: x.engagement, reverse=True)
        
        return all_posts

    def get_stats(self) -> dict:
        """Get social monitor statistics."""
        return {
            "seen_urls_count": len(self.seen_urls),
            "subreddits": SUPPLY_CHAIN_SUBREDDITS,
            "keywords": SUPPLY_CHAIN_KEYWORDS[:5],
        }

    async def close(self):
        """Clean up resources."""
        if self.reddit_client:
            await self.reddit_client.close()


# Global instance
social_monitor = SocialMonitor()
