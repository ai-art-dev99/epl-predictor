from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import time
import structlog

from models.schemas import (
    PredictionRequest, PredictionResult, StandingsResponse,
    UpcomingMatchesResponse, StandingsEntry, UpcomingMatch, PredictionOutcome
)
from agents.predictor_agent import EPLPredictorAgent
from data.fetcher import FootballDataClient
from monitoring.tracker import tracker, prediction_latency, api_errors_counter, get_metrics_response

logger = structlog.get_logger()

_agent: EPLPredictorAgent = None
_football_client: FootballDataClient = None

def set_agent(agent: EPLPredictorAgent):
    global _agent
    _agent = agent

def set_football_client(client: FootballDataClient):
    global _football_client
    _football_client = client

predict_router = APIRouter(prefix="/api/v1", tags=["predictions"])
data_router = APIRouter(prefix="/api/v1", tags=["data"])
monitoring_router = APIRouter(tags=["monitoring"])


@predict_router.post("/predict", response_model=PredictionResult)
async def predict_match(request: PredictionRequest):
    """Run the AI agent to predict a match outcome."""
    if not _agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    start_time = time.time()
    try:
        result = await _agent.predict(
            home_team=request.home_team,
            away_team=request.away_team,
            match_date=request.match_date,
        )
        duration = time.time() - start_time
        prediction_latency.observe(duration)
        tracker.record_prediction(
            home_team=request.home_team,
            away_team=request.away_team,
            outcome=result.get("predicted_outcome", "unknown"),
            confidence=result.get("confidence", 0),
            duration=duration,
        )
        return PredictionResult(
            home_team=request.home_team,
            away_team=request.away_team,
            predicted_outcome=PredictionOutcome(result["predicted_outcome"]),
            confidence=result["confidence"],
            home_win_probability=result["home_win_probability"],
            draw_probability=result["draw_probability"],
            away_win_probability=result["away_win_probability"],
            predicted_score=result["predicted_score"],
            analysis=result["analysis"],
            key_factors=result.get("key_factors", []),
        )
    except Exception as e:
        api_errors_counter.labels(endpoint="/predict", error_type=type(e).__name__).inc()
        logger.error("Prediction failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@data_router.get("/standings", response_model=StandingsResponse)
async def get_standings():
    if not _football_client:
        raise HTTPException(status_code=503, detail="Football client not initialized")
    try:
        raw = await _football_client.get_standings()
        tables = raw.get("standings", [{}])
        season = raw.get("season", {})
        season_str = f"{season.get('startDate','')[:4]}/{season.get('endDate','')[:4]}"
        matchday = season.get("currentMatchday", 0)
        entries = []
        if tables:
            for e in tables[0].get("table", []):
                team = e.get("team", {})
                entries.append(StandingsEntry(
                    position=e["position"], team_name=team.get("name",""),
                    team_id=team.get("id",0), crest_url=team.get("crest"),
                    played=e["playedGames"], won=e["won"], draw=e["draw"], lost=e["lost"],
                    goals_for=e["goalsFor"], goals_against=e["goalsAgainst"],
                    goal_difference=e["goalDifference"], points=e["points"], form=e.get("form"),
                ))
        return StandingsResponse(season=season_str, matchday=matchday, standings=entries)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@data_router.get("/fixtures/upcoming", response_model=UpcomingMatchesResponse)
async def get_upcoming_fixtures():
    if not _football_client:
        raise HTTPException(status_code=503, detail="Football client not initialized")
    try:
        raw = await _football_client.get_upcoming_matches()
        matches = []
        for m in raw.get("matches", [])[:20]:
            home = m.get("homeTeam", {})
            away = m.get("awayTeam", {})
            matches.append(UpcomingMatch(
                match_id=m.get("id",0), home_team=home.get("name",""),
                away_team=away.get("name",""), home_team_id=home.get("id",0),
                away_team_id=away.get("id",0), home_crest=home.get("crest"),
                away_crest=away.get("crest"), match_date=m.get("utcDate","")[:16],
                matchday=m.get("matchday",0), status=m.get("status",""),
            ))
        return UpcomingMatchesResponse(matches=matches)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@data_router.get("/teams")
async def get_teams():
    if not _football_client:
        raise HTTPException(status_code=503, detail="Football client not initialized")
    try:
        teams = await _football_client.get_all_teams()
        return {"teams": [{"id": t["id"], "name": t["name"], "shortName": t.get("shortName",""), "crest": t.get("crest")} for t in teams]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@monitoring_router.get("/metrics")
async def metrics():
    return get_metrics_response()

@monitoring_router.get("/stats")
async def get_stats():
    return tracker.get_stats()
