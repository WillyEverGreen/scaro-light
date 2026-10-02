"""
Worker entry point for Render - runs all background jobs continuously.
Orchestrates feed polling, web scraping, graph population, and scheduled tasks.
"""

import asyncio
import logging
import sys
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


async def main():
    """Start all background services."""
    logger.info("🚀 Edgecase Worker starting...")
    
    # Load environment
    from dotenv import load_dotenv
    load_dotenv()
    
    # Import services
    try:
        from feeds.feed_manager import feed_manager
        from data.scheduler import scheduler
        from scraping.auto_crawler import AutoCrawler
        logger.info("✅ All service modules imported successfully")
    except ImportError as e:
        logger.error(f"❌ Failed to import services: {e}")
        sys.exit(1)
    
    # Create tasks for each service
    tasks = []
    
    try:
        # Task 1: RSS Feed Polling (every 5 minutes)
        logger.info("📡 Starting RSS feed polling...")
        feed_task = asyncio.create_task(
            feed_manager.start_continuous(interval_minutes=5)
        )
        tasks.append(feed_task)
        
        # Task 2: Scraping Scheduler (every 10 minutes)
        logger.info("🔄 Starting scraping scheduler...")
        scheduler_task = asyncio.create_task(
            scheduler.start_continuous(interval_minutes=10)
        )
        tasks.append(scheduler_task)
        
        # Task 3: Auto-crawler (optional, runs on-demand or scheduled)
        # Uncomment to enable autonomous crawling
        # logger.info("🕷️ Starting auto-crawler...")
        # crawler = AutoCrawler()
        # crawler_task = asyncio.create_task(crawler.start_continuous())
        # tasks.append(crawler_task)
        
        logger.info(f"✅ Started {len(tasks)} background services")
        logger.info("⏰ Services running continuously - press Ctrl+C to stop")
        
        # Run all tasks concurrently, wait for any to fail
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Service {i} failed: {result}")
    
    except KeyboardInterrupt:
        logger.info("⛔ Shutdown signal received")
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        logger.info("✅ All services stopped")
    except Exception as e:
        logger.error(f"❌ Worker error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
