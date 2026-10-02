"""
Debug & Data Browser API

View scraped data, search, and manage the continuous pipeline.
"""

import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

router = APIRouter()


class SchedulerControl(BaseModel):
    """Scheduler control request."""
    action: str  # start, stop, run_once
    interval_minutes: Optional[int] = None


class DataSearchRequest(BaseModel):
    """Data search request."""
    query: Optional[str] = None
    source: Optional[str] = None
    category: Optional[str] = None
    country: Optional[str] = None
    limit: int = 50
    offset: int = 0


@router.get("/stats")
async def get_pipeline_stats():
    """Get pipeline statistics."""
    from data.scheduler import scheduler
    
    return {
        "scheduler": scheduler.stats.to_dict(),
        "data_store": scheduler.data_store.get_stats(),
    }


@router.get("/items")
async def get_scraped_items(
    limit: int = 50,
    offset: int = 0,
    source: Optional[str] = None,
    category: Optional[str] = None,
    country: Optional[str] = None,
    query: Optional[str] = None,
):
    """Get scraped items with optional filtering."""
    from data.scheduler import scheduler
    
    if query or source or category or country:
        items = scheduler.data_store.search(
            query=query,
            source=source,
            category=category,
            country=country,
            limit=limit,
        )
    else:
        items = scheduler.data_store.get_all(limit=limit, offset=offset)
    
    return {
        "items": [
            {
                "id": item.id,
                "title": item.title,
                "content": item.content[:500] if item.content else "",
                "url": item.url,
                "source": item.source,
                "source_name": item.source_name,
                "countries": item.countries,
                "commodities": item.commodities,
                "category": item.category,
                "severity": item.severity,
                "risk_score": item.risk_score,
                "ai_summary": item.ai_summary,
                "scraped_at": item.scraped_at.isoformat() if item.scraped_at else None,
                "processed_at": item.processed_at.isoformat() if item.processed_at else None,
            }
            for item in items
        ],
        "total": len(scheduler.data_store.items),
        "limit": limit,
        "offset": offset,
    }


@router.get("/item/{item_id}")
async def get_item_detail(item_id: str):
    """Get full details of a single item."""
    from data.scheduler import scheduler
    
    for item in scheduler.data_store.items:
        if item.id == item_id:
            return {
                "id": item.id,
                "title": item.title,
                "content": item.content,
                "url": item.url,
                "source": item.source,
                "source_name": item.source_name,
                "countries": item.countries,
                "organizations": item.organizations,
                "commodities": item.commodities,
                "category": item.category,
                "severity": item.severity,
                "risk_score": item.risk_score,
                "ai_summary": item.ai_summary,
                "scraped_at": item.scraped_at.isoformat() if item.scraped_at else None,
                "processed_at": item.processed_at.isoformat() if item.processed_at else None,
            }
    
    raise HTTPException(status_code=404, detail="Item not found")


@router.post("/scheduler/control")
async def control_scheduler(
    request: SchedulerControl,
    background_tasks: BackgroundTasks,
):
    """Control the continuous scheduler."""
    from data.scheduler import scheduler
    
    if request.action == "start":
        if scheduler.is_running():
            return {"status": "already_running"}
        
        if request.interval_minutes:
            scheduler.interval_minutes = request.interval_minutes
        
        background_tasks.add_task(scheduler.start_continuous)
        return {"status": "started", "interval_minutes": scheduler.interval_minutes}
    
    elif request.action == "stop":
        scheduler.stop()
        return {"status": "stopped"}
    
    elif request.action == "run_once":
        if scheduler.stats.is_running:
            return {"status": "already_running"}
        
        background_tasks.add_task(scheduler.run_scraping_cycle, True)
        return {"status": "running_once"}
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")


@router.get("/scheduler/status")
async def get_scheduler_status():
    """Get scheduler status."""
    from data.scheduler import scheduler
    
    return {
        "is_running": scheduler.is_running(),
        "stats": scheduler.stats.to_dict(),
        "interval_minutes": scheduler.interval_minutes,
    }


@router.get("/sources")
async def get_available_sources():
    """Get available data sources for filtering."""
    from data.scheduler import scheduler
    
    sources = set()
    categories = set()
    countries = set()
    
    for item in scheduler.data_store.items:
        sources.add(item.source)
        if item.category:
            categories.add(item.category)
        for c in item.countries:
            # Handle CountryMention objects or strings
            if hasattr(c, "name"):
                countries.add(c.name)
            elif isinstance(c, dict) and "name" in c:
                countries.add(c["name"])
            else:
                countries.add(str(c))
    
    return {
        "sources": sorted(sources),
        "categories": sorted(categories),
        "countries": sorted(countries),
    }


