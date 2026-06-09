from services.embeddings import embed_query
from services.qdrant_service import search
from services.vllm_service import stream_answer
from services.commands import get_command
from schemas.schemas import Source
from config import settings


async def rag_stream(collection_name: str, question: str, command: str | None = None):
    # Pobierz system prompt — z komendy lub domyślny
    cmd = get_command(command) if command else None
    system_prompt_override = cmd.system_prompt if cmd else None

    # Dla komend pobierz więcej chunków (pełny dokument ważniejszy niż konkretne fragmenty)
    top_k = settings.rag_top_k * 3 if command else settings.rag_top_k
    score_threshold = 0.3 if command else settings.rag_score_threshold

    query_vector = embed_query(question)
    results = search(
        collection_name=collection_name,
        query_vector=query_vector,
        top_k=top_k,
        score_threshold=score_threshold,
    )

    sources = [
        Source(
            paragraph=r.payload['paragraph'],
            title=r.payload.get('title'),
            text=r.payload['text'][:200],
            score=round(r.score, 3),
        )
        for r in results
    ]

    context_chunks = [r.payload for r in results]

    # Dla komend: pytanie to instrukcja analizy całego dokumentu
    effective_question = question if not command else f"Przeprowadź analizę zgodnie z instrukcjami systemowymi. Dokument do analizy poniżej.\n\nDodatkowy kontekst od użytkownika: {question}" if question else "Przeprowadź pełną analizę dokumentu zgodnie z instrukcjami systemowymi."

    yield {'type': 'sources', 'sources': [s.model_dump() for s in sources]}

    full_answer = ''
    async for token in stream_answer(effective_question, context_chunks, system_prompt_override=system_prompt_override):
        full_answer += token
        yield {'type': 'token', 'content': token}

    yield {'type': 'done', 'full_answer': full_answer}
