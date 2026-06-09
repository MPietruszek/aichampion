from functools import lru_cache
from sentence_transformers import SentenceTransformer
from config import settings

@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    return SentenceTransformer(settings.embedding_model)

def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_model()
    # multilingual-e5-large wymaga prefixu "passage:" dla dokumentów i "query:" dla zapytań
    prefixed = [f'passage: {t}' for t in texts]
    return model.encode(prefixed, normalize_embeddings=True).tolist()

def embed_query(query: str) -> list[float]:
    model = get_model()
    return model.encode(f'query: {query}', normalize_embeddings=True).tolist()
