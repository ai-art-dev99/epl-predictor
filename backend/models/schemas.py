from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PredictionOutcome(str, Enum):
    HOME_WIN = "home_win"
    AWAY_WIN = "away_win"
    DRAW = "draw"


class TeamForm(BaseModel):
    team_name: str
    team_id: int
    crest_url: Optional[str] = None
    last_5_results: List[str] = []        # ["W", "D", "L", "W", "W"]
    goals_scored_last5: int = 0
    goals_conceded_last5: int = 0
    position: int = 0
    points: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0
    goal_difference: int = 0


class HeadToHead(BaseModel):
    home_wins: int = 0
    away_wins: int = 0
    draws: int = 0
    last_meetings: List[dict] = []


class PredictionRequest(BaseModel):
    home_team: str = Field(..., description="Name of the home team")
    away_team: str = Field(..., description="Name of the away team")
    match_date: Optional[str] = Field(None, description="Optional match date (YYYY-MM-DD)")


class PredictionResult(BaseModel):
    home_team: str
    away_team: str
    predicted_outcome: PredictionOutcome
    confidence: float = Field(..., ge=0, le=1)
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    predicted_score: str                    # e.g., "2-1"
    analysis: str                           # Agent's detailed analysis
    key_factors: List[str] = []
    home_form: Optional[TeamForm] = None
    away_form: Optional[TeamForm] = None
    head_to_head: Optional[HeadToHead] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class StandingsEntry(BaseModel):
    position: int
    team_name: str
    team_id: int
    crest_url: Optional[str] = None
    played: int
    won: int
    draw: int
    lost: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    form: Optional[str] = None              # last 5: "WWDLW"


class StandingsResponse(BaseModel):
    season: str
    matchday: int
    standings: List[StandingsEntry]
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UpcomingMatch(BaseModel):
    match_id: int
    home_team: str
    away_team: str
    home_team_id: int
    away_team_id: int
    home_crest: Optional[str] = None
    away_crest: Optional[str] = None
    match_date: str
    matchday: int
    status: str


class UpcomingMatchesResponse(BaseModel):
    matches: List[UpcomingMatch]


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    football_api: str
    claude_api: str
