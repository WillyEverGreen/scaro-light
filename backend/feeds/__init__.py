"""
Edgecase Feeds Module

RSS/Atom feed management and social media monitoring.
"""

from feeds.feed_manager import feed_manager, FeedManager, FeedSource
from feeds.social_monitor import social_monitor, SocialMonitor, SocialPost

__all__ = [
    "feed_manager", "FeedManager", "FeedSource",
    "social_monitor", "SocialMonitor", "SocialPost",
]
