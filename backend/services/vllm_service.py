import httpx
import json
from config import settings

SYSTEM_PROMPT = """Jesteś ekspertem od analizy umów i dokumentów prawnych.
Odpowiadaj wyłącznie na podstawie dostarczonych fragmentów dokumentu.
Jeśli fragmenty nie zawierają odpowiedzi, odpowiedz dokładnie:
"Nie znalazłem tej informacji w dokumencie."
Zawsze wskazuj numer paragrafu lub punktu, z którego pochodzi odpowiedź."""

async def stream_answer(question: str, context_chunks: list[dict], system_prompt_override: str | None = None):
    context = '\n\n'.join(
        f"[{c['paragraph']}{'  ' + c['title'] if c['title'] else ''}]\n{c['text']}"
        for c in context_chunks
    )

    active_system_prompt = system_prompt_override or SYSTEM_PROMPT
    # Komendy potrzebują więcej tokenów na pełny raport prawny
    max_tokens = 4096 if system_prompt_override else 1024

    messages = [
        {'role': 'system', 'content': active_system_prompt},
        {
            'role': 'user',
            'content': f'Fragmenty dokumentu:\n\n{context}\n\nPytanie: {question}',
        },
    ]

    payload = {
        'model': settings.llm_model,
        'messages': messages,
        'temperature': 0.1,
        'max_tokens': max_tokens,
        'stream': True,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            'POST',
            f'{settings.vllm_url}/v1/chat/completions',
            json=payload,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith('data: '):
                    continue
                data = line[6:]
                if data == '[DONE]':
                    break
                try:
                    chunk = json.loads(data)
                    delta = chunk['choices'][0]['delta'].get('content', '')
                    if delta:
                        yield delta
                except (json.JSONDecodeError, KeyError):
                    continue
