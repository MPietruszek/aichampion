from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # Tryb działania: sandbox = bez modelu / prod = prawdziwy PLLuM
    app_env: Literal['sandbox', 'prod'] = 'sandbox'

    database_url: str = 'postgresql+asyncpg://czat_admin:password@localhost/czat_umowy'
    vllm_url: str = 'http://localhost:8001'
    qdrant_url: str = 'http://localhost:6333'
    secret_key: str = 'dev-secret-key'
    documents_path: str = './data/documents'
    embedding_model: str = 'intfloat/multilingual-e5-large'
    llm_model: str = 'CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512'
    max_file_size_mb: int = 50
    rag_top_k: int = 5
    rag_score_threshold: float = 0.6

    @property
    def is_prod(self) -> bool:
        return self.app_env == 'prod'

    class Config:
        env_file = '.env'

settings = Settings()
