# Edgecase - Supply Chain Analyser for Risk and Overconfidence

A production-ready AI-powered platform for real-time supply chain risk monitoring, disruption detection, and predictive analytics. Edgecase combines advanced data scraping, machine learning, and interactive visualization to help organizations build more resilient supply chains.

## Features

### Core Capabilities
- **Global Trade Route Overview**: Interactive map visualization with disruption markers and India domestic mode
- **Real-time Dashboard**: Live monitoring of supply chain risks, events, and statistics
- **3D Supply Chain Graph**: Interactive network visualization with node selection and connection highlighting
- **AI-Powered Analysis**: NVIDIA NIM integration for high-performance intelligent event processing
- **Automated Data Collection**: 15+ RSS feeds and 6+ news sources with continuous polling
- **Risk Assessment**: Multi-factor risk scoring with overconfidence detection
- **RAG Query System**: Ask questions about your supply chain data using natural language
- **Dataset Analysis**: Comprehensive analytics on scraped data with visualizations

### Data Sources
- **News Feeds**: Supply Chain Dive, FreightWaves, Reuters, Bloomberg, The Loadstar, Supply Chain Lens
- **Weather Data**: OpenWeatherMap integration for climate impact analysis
- **Trade Restrictions**: OFAC sanctions, export controls, tariffs tracking
- **Custom Scraping**: Auto-crawler for discovering new articles from seed sites

### India-Specific Features
- **Domestic Mode**: Focus on India's supply chain ecosystem
- **Major Ports**: Mumbai, Chennai, Kolkata, Visakhapatnam, Kandla, Cochin
- **Manufacturing Hubs**: Bangalore, Pune, Ahmedabad, Delhi NCR, Hyderabad
- **India Trade Policies**: Specialized tracking of India-specific restrictions

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Databases**: 
  - PostgreSQL - Structured data storage
  - Neo4j - Graph database for supply chain networks
  - Qdrant - Vector database for RAG
- **AI/ML**:
  - NVIDIA NIM - High-performance AI inference
  - Llama 3.1 405b / 4-Maverick 17b models
- **Scraping**: 
  - BeautifulSoup4 - HTML parsing
  - aiohttp - Async HTTP requests
  - feedparser - RSS feed processing

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: React Query (TanStack Query)
- **Visualization**: 
  - React Force Graph 3D - Network visualization
  - Custom SVG maps - Geographic visualization
- **UI Components**: Lucide React icons, custom components

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.10+
- Node.js 18+
- NVIDIA API Key (for LLM services)

### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd Edgecase
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start Docker Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Neo4j (port 7474, 7687)
- Qdrant (port 6333)

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs on: http://localhost:8000

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

### 5. Start Ollama (Optional for RAG)

```bash
ollama pull qwen2.5:3b
ollama serve
```

## Production Deployment

Ready to deploy? See the complete deployment guide for Vercel + Neon + Render:

- 📖 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** — Step-by-step production setup (Vercel frontend + Neon DB + Render workers)
- ✅ **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** — Pre-deployment checklist and quick reference

### Quick Deploy Summary

| Component | Hosting | Setup |
|-----------|---------|-------|
| Frontend (Next.js) | Vercel | Push to GitHub, auto-deploy |
| Database (Postgres) | Neon | Free tier, $0-10/month |
| Workers (Scrapers/Feeds) | Render | $7/month starter plan |
| Vector DB (Qdrant) | Qdrant Cloud | Free tier (2GB), $20+/month |
| Graph DB (Neo4j) | Neo4j Aura | Free tier, $15+/month |

**Total estimated cost:** $0-30/month (free tier) to $80+/month (production)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend (Port 3000)                │
│  Dashboard │ Trade Overview │ 3D Graph │ Events │ RAG Query     │
│  Risk Analysis │ Scraping Control │ Weather │ Restrictions      │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────────────┐
│                   FastAPI Backend (Port 8000)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Scraping   │  │ Risk Analysis│  │   AI/RAG     │          │
│  │   Engine     │  │   Engine     │  │   Engine     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  • RSS Feeds (15+) • Risk Scoring   • NVIDIA NIM API          │
│  • Auto Crawler    • Overconfidence • Vector Search           │
│  • News Scrapers   • Graph Analysis                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────────┐
│                   Data Layer (Docker)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │PostgreSQL│  │  Neo4j   │  │  Qdrant  │                       │
│  │  :5432   │  │:7474/7687│  │  :6333   │                       │
│  └──────────┘  └──────────┘  └──────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

## Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Main overview with risk metrics and recent events |
| Supply Chain Graph | `/dashboard/graph` | 3D network visualization |
| Events | `/dashboard/events` | All events with filtering and full article view |
| Risk Analysis | `/dashboard/risks` | Comprehensive risk assessment |
| Dataset Analysis | `/dashboard/analyze` | Analytics on scraped data |
| Scraping Control | `/dashboard/scraping` | Manage data collection |
| Ask AI | `/dashboard/query` | RAG-powered Q&A |
| Weather Impact | `/dashboard/weather` | Climate-related disruptions |
| Trade Restrictions | `/dashboard/restrictions` | Sanctions and export controls |
| About | `/dashboard/about` | Project information |

## Configuration

### Environment Variables

Create `.env` in the backend directory:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=edgecase
POSTGRES_USER=edgecase
POSTGRES_PASSWORD=edgecase123

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=edgecase123

# NVIDIA API (required)
NVIDIA_API_KEY=your_nvidia_api_key_here

# OpenWeatherMap (optional)
OPENWEATHER_API_KEY=your_api_key_here
```

### RSS Feeds

The system automatically monitors 15 RSS feeds including:
- Supply Chain Dive
- FreightWaves
- Reuters Business/Tech
- Bloomberg Markets
- The Loadstar
- Semiconductor Engineering
- And more...

## Usage

### Starting Data Collection

1. Navigate to **Scraping Control** page
2. Click **Start Scraping** for one-time scraping
3. Or enable **Continuous Mode** for automated polling
4. RSS feeds auto-start on backend launch (polls every 5 minutes)


### Querying with AI

1. Navigate to **Ask AI** page
2. Type your question about supply chain data
3. AI processes using RAG over scraped content
4. Get intelligent answers with source citations

## Development

### Backend Development

```bash
cd backend
# Install dev dependencies
pip install -r requirements-dev.txt
# Run tests
pytest
# Format code
black .
```

### Frontend Development

```bash
cd frontend
# Type checking
npm run type-check
# Linting
npm run lint
# Build for production
npm run build
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Acknowledgments

- Supply chain news sources for data
- Open-source community for amazing tools
- NVIDIA NIM for high-performance AI capabilities

---

Version: 1.0.0
