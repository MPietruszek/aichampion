from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
)
from functools import lru_cache
from config import settings
from services.document_processor import Chunk

VECTOR_SIZE = 1024  # multilingual-e5-large

@lru_cache(maxsize=1)
def get_client() -> QdrantClient:
    return QdrantClient(url=settings.qdrant_url)

def create_collection(collection_name: str) -> None:
    client = get_client()
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
    )

def index_chunks(collection_name: str, chunks: list[Chunk], vectors: list[list[float]]) -> None:
    client = get_client()
    points = [
        PointStruct(
            id=i,
            vector=vector,
            payload={
                'text': chunk.text,
                'paragraph': chunk.paragraph,
                'title': chunk.title,
                'page': chunk.page,
            },
        )
        for i, (chunk, vector) in enumerate(zip(chunks, vectors))
    ]
    client.upsert(collection_name=collection_name, points=points)

def search(collection_name: str, query_vector: list[float], top_k: int, score_threshold: float):
    client = get_client()
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        limit=top_k,
        score_threshold=score_threshold,
    )
    if not results and score_threshold > 0.4:
        results = client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=top_k * 2,
            score_threshold=0.4,
        )
    return results

def delete_collection(collection_name: str) -> None:
    get_client().delete_collection(collection_name)
