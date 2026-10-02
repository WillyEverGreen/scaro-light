# Edgecase Deployment Checklist

Complete checklist for deploying Edgecase on Vercel + Neon + Render.

## ✅ Pre-Deployment (Local Setup)

- [ ] Clone repo and install dependencies: `pip install -r backend/requirements.txt`
- [ ] Copy `.env.example` to `.env` and update localhost values
- [ ] Verify local setup runs: `python backend/main.py`
- [ ] Test frontend builds: `cd frontend && npm run build`
- [ ] Commit all changes to GitHub

## 📦 Cloud Service Signup (Free Tier Available)

- [ ] **Neon** (Postgres): https://neon.tech — sign up, create project, get connection string
- [ ] **Qdrant Cloud** (Vector DB): https://qdrant.tech/cloud — get cluster URL + API key
- [ ] **Neo4j Aura** (Graph DB): https://neo4j.com/cloud/aura — get URI + password
- [ ] **Upstash Redis** (optional): https://upstash.com — get connection string
- [ ] **Vercel** (Frontend hosting): https://vercel.com
- [ ] **Render** (Worker hosting): https://render.com

## 🗄️ Database Setup

- [ ] **Neon:**
  - [ ] Create project and get connection string
  - [ ] Run schema: `psql "postgresql://..." < backend/db/init.sql`
  - [ ] Test connection from local machine

- [ ] **Qdrant Cloud:**
  - [ ] Create cluster
  - [ ] Save cluster URL and API key

- [ ] **Neo4j Aura:**
  - [ ] Create instance
  - [ ] Save URI and password

## 🚀 Vercel Frontend Deployment

- [ ] Push code to GitHub
- [ ] Go to https://vercel.com → New Project
- [ ] Select GitHub repo
- [ ] Set root directory: `frontend/`
- [ ] Add environment variables:
  - [ ] `DATABASE_URL` (Neon connection string)
  - [ ] `QDRANT_HOST`, `QDRANT_API_KEY`
  - [ ] `NEO4J_URI`, `NEO4J_PASSWORD`
  - [ ] `GEMINI_API_KEY`, `OLLAMA_BASE_URL`
  - [ ] `ENVIRONMENT=production`, `DEBUG=false`
  - [ ] `NEXT_PUBLIC_API_URL=https://your-app.vercel.app`
- [ ] Deploy
- [ ] Verify: https://your-app.vercel.app loads without errors
- [ ] Check build logs for any failures

## 👷 Render Worker Deployment

- [ ] Go to https://render.com → New Service
- [ ] Connect GitHub repo
- [ ] Configure:
  - [ ] Name: `edgecase-workers`
  - [ ] Runtime: Python 3.11
  - [ ] Build: `pip install -r backend/requirements.txt`
  - [ ] Start: `python -m backend.worker_main`
- [ ] Add same environment variables as Vercel
- [ ] Deploy
- [ ] Tail logs: Check for `✅ Started N background services`

## 🔗 Integration Testing

- [ ] Frontend loads at Vercel URL
- [ ] Test dashboard endpoint: `curl https://your-app.vercel.app/api/dashboard` (once API routes added)
- [ ] Check Render logs for scraper/feed activity
- [ ] Query Neon database from frontend (test data flow)

## 📊 Optional: Separate FastAPI API Service (MVP Strategy)

If keeping FastAPI as separate service:

- [ ] Create another Render service: `edgecase-api`
  - [ ] Start command: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
  - [ ] Add same env vars
  - [ ] Update frontend API calls to point to `edgecase-api.render.app`
- [ ] Update CORS to allow Vercel origin

## 🔐 Post-Deployment

- [ ] Set up monitoring alerts (Render, Vercel dashboards)
- [ ] Enable error tracking (Sentry, etc.)
- [ ] Configure backups for Neon
- [ ] Setup domain (optional, point to Vercel)
- [ ] Enable GitHub Actions for auto-deploy (see `.github/workflows/deploy.yml`)

## 🔄 Ongoing Maintenance

- [ ] Monitor costs (Vercel free tier, Render $7/month, Neon free tier)
- [ ] Check logs weekly for errors
- [ ] Rotate secrets quarterly
- [ ] Update dependencies monthly
- [ ] Test database backups

---

## Quick Command Reference

```bash
# Test local setup
python backend/main.py
cd frontend && npm run dev

# Initialize Neon database
psql "postgresql://..." < backend/db/init.sql

# Check worker service status (Render)
# → View in Render dashboard

# View Vercel logs
vercel logs --follow

# Trigger manual data population (if needed)
export DATABASE_URL="postgresql://..."
python backend/populate_graph.py
```

---

## Estimated Costs (Monthly)

| Service      | Free Tier | Paid Tier |
|--------------|-----------|-----------|
| Vercel       | ✅ Yes    | $20+      |
| Render       | ✅ (limited) | $7+      |
| Neon         | ✅ Yes    | $10+      |
| Qdrant Cloud | ✅ (2GB)  | $20+      |
| Neo4j Aura   | ✅ Yes    | $15+      |
| Upstash Redis| ✅ (10K)  | $5+       |
| **Total**    | **~$0-20**| **~$80+** |

---

## Support

- 📖 Read: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 🐛 Issues: Check Render/Vercel logs
- 💬 Help: Ask in GitHub Issues
