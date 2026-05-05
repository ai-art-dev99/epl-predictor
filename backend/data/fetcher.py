import httpx
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class FootballDataClient:
    """Client for football-data.org free API (10 req/min, EPL included)"""

    BASE_URL = "https://api.football-data.org/v4"
    EPL_CODE = "PL"

    def __init__(self):
        self.headers = {"X-Auth-Token": settings.football_data_api_key}
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers=self.headers,
                timeout=15.0,
                base_url=self.BASE_URL
            )
        return self._client

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _get(self, endpoint: str, params: Dict = None) -> Dict:
        client = await self._get_client()
        try:
            resp = await client.get(endpoint, params=params or {})
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            logger.error("Football API error", status=e.response.status_code, endpoint=endpoint)
            raise

    async def get_standings(self) -> Dict:
        """Get current EPL standings table"""
        data = await self._get(f"/competitions/{self.EPL_CODE}/standings")
        return data

    async def get_team_matches(self, team_id: int, limit: int = 10) -> Dict:
        """Get last N matches for a team"""
        data = await self._get(
            f"/teams/{team_id}/matches",
            params={"status": "FINISHED", "limit": limit}
        )
        return data

    async def get_head_to_head(self, match_id: int) -> Dict:
        """Get H2H for a specific match"""
        data = await self._get(f"/matches/{match_id}/head2head", params={"limit": 10})
        return data

    async def get_upcoming_matches(self, matchday_offset: int = 0) -> Dict:
        """Get upcoming EPL fixtures"""
        data = await self._get(
            f"/competitions/{self.EPL_CODE}/matches",
            params={"status": "SCHEDULED", "limit": 20}
        )
        return data

    async def get_competition_matches(self, matchday: int = None) -> Dict:
        """Get all matches for a specific matchday"""
        params = {"status": "SCHEDULED"}
        if matchday:
            params["matchday"] = matchday
        return await self._get(f"/competitions/{self.EPL_CODE}/matches", params=params)

    async def search_team(self, team_name: str) -> Optional[Dict]:
        """Find team ID from name by scanning standings"""
        standings = await self.get_standings()
        tables = standings.get("standings", [{}])
        if tables:
            for entry in tables[0].get("table", []):
                team = entry.get("team", {})
                if team_name.lower() in team.get("name", "").lower() or \
                   team_name.lower() in team.get("shortName", "").lower() or \
                   team_name.lower() in team.get("tla", "").lower():
                    return team
        return None

    async def get_all_teams(self) -> List[Dict]:
        """Get all EPL teams"""
        data = await self._get(f"/competitions/{self.EPL_CODE}/teams")
        return data.get("teams", [])

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()


class DataProcessor:
    """Processes raw API data into structured formats for the agent"""

    @staticmethod
    def extract_form_string(matches: List[Dict], team_id: int) -> List[str]:
        """Extract W/D/L results for last N matches"""
        results = []
        for match in reversed(matches[-5:]):
            home = match.get("homeTeam", {}).get("id")
            away = match.get("awayTeam", {}).get("id")
            score = match.get("score", {}).get("fullTime", {})
            home_goals = score.get("home", 0) or 0
            away_goals = score.get("away", 0) or 0

            if team_id == home:
                if home_goals > away_goals:
                    results.append("W")
                elif home_goals == away_goals:
                    results.append("D")
                else:
                    results.append("L")
            elif team_id == away:
                if away_goals > home_goals:
                    results.append("W")
                elif away_goals == home_goals:
                    results.append("D")
                else:
                    results.append("L")
        return results

    @staticmethod
    def calculate_goals(matches: List[Dict], team_id: int) -> tuple[int, int]:
        """Calculate goals scored and conceded in last 5 matches"""
        scored, conceded = 0, 0
        for match in matches[-5:]:
            home = match.get("homeTeam", {}).get("id")
            score = match.get("score", {}).get("fullTime", {})
            home_g = score.get("home", 0) or 0
            away_g = score.get("away", 0) or 0
            if team_id == home:
                scored += home_g
                conceded += away_g
            else:
                scored += away_g
                conceded += home_g
        return scored, conceded

    @staticmethod
    def format_standings_for_agent(standings_data: Dict) -> str:
        """Format standings as a readable string for the agent"""
        lines = ["EPL STANDINGS:\n", "Pos | Team | P | W | D | L | GF | GA | GD | Pts | Form"]
        tables = standings_data.get("standings", [{}])
        if tables:
            for entry in tables[0].get("table", []):
                team = entry.get("team", {})
                line = (
                    f"{entry['position']:3} | {team.get('shortName', team.get('name', '?')):20} | "
                    f"{entry['playedGames']:2} | {entry['won']:2} | {entry['draw']:2} | "
                    f"{entry['lost']:2} | {entry['goalsFor']:3} | {entry['goalsAgainst']:3} | "
                    f"{entry['goalDifference']:+3} | {entry['points']:3} | {entry.get('form', 'N/A')}"
                )
                lines.append(line)
        return "\n".join(lines)

    @staticmethod
    def format_team_matches_for_agent(matches_data: Dict, team_name: str) -> str:
        """Format recent matches as a readable string for the agent"""
        matches = matches_data.get("matches", [])[-10:]
        lines = [f"\nRECENT MATCHES for {team_name}:"]
        for m in matches:
            home = m.get("homeTeam", {}).get("shortName", "?")
            away = m.get("awayTeam", {}).get("shortName", "?")
            score = m.get("score", {}).get("fullTime", {})
            date = m.get("utcDate", "")[:10]
            lines.append(f"  {date}: {home} {score.get('home', '?')}-{score.get('away', '?')} {away}")
        return "\n".join(lines)