@router.post("/interpret/{item_id}")
async def interpret_item(item_id: str):
    """Get AI interpretation for an item."""
    from data.scheduler import scheduler
    from ai.nvidia_client import nvidia_client
    
    # Find item
    item = None
    for i in scheduler.data_store.items:
        if i.id == item_id:
            item = i
            break
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Generate interpretation
    try:
        prompt = f"""Analyze this supply chain event:

Title: {item.title}
Content: {item.content[:1500] if item.content else 'No content'}
Category: {item.category}
Countries: {', '.join(item.countries) if item.countries else 'Not specified'}
Commodities: {', '.join(item.commodities) if item.commodities else 'Not specified'}

Provide:
1. Risk Assessment (Critical/High/Medium/Low)
2. Potential Impact on supply chains
3. Affected industries
4. Recommended actions
5. Expected timeline of impact"""

        interpretation = await nvidia_client.generate(prompt, temperature=0.4)
        
        return {
            "item_id": item_id,
            "interpretation": interpretation,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI interpretation failed: {e}")


@router.delete("/items")
async def clear_items():
    """Clear all scraped items (for debugging)."""
    from data.scheduler import scheduler
    
    count = len(scheduler.data_store.items)
    scheduler.data_store.items = []
    
    return {"cleared": count}


@router.delete("/database/memory")
async def clear_memory_store():
    """Clear in-memory data store."""
    from data.scheduler import scheduler
    
    count = len(scheduler.data_store.items)
    scheduler.data_store.items = []
    scheduler.stats = scheduler.stats.__class__()  # Reset stats
    
    return {"status": "cleared", "items_cleared": count, "database": "memory"}


@router.delete("/database/postgresql")
async def clear_postgresql():
    """Clear PostgreSQL event data."""
    try:
        from db.postgres import async_session
        from db.models import Event
        from sqlalchemy import delete
        
        async with async_session() as session:
            result = await session.execute(delete(Event))
            await session.commit()
            
        return {"status": "cleared", "database": "postgresql"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear PostgreSQL: {e}")


@router.delete("/database/neo4j")
async def clear_neo4j():
    """Clear Neo4j graph data."""
    try:
        from db.neo4j_client import neo4j_client
        
        # Delete all nodes and relationships
        await neo4j_client.run_query("MATCH (n) DETACH DELETE n")
        
        return {"status": "cleared", "database": "neo4j"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear Neo4j: {e}")


@router.delete("/database/qdrant")
async def clear_qdrant():
    """Clear Qdrant vector store."""
    try:
        from db.qdrant_client import qdrant_client
        
        # Recreate collection
        await qdrant_client.recreate_collection()
        
        return {"status": "cleared", "database": "qdrant"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear Qdrant: {e}")


@router.delete("/database/all")
async def clear_all_databases():
    """Clear all databases."""
    results = {}
    
    # Clear memory
    try:
        from data.scheduler import scheduler
        count = len(scheduler.data_store.items)
        scheduler.data_store.items = []
        scheduler.stats = scheduler.stats.__class__()
        results["memory"] = {"status": "cleared", "items_cleared": count}
    except Exception as e:
        results["memory"] = {"status": "error", "error": str(e)}
    
    # Clear PostgreSQL
    try:
        from db.postgres import async_session
        from db.models import Event
        from sqlalchemy import delete
        
        async with async_session() as session:
            await session.execute(delete(Event))
            await session.commit()
        results["postgresql"] = {"status": "cleared"}
    except Exception as e:
        results["postgresql"] = {"status": "error", "error": str(e)}
    
    # Clear Neo4j
    try:
        from db.neo4j_client import neo4j_client
        await neo4j_client.run_query("MATCH (n) DETACH DELETE n")
        results["neo4j"] = {"status": "cleared"}
    except Exception as e:
        results["neo4j"] = {"status": "error", "error": str(e)}
    
    # Clear Qdrant
    try:
        from db.qdrant_client import qdrant_client
        await qdrant_client.recreate_collection()
        results["qdrant"] = {"status": "cleared"}
    except Exception as e:
        results["qdrant"] = {"status": "error", "error": str(e)}
    
    return {"status": "completed", "results": results}
