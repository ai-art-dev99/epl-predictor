from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response
from datetime import datetime
import time

# ─── Metrics ─────────────────────────────────────────────────────────────────

prediction_counter = Counter(
    "epl_predictions_total",
    "Total number of match predictions",
    ["outcome", "home_team", "away_team"],
)

prediction_latency = Histogram(
    "epl_prediction_duration_seconds",
    "Time taken to generate a prediction",
    buckets=[1, 2, 5, 10, 20, 30, 60],
)

prediction_confidence = Histogram(
    "epl_prediction_confidence",
    "Confidence distribution of predictions",
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
)

api_errors_counter = Counter(
    "epl_api_errors_total",
    "Total API errors",
    ["endpoint", "error_type"],
)

football_api_calls = Counter(
    "football_api_calls_total",
    "Total calls to football-data.org",
    ["endpoint"],
)

active_requests = Gauge(
    "epl_active_requests",
    "Number of currently active requests",
)

cache_hits = Counter(
    "epl_cache_hits_total",
    "Total cache hits",
    ["cache_key_prefix"],
)

# ─── Tracker class ────────────────────────────────────────────────────────────

class PredictionTracker:
    """Tracks prediction performance over time"""

    def __init__(self):
        self._predictions: list = []

    def record_prediction(
        self,
        home_team: str,
        away_team: str,
        outcome: str,
        confidence: float,
        duration: float,
    ):
        prediction_counter.labels(
            outcome=outcome,
            home_team=home_team,
            away_team=away_team,
        ).inc()
        prediction_confidence.observe(confidence)

        self._predictions.append({
            "home": home_team,
            "away": away_team,
            "outcome": outcome,
            "confidence": confidence,
            "duration": duration,
            "timestamp": datetime.utcnow().isoformat(),
        })
        # Keep last 500 in memory
        if len(self._predictions) > 500:
            self._predictions = self._predictions[-500:]

    def get_stats(self) -> dict:
        if not self._predictions:
            return {"total": 0}
        avg_confidence = sum(p["confidence"] for p in self._predictions) / len(self._predictions)
        avg_duration = sum(p["duration"] for p in self._predictions) / len(self._predictions)
        outcomes = {}
        for p in self._predictions:
            outcomes[p["outcome"]] = outcomes.get(p["outcome"], 0) + 1
        return {
            "total": len(self._predictions),
            "avg_confidence": round(avg_confidence, 3),
            "avg_duration_seconds": round(avg_duration, 2),
            "outcome_distribution": outcomes,
            "recent": self._predictions[-10:],
        }


tracker = PredictionTracker()


# ─── Middleware ───────────────────────────────────────────────────────────────

async def metrics_middleware(request: Request, call_next):
    active_requests.inc()
    start = time.time()
    try:
        response = await call_next(request)
        return response
    finally:
        active_requests.dec()


def get_metrics_response() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
