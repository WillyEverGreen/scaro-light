"""
Edgecase Backend Configuration

Pydantic settings for environment-based configuration.
"""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # Application
    app_name: str = "Edgecase"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # Render / Environment Vars
    database_url: Optional[str] = None
    redis_url: Optional[str] = None
    qdrant_api_key: Optional[str] = None
    secret_key: Optional[str] = None
    environment: str = "development"
    feed_poll_interval: int = 5
    
    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "edgecase"
    postgres_user: str = "edgecase"
    postgres_password: str = "edgecase_secret"
    
    @property
    def postgres_url(self) -> str:
        if self.database_url:
            url = self.database_url
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            
            # asyncpg doesn't accept sslmode, translate it to ssl
            url = url.replace("?sslmode=require", "?ssl=require")
            url = url.replace("&sslmode=require", "&ssl=require")
            url = url.replace("sslmode=require", "ssl=require")
            
            # asyncpg doesn't accept channel_binding
            url = url.replace("&channel_binding=require", "")
            url = url.replace("?channel_binding=require&", "?")
            url = url.replace("?channel_binding=require", "")
            
            return url
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    @property
    def postgres_url_sync(self) -> str:
        if self.database_url:
            return self.database_url
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "edgecase_secret"
    
    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    
    @property
    def qdrant_url(self) -> str:
        # If QDRANT_HOST contains http or https, assume it's a full URL (like from cloud)
        if self.qdrant_host.startswith("http"):
            return self.qdrant_host
        return f"http://{self.qdrant_host}:{self.qdrant_port}"
    
    # NVIDIA API
    nvidia_api_key: Optional[str] = None
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "meta/llama-4-maverick-17b-128e-instruct"
    nvidia_embedding_model: str = "nvidia/nv-embedqa-e5-v5"
    
    # Weather API (Open-Meteo - free)
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    
    # Scraping Configuration
    scraping_threads: int = 4
    scraping_delay_min: float = 1.0
    scraping_delay_max: float = 3.0
    scraping_timeout: int = 30
    
    # Proxy (optional)
    proxy_list_url: Optional[str] = None
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
