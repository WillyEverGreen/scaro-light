# Edgecase Deployment Guide - Vercel + Neon + Render

Complete step-by-step guide for hosting Edgecase on **Vercel (Frontend + API) + Neon (Database) + Render (Workers)**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Vercel)                         │
│              Next.js 16 UI + API Routes                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌────────────┐   ┌──────────────┐
   │ Neon    │    │ Qdrant     │   │ Neo4j Aura   │
   │Postgres │    │ Cloud      │   │ (Graph DB)   │
   │         │    │ (Vectors)  │   │              │
   └─────────┘    └────────────┘   └──────────────┘
        │
        └─────────────────┬────────────────────┐
                          │                    │
                          ▼                    ▼
                    ┌────────────┐      ┌─────────────┐
                    │ Render     │      │ Upstash     │
                    │ Workers    │      │ Redis       │
                    │(Scrapers,  │      │ (Cache)     │
                    │ Feeds,     │      │             │
                    │ Scheduler) │      │             │
                    └────────────┘      └─────────────┘
```

---

## Step 1: Setup Managed Databases

### 1.1 Neon PostgreSQL

1. Sign up at [neon.tech](https://neon.tech)
2. Create new project (default free tier)
3. Copy connection string: `postgresql://user:password@host.neon.tech/db?sslmode=require`
4. Initialize schema:
   ```bash
   psql "postgresql://user:password@host.neon.tech/edgecase?sslmode=require" < backend/db/init.sql
   ```
5. Save credentials for Vercel env vars

### 1.2 Qdrant Cloud (Vector DB)

