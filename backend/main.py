import structlog
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from config import get_settings
from agents.predictor_agent import EPLPredictorAgent
from data.fetcher import FootballDataClient
from routers.api import (
    predict_router, data_router, monitoring_router,
    set_agent, set_football_client
)
from monitoring.tracker import metrics_middleware
from models.schemas import HealthResponse

# ─── Logging setup ────────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.BoundLogger,
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger()
settings = get_settings()

# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting EPL Predictor API", environment=settings.environment)

    agent = EPLPredictorAgent()
    football_client = FootballDataClient()

    set_agent(agent)
    set_football_client(football_client)

    logger.info("Agent and football client initialized")
    yield

    await agent.close()
    logger.info("Shutdown complete")


# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="EPL AI Predictor",
    description="AI-powered English Premier League match prediction agent",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.middleware("http")(metrics_middleware)

# ─── Routes ───────────────────────────────────────────────────────────────────

app.include_router(predict_router)
app.include_router(data_router)
app.include_router(monitoring_router)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        football_api="connected",
        claude_api="connected",
    )


@app.get("/")
async def root():
    return {"message": "EPL AI Predictor API", "docs": "/docs", "version": "1.0.0"}
