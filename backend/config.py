from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "EPL Predictor"
    debug: bool = False
    environment: str = "production"

    # API Keys
    anthropic_api_key: str
    football_data_api_key: str  # football-data.org free key

    # Redis (optional caching)
    redis_url: str = "redis://redis:6379"
    cache_ttl: int = 300  # 5 min cache for live data

    # Football Data API
    football_data_base_url: str = "https://api.football-data.org/v4"
    epl_competition_id: str = "PL"  # Premier League code

    # Claude Model
    claude_model: str = "claude-sonnet-4-6"
    max_tokens: int = 2048

    # Monitoring
    enable_metrics: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
