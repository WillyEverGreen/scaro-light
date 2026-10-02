"""
Twitter/X Scraper

Scrape tweets and profiles from Twitter/X using Playwright XHR interception.
Based on ref/web_scraper.py approach.
"""

import asyncio
import re
import json
from typing import Optional, Callable
from dataclasses import dataclass
from datetime import datetime

import nest_asyncio
from playwright.async_api import async_playwright
import spacy

# Apply nest_asyncio for nested event loops
nest_asyncio.apply()

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess
    import sys
    print("Downloading spaCy model...")
    subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")


@dataclass
class Tweet:
    """Parsed tweet data."""
    id: str
    text: str
    author: str
    created_at: Optional[str] = None
    retweet_count: int = 0
    like_count: int = 0
    url: str = ""
    organizations: list = None
    
    def __post_init__(self):
        if self.organizations is None:
            self.organizations = []
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "text": self.text,
            "author": self.author,
            "created_at": self.created_at,
            "retweet_count": self.retweet_count,
            "like_count": self.like_count,
            "url": self.url,
            "organizations": self.organizations,
        }


class TwitterScraper:
    """
    Twitter/X scraper using Playwright with XHR interception.
    
    Captures Twitter's internal API responses for clean data extraction.
    """
    
    # Supply chain related accounts to monitor
    SUPPLY_CHAIN_ACCOUNTS = [
        "Reuters",
        "business",  # Bloomberg
        "FT",  # Financial Times
        "SupplyChainBrain",
        "LogisticsNews",
        "JOaborshade",  # Supply chain expert
        "ZeroHedge",
        "WBInventory",
        "FreightWaves",
        "maritime_exec",
    ]
    
    # Keywords for supply chain search
    SUPPLY_CHAIN_KEYWORDS = [
        "supply chain disruption",
        "semiconductor shortage",
        "chip shortage",
        "port congestion",
        "shipping delays",
        "trade sanctions",
        "export ban",
        "supply chain crisis",
        "logistics disruption",
        "manufacturing shortage",
    ]
    
    def __init__(self, headless: bool = True, timeout: int = 30000):
        self.headless = headless
        self.timeout = timeout
    
    async def scrape_tweet(self, url: str) -> Optional[Tweet]:
        """
        Scrape a single tweet using XHR interception.
        
        Args:
            url: Tweet URL
            
        Returns:
            Tweet object or None if failed
        """
        _xhr_calls = []
        
        def intercept_response(response):
            """Capture background XHR requests."""
            if response.request.resource_type == "xhr":
                _xhr_calls.append(response)
            return response
        
        try:
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(headless=self.headless)
                context = await browser.new_context(
                    viewport={"width": 1920, "height": 1080}
                )
                page = await context.new_page()
                
                # Enable XHR interception
                page.on("response", intercept_response)
                
                # Navigate to tweet
                await page.goto(url)
                await page.wait_for_selector("[data-testid='tweet']", timeout=self.timeout)
                
                # Extract tweet ID from URL
                tweet_id_match = re.search(r'/status/(\d+)', url)
                tweet_id = tweet_id_match.group(1) if tweet_id_match else ""
                
                tweet_data = {
                    "id": tweet_id,
                    "url": url,
                }
                
                # Try to extract from XHR API calls
                tweet_calls = [f for f in _xhr_calls if "TweetResultByRestId" in f.url]
                for xhr in tweet_calls:
                    try:
                        data = await xhr.json()
                        tweet = data['data']['tweetResult']['result']
                        tweet_data['text'] = tweet['legacy']['full_text']
                        tweet_data['created_at'] = tweet['legacy']['created_at']
                        tweet_data['author'] = tweet['core']['user_results']['result']['legacy']['screen_name']
                        tweet_data['retweet_count'] = tweet['legacy']['retweet_count']
                        tweet_data['like_count'] = tweet['legacy']['favorite_count']
                        break
                    except (KeyError, json.JSONDecodeError):
                        continue
                
                # Fallback to HTML extraction
                if 'text' not in tweet_data:
                    try:
                        tweet_text = await page.text_content("[data-testid='tweetText']")
                        tweet_data['text'] = tweet_text or ""
                    except Exception:
                        tweet_data['text'] = ""
                
                await browser.close()
                
                # Extract organizations using NLP
                if tweet_data.get('text'):
                    doc = nlp(tweet_data['text'])
                    tweet_data['organizations'] = [
                        ent.text for ent in doc.ents if ent.label_ == 'ORG'
                    ]
                else:
                    tweet_data['organizations'] = []
                
                return Tweet(**tweet_data)
                
        except Exception as e:
            print(f"Twitter scrape error: {e}")
            return None
    
    async def search_tweets(
        self,
        query: str,
        max_results: int = 20,
        progress_callback: Optional[Callable] = None,
    ) -> list[Tweet]:
        """
        Search for tweets matching a query.
        
        Args:
            query: Search query
            max_results: Maximum tweets to return
            progress_callback: Optional progress callback
        """
        tweets = []
        
        try:
            async with async_playwright() as pw:
                browser = await pw.chromium.launch(headless=self.headless)
                context = await browser.new_context(
                    viewport={"width": 1920, "height": 1080}
                )
                page = await context.new_page()
                
                # Navigate to Twitter search
                search_url = f"https://twitter.com/search?q={query}&src=typed_query&f=live"
                await page.goto(search_url)
                
                # Wait for tweets to load
                await page.wait_for_selector("article", timeout=self.timeout)
                
                # Scroll and collect tweets
                collected = 0
                scroll_count = 0
                max_scrolls = 10
                
                while collected < max_results and scroll_count < max_scrolls:
                    # Get all article elements
                    articles = await page.query_selector_all("article")
                    
                    for article in articles[collected:]:
                        try:
                            # Extract tweet text
                            text_el = await article.query_selector("[data-testid='tweetText']")
                            text = await text_el.text_content() if text_el else ""
                            
                            # Extract author
                            author_el = await article.query_selector("div[dir='ltr'] span")
                            author = await author_el.text_content() if author_el else ""
                            author = author.replace("@", "")
                            
                            # Extract tweet URL
                            link_el = await article.query_selector("a[href*='/status/']")
                            href = await link_el.get_attribute("href") if link_el else ""
                            tweet_url = f"https://twitter.com{href}" if href.startswith("/") else href
                            
                            # Extract tweet ID
                            tweet_id_match = re.search(r'/status/(\d+)', href or "")
                            tweet_id = tweet_id_match.group(1) if tweet_id_match else str(collected)
                            
                            # Extract organizations
                            doc = nlp(text) if text else nlp("")
                            organizations = [ent.text for ent in doc.ents if ent.label_ == 'ORG']
                            
                            tweet = Tweet(
                                id=tweet_id,
                                text=text,
                                author=author,
                                url=tweet_url,
                                organizations=organizations,
                            )
                            tweets.append(tweet)
                            collected += 1
                            
                            if progress_callback:
                                progress_callback(collected / max_results, collected)
                            
                            if collected >= max_results:
                                break
                        except Exception as e:
                            print(f"Tweet extraction error: {e}")
                            continue
                    
                    # Scroll down
                    await page.evaluate("window.scrollBy(0, 1000)")
                    await asyncio.sleep(1)
                    scroll_count += 1
                
                await browser.close()
        except Exception as e:
            print(f"Twitter search error: {e}")
        
        return tweets
    
    async def monitor_accounts(
        self,
        accounts: Optional[list[str]] = None,
        max_per_account: int = 5,
        progress_callback: Optional[Callable] = None,
    ) -> list[Tweet]:
        """
        Monitor supply chain related Twitter accounts.
        
        Args:
            accounts: List of account names to monitor (uses defaults if None)
            max_per_account: Max tweets per account
            progress_callback: Optional progress callback
        """
        accounts = accounts or self.SUPPLY_CHAIN_ACCOUNTS
        all_tweets = []
        
        for i, account in enumerate(accounts):
            try:
                async with async_playwright() as pw:
                    browser = await pw.chromium.launch(headless=self.headless)
                    context = await browser.new_context(
                        viewport={"width": 1920, "height": 1080}
                    )
                    page = await context.new_page()
                    
                    # Navigate to profile
                    await page.goto(f"https://twitter.com/{account}")
                    await page.wait_for_selector("article", timeout=self.timeout)
                    
                    # Get recent tweets
                    articles = await page.query_selector_all("article")
                    
                    for j, article in enumerate(articles[:max_per_account]):
                        try:
                            text_el = await article.query_selector("[data-testid='tweetText']")
                            text = await text_el.text_content() if text_el else ""
                            
                            link_el = await article.query_selector("a[href*='/status/']")
                            href = await link_el.get_attribute("href") if link_el else ""
                            
                            tweet_id_match = re.search(r'/status/(\d+)', href or "")
                            tweet_id = tweet_id_match.group(1) if tweet_id_match else f"{account}_{j}"
                            
                            doc = nlp(text) if text else nlp("")
                            organizations = [ent.text for ent in doc.ents if ent.label_ == 'ORG']
                            
                            tweet = Tweet(
                                id=tweet_id,
                                text=text,
                                author=account,
                                url=f"https://twitter.com{href}" if href.startswith("/") else href,
                                organizations=organizations,
                            )
                            all_tweets.append(tweet)
                        except Exception:
                            continue
                    
                    await browser.close()
                
                if progress_callback:
                    progress_callback((i + 1) / len(accounts), len(all_tweets))
                
                # Rate limiting
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"Account monitor error for @{account}: {e}")
                continue
        
        return all_tweets


# Global instance
twitter_scraper = TwitterScraper()
