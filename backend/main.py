"""
Edgecase Backend - FastAPI Application

Supply Chain Analyser for Risk and Overconfidence
"""

import warnings
import logging

# Suppress noisy warnings
warnings.filterwarnings("ignore", module="bs4")


from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from api import dashboard, scraping, risk, graph, rag, alerts, debug, agents, dataset_analyzer, weather


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    import asyncio
    
    # Startup
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    if settings.database_url:
        print(f"📊 PostgreSQL: [Connected via DATABASE_URL]")
    else:
        print(f"📊 PostgreSQL: {settings.postgres_host}:{settings.postgres_port}")
    print(f"🔗 Neo4j: {settings.neo4j_uri}")
    print(f"🧠 NVIDIA API: Enabled (model: {settings.nvidia_model})")
    
    # Initialize database connections
    try:
        from db.postgres import init_db
        await init_db()
        print("✅ Database tables initialized")
    except Exception as e:
        print(f"⚠️ PostgreSQL initialization warning: {e}")
    
    # Auto-start RSS polling in background
    try:
        from feeds.feed_manager import feed_manager
        import asyncio
        asyncio.create_task(feed_manager.start_continuous(interval_minutes=5))
        print(f"📡 RSS polling started ({len(feed_manager.feeds)} feeds)")
    except Exception as e:
        print(f"⚠️ RSS auto-start failed: {e}")
    
    yield
    
    # Shutdown
    print(f"👋 Shutting down {settings.app_name}")
    
    # Stop background tasks
    try:
        from feeds.feed_manager import feed_manager
        feed_manager.stop()
    except Exception:
        pass


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="Supply Chain Analyser for Risk and Overconfidence",
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }

@app.get("/")
async def root():
    return {"message": "Welcome to Edgecase API"}


# Register API routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(scraping.router, prefix="/api/scraping", tags=["Scraping"])
app.include_router(risk.router, prefix="/api/risk", tags=["Risk Analysis"])
app.include_router(graph.router, prefix="/api/graph", tags=["Graph"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(debug.router, prefix="/api/debug", tags=["Debug"])
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(dataset_analyzer.router, prefix="/api/analyze", tags=["Dataset Analysis"])
app.include_router(weather.router, prefix="/api/dashboard", tags=["Weather"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
