"""
Scraping Control API Endpoints

Start, stop, and monitor web scraping jobs.
"""

import asyncio
from datetime import datetime
from enum import Enum
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

router = APIRouter()


class ScrapingSource(str, Enum):
    """Available scraping sources."""
    SEARCH_ENGINES = "search_engines"
    TWITTER = "twitter"
    NEWS = "news"
    WEATHER = "weather"
    TRADE_RESTRICTIONS = "trade_restrictions"
    ALL = "all"


class ScrapingJobStatus(str, Enum):
    """Job status enum."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ScrapingJob(BaseModel):
    """Scraping job model."""
    id: str
    source: ScrapingSource
    status: ScrapingJobStatus
    progress: float
    items_scraped: int
    errors: int
    error_messages: list[str] = []
    started_at: Optional[datetime]
    completed_at: Optional[datetime]


class StartScrapingRequest(BaseModel):
    """Request to start scraping."""
    sources: list[ScrapingSource]
    keywords: Optional[list[str]] = None
    countries: Optional[list[str]] = None
    max_items: int = 100
    continuous: bool = False


class ScrapingConfig(BaseModel):
    """Scraping configuration."""
    threads: int
    delay_min: float
    delay_max: float
    timeout: int
    twitter_accounts: list[str]
    search_keywords: list[str]


# In-memory job storage
_active_jobs: dict[str, ScrapingJob] = {}
_job_cancel_flags: dict[str, bool] = {}


async def run_search_engine_scraping(job: ScrapingJob, keywords: list[str], max_items: int):
    """Run search engine scraping."""
    from scraping.search_engines import search_aggregator
    
    job.status = ScrapingJobStatus.RUNNING
    job.started_at = datetime.utcnow()
    
    try:
        for i, keyword in enumerate(keywords):
            if _job_cancel_flags.get(job.id, False):
                job.status = ScrapingJobStatus.CANCELLED
                break
            
            results = await search_aggregator.search_all(
                keyword,
                max_results=max_items // len(keywords),
            )
            
            job.items_scraped += len(results)
            job.progress = (i + 1) / len(keywords)
        
        if job.status != ScrapingJobStatus.CANCELLED:
            job.status = ScrapingJobStatus.COMPLETED
    except Exception as e:
        job.status = ScrapingJobStatus.FAILED
        job.errors += 1
        job.error_messages.append(str(e))
    finally:
        job.completed_at = datetime.utcnow()
        job.progress = 1.0


async def run_news_scraping(job: ScrapingJob, keywords: list[str], max_items: int):
    """Run news article scraping."""
    from scraping.news_scrapers import news_scraper
    from scraping.search_engines import search_aggregator
    
    job.status = ScrapingJobStatus.RUNNING
    job.started_at = datetime.utcnow()
    
    try:
        # First find news URLs via search
        all_urls = []
        for keyword in keywords[:3]:  # Limit keywords
            if _job_cancel_flags.get(job.id, False):
                break
            
            results = await search_aggregator.search_all(
                f"{keyword} news",
                max_results=10,
            )
            all_urls.extend([r["url"] for r in results if r.get("url")])
        
        # Scrape articles
        for i, url in enumerate(all_urls[:max_items]):
            if _job_cancel_flags.get(job.id, False):
                job.status = ScrapingJobStatus.CANCELLED
                break
            
            try:
                article = await news_scraper.scrape_article(url)
                if article:
                    job.items_scraped += 1
            except Exception:
                job.errors += 1
            
            job.progress = (i + 1) / min(len(all_urls), max_items)
        
        if job.status != ScrapingJobStatus.CANCELLED:
            job.status = ScrapingJobStatus.COMPLETED
    except Exception as e:
        job.status = ScrapingJobStatus.FAILED
        job.errors += 1
        job.error_messages.append(str(e))
    finally:
        job.completed_at = datetime.utcnow()
        job.progress = 1.0


async def run_weather_scraping(job: ScrapingJob):
    """Run weather data scraping."""
    from data.weather_monitor import weather_monitor
    
    job.status = ScrapingJobStatus.RUNNING
    job.started_at = datetime.utcnow()
    
    try:
        alerts = await weather_monitor.get_active_alerts()
        job.items_scraped = len(alerts)
        job.status = ScrapingJobStatus.COMPLETED
    except Exception as e:
        job.status = ScrapingJobStatus.FAILED
        job.errors += 1
        job.error_messages.append(str(e))
    finally:
        job.completed_at = datetime.utcnow()
        job.progress = 1.0


async def run_trade_restrictions_scraping(job: ScrapingJob):
    """Run trade restrictions scraping."""
    from data.trade_restrictions import trade_tracker
    
    job.status = ScrapingJobStatus.RUNNING
    job.started_at = datetime.utcnow()
    
    try:
        restrictions = await trade_tracker.get_all_restrictions()
        job.items_scraped = len(restrictions)
        
        # Try to get OFAC updates
        try:
            updates = await trade_tracker.scrape_ofac_updates()
            job.items_scraped += len(updates)
        except Exception:
            pass  # OFAC may block
        
        job.status = ScrapingJobStatus.COMPLETED
    except Exception as e:
        job.status = ScrapingJobStatus.FAILED
        job.errors += 1
        job.error_messages.append(str(e))
    finally:
        job.completed_at = datetime.utcnow()
        job.progress = 1.0


@router.get("/status")
async def get_scraping_status():
    """Get overall scraping system status."""
    active_count = sum(1 for j in _active_jobs.values() if j.status == ScrapingJobStatus.RUNNING)
    return {
        "status": "running" if active_count > 0 else "idle",
        "active_jobs": active_count,
        "total_jobs": len(_active_jobs),
        "jobs": [j.model_dump() for j in _active_jobs.values()],
    }


@router.post("/start")
async def start_scraping(
    request: StartScrapingRequest,
    background_tasks: BackgroundTasks,
):
    """Start a new scraping job or continuous scheduler."""
    import uuid
    from data.scheduler import scheduler
    
    # Handle continuous mode
    if request.continuous:
        if scheduler.is_running():
            return {"status": "already_running", "message": "Continuous scheduler is already running"}
        
        background_tasks.add_task(scheduler.start_continuous)
        return {"status": "started", "mode": "continuous", "message": "Started continuous scraping scheduler"}
    
    jobs_started = []
    keywords = request.keywords or [
        "supply chain disruption",
        "semiconductor shortage",
        "port congestion",
    ]
    
    for source in request.sources:
        if source == ScrapingSource.ALL:
            # Start all scrapers
            for s in [ScrapingSource.SEARCH_ENGINES, ScrapingSource.NEWS, 
                      ScrapingSource.WEATHER, ScrapingSource.TRADE_RESTRICTIONS]:
                job_id = str(uuid.uuid4())
                job = ScrapingJob(
                    id=job_id,
                    source=s,
                    status=ScrapingJobStatus.PENDING,
                    progress=0.0,
                    items_scraped=0,
                    errors=0,
                    started_at=None,
                    completed_at=None,
                )
                _active_jobs[job_id] = job
                _job_cancel_flags[job_id] = False
                
                # Add background task
                if s == ScrapingSource.SEARCH_ENGINES:
                    background_tasks.add_task(run_search_engine_scraping, job, keywords, request.max_items)
                elif s == ScrapingSource.NEWS:
                    background_tasks.add_task(run_news_scraping, job, keywords, request.max_items)
                elif s == ScrapingSource.WEATHER:
                    background_tasks.add_task(run_weather_scraping, job)
                elif s == ScrapingSource.TRADE_RESTRICTIONS:
                    background_tasks.add_task(run_trade_restrictions_scraping, job)
                
                jobs_started.append(job_id)
        else:
            job_id = str(uuid.uuid4())
            job = ScrapingJob(
                id=job_id,
                source=source,
                status=ScrapingJobStatus.PENDING,
                progress=0.0,
                items_scraped=0,
                errors=0,
                started_at=None,
                completed_at=None,
            )
            _active_jobs[job_id] = job
            _job_cancel_flags[job_id] = False
            
            # Add background task based on source
            if source == ScrapingSource.SEARCH_ENGINES:
                background_tasks.add_task(run_search_engine_scraping, job, keywords, request.max_items)
            elif source == ScrapingSource.NEWS:
                background_tasks.add_task(run_news_scraping, job, keywords, request.max_items)
            elif source == ScrapingSource.WEATHER:
                background_tasks.add_task(run_weather_scraping, job)
            elif source == ScrapingSource.TRADE_RESTRICTIONS:
                background_tasks.add_task(run_trade_restrictions_scraping, job)
            
            jobs_started.append(job_id)
    
    return {"job_ids": jobs_started, "status": "started", "message": f"Started {len(jobs_started)} scraping job(s)"}


@router.post("/stop/{job_id}")
async def stop_scraping(job_id: str):
    """Stop a running scraping job."""
    if job_id not in _active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = _active_jobs[job_id]
    if job.status != ScrapingJobStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Job is not running")
    
    _job_cancel_flags[job_id] = True
    return {"job_id": job_id, "status": "cancelling"}


@router.post("/stop-all")
async def stop_all_scraping():
    """Stop all running scraping jobs."""
    cancelled = 0
    for job_id, job in _active_jobs.items():
        if job.status == ScrapingJobStatus.RUNNING:
            _job_cancel_flags[job_id] = True
            cancelled += 1
    return {"cancelled_jobs": cancelled}


@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """Get status of a specific scraping job."""
    if job_id not in _active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return _active_jobs[job_id].model_dump()


@router.get("/config")
async def get_scraping_config():
    """Get current scraping configuration."""
    from config import settings
    return ScrapingConfig(
        threads=settings.scraping_threads,
        delay_min=settings.scraping_delay_min,
        delay_max=settings.scraping_delay_max,
        timeout=settings.scraping_timeout,
        twitter_accounts=[
            "@Reuters", "@Bloomberg", "@SupplyChainBrain",
            "@LogisticsNews", "@TradeGov", "@WTO_OMC",
        ],
        search_keywords=[
            "supply chain disruption",
            "semiconductor shortage",
            "port congestion",
            "trade sanctions",
            "export controls",
        ],
    )


@router.put("/config")
async def update_scraping_config(config: ScrapingConfig):
    """Update scraping configuration."""
    return {"status": "updated", "config": config}


@router.get("/logs")
async def get_scraping_logs(
    job_id: Optional[str] = None,
    limit: int = 100,
):
    """Get scraping logs."""
    logs = []
    for j in _active_jobs.values():
        if job_id and j.id != job_id:
            continue
        for msg in j.error_messages:
            logs.append({"job_id": j.id, "level": "error", "message": msg})
    return {"logs": logs[:limit]}


# ==================== Feed Management ====================

@router.get("/feeds")
async def get_feeds():
    """Get all RSS feeds with their status."""
    from feeds.feed_manager import feed_manager
    return feed_manager.get_stats()


@router.post("/feeds")
async def add_feed(name: str, url: str, category: str = "custom"):
    """Add a custom RSS feed."""
    from feeds.feed_manager import feed_manager
    
    success = feed_manager.add_feed(name, url, category)
    if success:
        return {"status": "added", "name": name, "url": url}
    else:
        raise HTTPException(status_code=400, detail="Feed already exists or invalid URL")


@router.delete("/feeds/{feed_name}")
async def remove_feed(feed_name: str):
    """Remove an RSS feed."""
    from feeds.feed_manager import feed_manager
    
    success = feed_manager.remove_feed(feed_name)
    if success:
        return {"status": "removed", "name": feed_name}
    else:
        raise HTTPException(status_code=404, detail="Feed not found")


# ==================== Activity & Stats ====================

@router.get("/activity")
async def get_activity_log(limit: int = 50):
    """Get live activity log for UI display."""
    from feeds.feed_manager import feed_manager
    from data.scheduler import scheduler
    
    # Combine feed activity with scheduler stats
    feed_activity = feed_manager.get_activity_log(limit=limit)
    scheduler_stats = scheduler.stats.to_dict()
    
    # Recent scraped items
    recent_items = []
    for item in scheduler.data_store.items[:10]:
        recent_items.append({
            "title": item.title[:60] + "..." if len(item.title) > 60 else item.title,
            "source": item.source_name,
            "category": item.category,
            "scraped_at": item.scraped_at.isoformat() if item.scraped_at else None,
            "risk_score": item.risk_score,
        })
    
    return {
        "feeds": feed_activity,
        "scheduler": scheduler_stats,
        "recent_items": recent_items,
        "is_polling": feed_manager._running,
    }


@router.get("/stats/detailed")
async def get_detailed_stats():
    """Get detailed per-source statistics."""
    from feeds.feed_manager import feed_manager
    from data.scheduler import scheduler
    
    feed_stats = feed_manager.get_stats()
    data_stats = scheduler.data_store.get_stats()
    
    # Group items by source
    source_breakdown = {}
    for item in scheduler.data_store.items:
        source = item.source_name or item.source
        if source not in source_breakdown:
            source_breakdown[source] = {"count": 0, "total_risk": 0}
        source_breakdown[source]["count"] += 1
        source_breakdown[source]["total_risk"] += item.risk_score
    
    # Calculate averages
    for source, stats in source_breakdown.items():
        stats["avg_risk"] = stats["total_risk"] / stats["count"] if stats["count"] > 0 else 0
    
    return {
        "feeds": feed_stats,
        "data": data_stats,
        "sources": source_breakdown,
    }


# ==================== Manual Crawl ====================

@router.post("/crawl")
async def trigger_manual_crawl(background_tasks: BackgroundTasks):
    """Trigger a manual crawl of all seed sites."""
    from scraping.auto_crawler import auto_crawler
    
    async def run_crawl():
        await auto_crawler.run_full_crawl()
    
    background_tasks.add_task(run_crawl)
    
    return {
        "status": "started",
        "message": "Manual crawl started in background",
        "sites": [s["name"] for s in auto_crawler.SEED_SITES],
    }


@router.get("/crawl/stats")
async def get_crawl_stats():
    """Get auto-crawler statistics."""
    from scraping.auto_crawler import auto_crawler
    
    stats = auto_crawler.stats
    return {
        "pages_crawled": stats.pages_crawled,
        "articles_found": stats.articles_found,
        "articles_processed": stats.articles_processed,
        "errors": stats.errors,
        "start_time": stats.start_time.isoformat() if stats.start_time else None,
        "last_activity": stats.last_activity.isoformat() if stats.last_activity else None,
        "visited_urls": len(auto_crawler.visited_urls),
        "is_running": auto_crawler._running,
    }

