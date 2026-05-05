# ⚽ EPL AI Predictor

AI-powered English Premier League match prediction agent. Uses Claude AI with live football data to analyze team form, standings, and head-to-head records before predicting outcomes.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    EPL Predictor Stack                   │
├──────────────┬──────────────┬────────────┬──────────────┤
│   Frontend   │   Backend    │  Monitoring│    Cache     │
│ React + nginx│  FastAPI     │ Prometheus │    Redis     │
│   Port 3000  │  Port 8000   │ Port 9090  │  Port 6379   │
│              │              │  Grafana   │              │
│              │  Claude Agent│ Port 3001  │              │
│              │  + Tool Use  │            │              │
└──────────────┴──────────────┴────────────┴──────────────┘
                      │
          ┌───────────┴───────────┐
          │   External APIs        │
          │  football-data.org    │
          │  Anthropic Claude     │
          └───────────────────────┘
```

## Quick Start

### 1. Get Free API Keys

| Service | URL | Cost |
|---------|-----|------|
| **Anthropic** | https://console.anthropic.com | Pay per use |
| **football-data.org** | https://www.football-data.org/client/register | **Free** (10 req/min) |

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run with Docker

```bash
docker compose up --build
```

**Services:**
- 🖥️  UI: http://localhost:3000
- 📡 API: http://localhost:8000/docs
- 📊 Grafana: http://localhost:3001 (admin / admin123)
- 🔥 Prometheus: http://localhost:9090

### 4. Make a Prediction

```bash
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"home_team": "Arsenal", "away_team": "Liverpool"}'
```

## Agent Flow

```
User Request
    │
    ▼
Claude Agent (claude-sonnet-4)
    │
    ├─► get_epl_standings()         ──► football-data.org /standings
    ├─► get_team_recent_form(home)  ──► football-data.org /teams/{id}/matches
    ├─► get_team_recent_form(away)  ──► football-data.org /teams/{id}/matches
    ├─► get_head_to_head(home,away) ──► computed from match history
    │
    ▼
Structured Analysis:
  - Form last 5 matches
  - Goals scored/conceded trends
  - League position & points
  - H2H record (last 10 meetings)
  - Home/away advantage
    │
    ▼
Prediction JSON:
  - Outcome (home_win / draw / away_win)
  - Probabilities (3 values summing to 1.0)
  - Predicted score
  - Confidence score
  - Key factors (5 bullets)
  - Full analysis (3-4 paragraphs)
```

## Deployment Options

### Option A: Railway (Recommended — Free Tier)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Create project
railway init

# Deploy backend
cd backend && railway up

# Deploy frontend
cd frontend && railway up

# Add Redis plugin in Railway dashboard
# Set environment variables in Railway dashboard
```

**Railway free tier:** 500 hours/month, $5 credit for new accounts.

### Option B: Render (Free)

```bash
# Push to GitHub, then:
# 1. Connect repo at https://render.com
# 2. Create Web Service for backend (Dockerfile: backend/Dockerfile)
# 3. Create Static Site for frontend (Build: npm run build, Publish: build/)
# 4. Add Redis (Render Redis free tier)
# 5. Set environment variables
```

### Option C: AWS SageMaker

See `deploy/sagemaker/deploy.ipynb` for full notebook with:
- ECR image push
- SageMaker endpoint deployment
- CloudWatch monitoring dashboard

**Free tier:** `ml.t3.medium` — 250 hours/month free for 2 months.

### Option D: Local Docker Only

```bash
docker compose up --build
# Access at http://localhost:3000
```

## Monitoring

### Prometheus Metrics

| Metric | Description |
|--------|-------------|
| `epl_predictions_total` | Total predictions by outcome |
| `epl_prediction_duration_seconds` | Latency histogram |
| `epl_prediction_confidence` | Confidence distribution |
| `epl_api_errors_total` | API errors by endpoint |
| `epl_active_requests` | Concurrent requests |

### Grafana Dashboard

Import dashboards from `monitoring/grafana/dashboards/` or create your own at http://localhost:3001.

Datasource: Prometheus at `http://prometheus:9090`

### Stats API

```bash
curl http://localhost:8000/stats
# Returns: total predictions, avg confidence, avg duration, outcome distribution
```

## Project Structure

```
epl-predictor/
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── config.py                # Settings
│   ├── agents/
│   │   └── predictor_agent.py   # Claude agent + tool use
│   ├── data/
│   │   └── fetcher.py           # football-data.org client
│   ├── models/
│   │   └── schemas.py           # Pydantic models
│   ├── monitoring/
│   │   └── tracker.py           # Prometheus metrics
│   └── routers/
│       └── api.py               # API endpoints
├── frontend/
│   ├── src/
│   │   ├── pages/               # Predictor, Standings, Fixtures
│   │   ├── components/          # Header, PredictionResult
│   │   └── utils/api.js         # API client
│   └── nginx.conf
├── monitoring/
│   ├── prometheus/
│   └── grafana/
├── deploy/
│   ├── railway/
│   └── sagemaker/
├── docker-compose.yml
└── .env.example
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/predict` | Predict match outcome |
| GET | `/api/v1/standings` | Current EPL table |
| GET | `/api/v1/fixtures/upcoming` | Next fixtures |
| GET | `/api/v1/teams` | All EPL teams |
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/stats` | Prediction statistics |
| GET | `/docs` | Swagger UI |

## Extending the Agent

Add new tools in `backend/agents/predictor_agent.py`:

```python
{
    "name": "get_injury_report",
    "description": "Get current injury and suspension list for a team",
    "input_schema": {
        "type": "object",
        "properties": {
            "team_name": {"type": "string"}
        },
        "required": ["team_name"]
    }
}
```

Then implement it in `_execute_tool()` and the agent will automatically use it.

## License

MIT
