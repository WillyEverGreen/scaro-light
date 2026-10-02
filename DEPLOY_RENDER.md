Render deployment steps for Edgecase

1. Create two services in Render (or use the provided `render.yaml` via GitHub one-click):

Service A — API (Web Service)
- Name: edgecase-api
- Type: Web Service (Python)
- Branch: main
- Build Command: pip install -r backend/requirements.txt
- Start Command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
- Plan: Starter (or higher)

Service B — Workers (Background Worker)
- Name: edgecase-workers
- Type: Worker (Python)
- Branch: main
- Build Command: pip install -r backend/requirements.txt
- Start Command: python -m backend.worker_main
- Plan: Starter (or higher)

2. Environment variables to set (Render Dashboard > Environment):
- DATABASE_URL = <your neon connection string>
- NEO4J_URI = <neo4j bolt uri>
- NEO4J_PASSWORD = <neo4j password>
- QDRANT_HOST = <qdrant host>
- QDRANT_API_KEY = <qdrant api key>
- REDIS_URL = <upstash or redis url>
- GEMINI_API_KEY = <google gemini api key>
- OLLAMA_BASE_URL = <ollama base url if used>
- SECRET_KEY = <strong random secret>
- ENVIRONMENT = production
- DEBUG = false
- FEED_POLL_INTERVAL = 5

3. Health checks & ports
- Render will use `$PORT` for web services. The API uses port `$PORT` by default via uvicorn.
- Check logs after deploy to ensure DB connections succeed.

4. Verify
- Open the edgecase-api URL and GET `/` to see welcome message.
- Check logs on edgecase-workers to confirm scheduled jobs started.

5. Optional: secrets management
- Rotate `SECRET_KEY` periodically.
- Keep API keys only in Render dashboard; do not commit to git.

6. CI/CD
- You can configure GitHub Actions to trigger Render deploys via Render Deploy Hooks or the Render API.

If you want, I can also generate a GitHub Actions workflow that runs tests and calls Render's deploy API automatically when `main` is updated.
