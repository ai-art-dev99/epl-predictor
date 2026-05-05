"""
EPL Predictor Agent — Claude-powered with tool use.
The agent has access to live football data tools and reasons
through form, H2H, standings to produce predictions.
"""
import json
import structlog
from typing import Any, Dict, List
import anthropic

from config import get_settings
from data.fetcher import FootballDataClient, DataProcessor

logger = structlog.get_logger()
settings = get_settings()

# ─── Tool definitions ────────────────────────────────────────────────────────

TOOLS = [
    {
        "name": "get_epl_standings",
        "description": (
            "Get current English Premier League standings table. "
            "Returns all 20 teams with position, wins, draws, losses, goals, points and recent form."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_team_recent_form",
        "description": (
            "Get the last 10 match results for a specific EPL team. "
            "Provides date, opponent, score for each match."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "team_name": {
                    "type": "string",
                    "description": "Full or partial team name (e.g. 'Arsenal', 'Man City', 'Liverpool')",
                }
            },
            "required": ["team_name"],
        },
    },
    {
        "name": "get_head_to_head",
        "description": (
            "Get head-to-head history between two EPL teams. "
            "Returns last 10 meetings with scores, dates, and win/draw/loss counts."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "home_team": {"type": "string", "description": "Home team name"},
                "away_team": {"type": "string", "description": "Away team name"},
            },
            "required": ["home_team", "away_team"],
        },
    },
    {
        "name": "get_upcoming_fixtures",
        "description": "Get the next scheduled EPL matches.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]

# ─── System prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an elite football analyst specializing in the English Premier League.
Your task is to predict match outcomes with detailed reasoning.

When predicting a match:
1. ALWAYS call get_epl_standings first for context
2. ALWAYS call get_team_recent_form for BOTH teams
3. ALWAYS call get_head_to_head for historical perspective
4. Analyze: current form (last 5), home/away advantage, league position, goal scoring/conceding trends, H2H record
5. Provide probabilities that sum to exactly 1.0

Respond ONLY with a valid JSON object in this exact format:
{
  "predicted_outcome": "home_win" | "away_win" | "draw",
  "confidence": <float 0-1>,
  "home_win_probability": <float>,
  "draw_probability": <float>,
  "away_win_probability": <float>,
  "predicted_score": "<home_goals>-<away_goals>",
  "analysis": "<detailed 3-4 paragraph analysis explaining reasoning>",
  "key_factors": ["<factor 1>", "<factor 2>", "<factor 3>", "<factor 4>", "<factor 5>"]
}

Be analytical, specific, and data-driven. Reference actual stats from the tools.
Probabilities must sum to exactly 1.0. Confidence reflects how certain you are about predicted_outcome."""


class EPLPredictorAgent:
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.football_client = FootballDataClient()
        self.processor = DataProcessor()

    # ─── Tool Executor ─────────────────────────────────────────────────────

    async def _execute_tool(self, tool_name: str, tool_input: Dict) -> str:
        logger.info("Executing tool", tool=tool_name, input=tool_input)

        try:
            if tool_name == "get_epl_standings":
                data = await self.football_client.get_standings()
                return self.processor.format_standings_for_agent(data)

            elif tool_name == "get_team_recent_form":
                team_name = tool_input.get("team_name", "")
                team = await self.football_client.search_team(team_name)
                if not team:
                    return f"Team '{team_name}' not found. Please use a valid EPL team name."
                team_id = team["id"]
                matches_data = await self.football_client.get_team_matches(team_id, limit=10)
                return self.processor.format_team_matches_for_agent(matches_data, team.get("name", team_name))

            elif tool_name == "get_head_to_head":
                home_name = tool_input.get("home_team", "")
                away_name = tool_input.get("away_team", "")
                home_team = await self.football_client.search_team(home_name)
                away_team = await self.football_client.search_team(away_name)

                if not home_team or not away_team:
                    return f"Could not find teams: {home_name} vs {away_name}"

                # Get recent matches for home team and filter for H2H
                home_matches = await self.football_client.get_team_matches(home_team["id"], limit=50)
                away_id = away_team["id"]

                h2h_matches = [
                    m for m in home_matches.get("matches", [])
                    if m.get("awayTeam", {}).get("id") == away_id
                    or m.get("homeTeam", {}).get("id") == away_id
                ]

                if not h2h_matches:
                    return f"No recent H2H data found for {home_name} vs {away_name}"

                lines = [f"HEAD TO HEAD: {home_name} vs {away_name} (last {len(h2h_matches[:10])} meetings)"]
                home_wins, away_wins, draws = 0, 0, 0

                for m in h2h_matches[:10]:
                    home = m.get("homeTeam", {})
                    away = m.get("awayTeam", {})
                    score = m.get("score", {}).get("fullTime", {})
                    date = m.get("utcDate", "")[:10]
                    hg = score.get("home", 0) or 0
                    ag = score.get("away", 0) or 0

                    if hg > ag:
                        home_wins += 1
                    elif ag > hg:
                        away_wins += 1
                    else:
                        draws += 1

                    lines.append(
                        f"  {date}: {home.get('shortName','?')} {hg}-{ag} {away.get('shortName','?')}"
                    )

                lines.append(f"\nSummary: {home_name} wins: {home_wins}, Draws: {draws}, {away_name} wins: {away_wins}")
                return "\n".join(lines)

            elif tool_name == "get_upcoming_fixtures":
                data = await self.football_client.get_upcoming_matches()
                matches = data.get("matches", [])[:10]
                lines = ["UPCOMING EPL FIXTURES:"]
                for m in matches:
                    home = m.get("homeTeam", {}).get("shortName", "?")
                    away = m.get("awayTeam", {}).get("shortName", "?")
                    date = m.get("utcDate", "")[:10]
                    lines.append(f"  {date}: {home} vs {away}")
                return "\n".join(lines) if len(lines) > 1 else "No upcoming fixtures found."

        except Exception as e:
            logger.error("Tool execution failed", tool=tool_name, error=str(e))
            return f"Error fetching data for {tool_name}: {str(e)}"

        return "Tool not found"

    # ─── Agentic Loop ──────────────────────────────────────────────────────

    async def predict(self, home_team: str, away_team: str, match_date: str = None) -> Dict[str, Any]:
        """Run the full agentic prediction loop"""

        date_context = f" on {match_date}" if match_date else ""
        user_message = (
            f"Predict the outcome of: {home_team} (home) vs {away_team} (away){date_context}. "
            f"Use all available tools to gather comprehensive data before making your prediction."
        )

        messages = [{"role": "user", "content": user_message}]

        logger.info("Starting prediction", home=home_team, away=away_team)

        # ── Agentic loop (max 10 tool calls) ──
        for iteration in range(10):
            response = await self.client.messages.create(
                model=settings.claude_model,
                max_tokens=settings.max_tokens,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=messages,
            )

            logger.info("Agent response", stop_reason=response.stop_reason, iteration=iteration)

            # ── If agent is done, extract JSON ──
            if response.stop_reason == "end_turn":
                full_text = " ".join(
                    block.text for block in response.content if hasattr(block, "text")
                )
                try:
                    # Extract JSON from response
                    start = full_text.find("{")
                    end = full_text.rfind("}") + 1
                    if start >= 0 and end > start:
                        return json.loads(full_text[start:end])
                except json.JSONDecodeError as e:
                    logger.error("JSON parse error", error=str(e), text=full_text[:500])
                    raise ValueError(f"Agent returned invalid JSON: {full_text[:200]}")

            # ── Handle tool use ──
            if response.stop_reason == "tool_use":
                # Add assistant message with tool calls
                messages.append({"role": "assistant", "content": response.content})

                # Execute all tool calls and collect results
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = await self._execute_tool(block.name, block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        })

                messages.append({"role": "user", "content": tool_results})
            else:
                break

        raise ValueError("Agent did not produce a prediction after maximum iterations")

    async def close(self):
        await self.football_client.close()