1. Sign up at [qdrant.tech/cloud](https://qdrant.tech/cloud/)
2. Create cluster (free tier ~2GB)
3. Get Cluster URL and API Key
4. Save for Vercel/Render env vars

### 1.3 Neo4j Aura (Graph DB)

1. Sign up at [neo4j.com/cloud/aura](https://neo4j.com/cloud/aura/)
2. Create free instance
3. Get connection string and password
4. Save for Vercel/Render env vars

### 1.4 Upstash Redis (Optional but recommended)

1. Sign up at [upstash.com](https://upstash.com/)
2. Create Redis database (free tier: 10K commands/day)
3. Get connection string: `redis://default:password@host.upstash.io:port`
4. Save for Render env vars

---

## Step 2: Deploy Frontend on Vercel

### 2.1 Connect GitHub Repository

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" → Select your GitHub repo
4. Select `frontend/` as root directory
5. Click "Deploy"

### 2.2 Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://...@neon.tech/...
QDRANT_HOST=your-cluster.qdrant.io
QDRANT_API_KEY=xxxx
NEO4J_URI=neo4j+s://xxxx.databases.neo4j.io
NEO4J_PASSWORD=xxxx
NVIDIA_API_KEY=your_nvidia_api_key
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
API_BASE_URL=https://your-app.vercel.app
ENVIRONMENT=production
DEBUG=false
```

### 2.3 Verify Deployment

```bash
# Frontend should be live at https://your-app.vercel.app
# Test: curl https://your-app.vercel.app
```

---

## Step 3: Deploy Workers on Render

### 3.1 Create Render Service

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name:** `edgecase-workers`
   - **Runtime:** Python 3.11
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `python -m backend.worker_main`
   - **Instance Type:** Starter ($7/month)
   - **Environment Variables:** (see below)

### 3.2 Set Environment Variables on Render

In Render Service Settings → Environment, add all vars from `.env.example`:

```
DATABASE_URL=postgresql://...@neon.tech/...
QDRANT_HOST=your-cluster.qdrant.io
QDRANT_API_KEY=xxxx
NEO4J_URI=neo4j+s://xxxx.databases.neo4j.io
NEO4J_PASSWORD=xxxx
REDIS_URL=redis://default:password@host.upstash.io:port
NVIDIA_API_KEY=your_nvidia_api_key
FEED_POLL_INTERVAL=5
SCRAPER_TIMEOUT=30
ENVIRONMENT=production
DEBUG=false
```

### 3.3 Deploy

1. Click "Deploy"
2. Render will:
   - Clone your repo
   - Install dependencies
   - Start `backend/worker_main.py`
   - Run background services (RSS feeds, scrapers, scheduler)

### 3.4 Verify Worker is Running

- Check Render dashboard for service status
- Tail logs to see: `📡 RSS feed polling...`, `🔄 Starting scraping scheduler...`
- Should show: `✅ Started N background services`

---

## Step 4: Connect Frontend to Backend APIs

### 4.1 Update Frontend Environment

In `frontend/.env.local` (Vercel):
```
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### 4.2 Create Next.js API Routes

The FastAPI endpoints need to be ported to Next.js API routes in `frontend/src/app/api/`.

**Example:** Port `/api/dashboard` endpoint

**Before (FastAPI in `backend/api/dashboard.py`):**
```python
@router.get("/dashboard")
async def get_dashboard():
    return {"status": "ok", "data": [...]}
```

**After (Next.js in `frontend/src/app/api/dashboard/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Call Neon/external services directly from Next.js
    // Or proxy to a backend API if needed
    return NextResponse.json({ status: 'ok', data: [...] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

**For now:** You can keep FastAPI running on a separate Render service as a secondary "API backend" and proxy from Vercel to it. (Recommended for MVP).

### 4.3 CORS Configuration

Frontend on `https://your-app.vercel.app` calling API on `https://api.vercel.app`:
- Update CORS in FastAPI (if using separate backend):
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["https://your-app.vercel.app"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

---

## Step 5: Optional - Deploy FastAPI as Separate API Service (for MVP)

If you want to keep FastAPI running separately:

1. In Render, create **another** Web Service
   - **Name:** `edgecase-api`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
   - **Environment:** Same DB/service credentials as workers

2. Point frontend to: `https://edgecase-api.render.app`

3. Update CORS and env vars accordingly

---

## Step 6: Database Initialization

### 6.1 Run Initial Migration on Neon

```bash
# Run SQL schema
psql "postgresql://user:pass@neon.tech/edgecase?sslmode=require" < backend/db/init.sql

# Or via Neon web UI → SQL Editor
```

### 6.2 Populate Graph (Optional)

```bash
# Run locally (or in a one-off Render job):
python backend/populate_graph.py

# Set env vars:
export DATABASE_URL="postgresql://..."
export NEO4J_URI="neo4j+s://..."
```

---

## Step 7: Monitoring & Logs

### Vercel Logs
```bash
# Real-time logs
vercel logs --follow

# Or in Vercel dashboard → Deployments → Logs
```

### Render Logs
```bash
# Tail worker service logs in Render dashboard
# Or: render logs -i edgecase-workers
```

---

## Step 8: GitHub Actions CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Frontend to Vercel
        run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Workers to Render
        run: |
          curl https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }}
```

---

## Troubleshooting

### Problem: "Cannot connect to Neon database"
- Check connection string (copy exactly from Neon dashboard)
- Verify firewall allows outbound connections (should be OK on Vercel/Render)
- Test locally: `psql "postgresql://..."`

### Problem: "Workers not starting"
- Check Render logs for Python import errors
- Verify all env vars are set (especially `DATABASE_URL`, `NEO4J_URI`)
- Check `backend/worker_main.py` syntax

### Problem: "Frontend can't reach API"
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS headers in API response
- Test API endpoint directly: `curl https://your-api.render.app/api/dashboard`

### Problem: "Qdrant/Neo4j connection timeout"
- Verify cluster is running (check dashboard)
- Confirm credentials and connection string
- Whitelist Vercel/Render IPs if needed

---

## Next Steps

1. ✅ Setup databases (Neon, Qdrant, Neo4j, Redis)
2. ✅ Deploy frontend on Vercel
3. ✅ Deploy workers on Render
4. ⏳ Port FastAPI routes to Next.js (or keep FastAPI as separate API service)
5. ⏳ Setup monitoring and alerts
6. ⏳ Configure custom domain

---

## Quick Reference: Deployment URLs

| Service    | Type     | URL                            | Dashboard                       |
|------------|----------|--------------------------------|---------------------------------|
| Frontend   | Vercel   | https://your-app.vercel.app    | vercel.com/dashboard            |
| Workers    | Render   | render.com (background)        | render.com/services             |
| Database   | Neon     | (managed, accessed via string) | console.neon.tech              |
| Vectors    | Qdrant   | https://cluster.qdrant.io      | cloud.qdrant.io                 |
| Graph      | Neo4j    | neo4j+s://...databases.neo4j.io | aura.neo4j.io                  |
| Cache      | Upstash  | (managed via string)           | upstash.com/console             |

---

## Support & Questions

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Neon Docs: https://neon.tech/docs
- Qdrant Docs: https://qdrant.tech/documentation/
- Neo4j Docs: https://neo4j.com/developer/
