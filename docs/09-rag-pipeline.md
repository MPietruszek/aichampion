# RAG Pipeline — przepływ danych

## Faza 1: Indeksowanie (upload dokumentu)

```
PDF/DOCX
   │
   ▼
[Parser]
   ├── PyMuPDF (PDF) → tekst + struktura strony
   ├── python-docx (DOCX) → tekst + nagłówki
   └── Tesseract OCR (skany) → tekst z obrazu
   │
   ▼
[Ekstrakcja struktury]
   ├── Wykryj paragrafy/punkty (regex: §1, §2, pkt 1., a), b))
   ├── Przypisz metadane: {paragraph: "§8", subpoint: "pkt 3", page: 4}
   └── Fallback: podział co 500 tokenów z 50-tokenowym overlappem
   │
   ▼
[Chunki]
   Przykład:
   {
     text: "Kara umowna za zerwanie umowy przed terminem wynosi 20%...",
     metadata: {
       conversation_id: "uuid",
       paragraph: "§8",
       subpoint: "pkt 3",
       title: "Kary umowne",
       page: 4
     }
   }
   │
   ▼
[Embeddingi — multilingual-e5-large]
   │  każdy chunk → wektor 1024-wymiarowy
   ▼
[Qdrant]
   └── kolekcja: {conversation_id}
       └── punkty: {vector, payload: metadata}
```

## Faza 2: Odpowiadanie na pytanie

```
Pytanie użytkownika: "Jakie są kary za zerwanie umowy?"
   │
   ▼
[Embedding pytania — ten sam model: multilingual-e5-large]
   │  pytanie → wektor 1024-wymiarowy
   ▼
[Qdrant — similarity search]
   ├── filter: conversation_id = "uuid" (tylko ten dokument!)
   ├── top_k: 5 najbardziej podobnych chunków
   └── score_threshold: 0.6 (odrzuć słabo dopasowane)
   │
   ▼
[Reranker — bge-reranker-v2-m3] (opcjonalny)
   └── przetasowuje top-5 według rzeczywistej trafności
   │
   ▼
[Budowanie promptu]
   │
   ├── SYSTEM: "Jesteś ekspertem od analizy umów..."
   ├── CONTEXT: [chunk1] [chunk2] [chunk3] (fragmenty z Qdrant)
   └── USER: "Jakie są kary za zerwanie umowy?"
   │
   ▼
[vLLM — Llama-PLLuM-70B-instruct-2512 @ Q8]
   │  generuje odpowiedź strumieniowo (SSE)
   ▼
[Odpowiedź + źródła]
   {
     content: "Zgodnie z §8 pkt 3, kara umowna wynosi 20%...",
     sources: [
       {paragraph: "§8 pkt 3", title: "Kary umowne", score: 0.94},
       {paragraph: "§9 pkt 1", title: "Rozwiązanie umowy", score: 0.71}
     ]
   }
```

## Prompt template

```python
SYSTEM = """Jesteś ekspertem od analizy umów i dokumentów prawnych.
Odpowiadaj wyłącznie na podstawie dostarczonych fragmentów dokumentu.
Jeśli fragmenty nie zawierają odpowiedzi, odpowiedz:
"Nie znalazłem tej informacji w dokumencie."
Zawsze wskazuj numer paragrafu/punktu, z którego pochodzi odpowiedź."""

def build_prompt(question: str, chunks: list[Chunk]) -> list[dict]:
    context = "\n\n".join([
        f"[{c.metadata['paragraph']} {c.metadata.get('subpoint', '')}]\n{c.text}"
        for c in chunks
    ])
    return [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": f"Fragmenty dokumentu:\n{context}\n\nPytanie: {question}"}
    ]
```

## Parametry generowania

```python
{
    "temperature": 0.1,    # niska losowość — odpowiedzi faktyczne, nie kreatywne
    "max_tokens": 1024,
    "stream": True,        # streaming SSE do frontendu
    "stop": ["<|eot_id|>"] # token końca dla Llama
}
```

## Obsługa edge cases

| Sytuacja | Zachowanie |
|---|---|
| Plik zaszyfrowany (PDF z hasłem) | Błąd przy uploadzie: "Plik jest chroniony hasłem" |
| Skan bez OCR | Próba Tesseract, jeśli <50 słów → błąd: "Nie udało się odczytać tekstu" |
| Pytanie spoza dokumentu | Model odpowiada: "Nie znalazłem tej informacji w dokumencie" |
| Brak chunków powyżej progu | Rozszerz top_k do 10, obniż score_threshold do 0.4 |
| Dokument >500 stron | Chunking asynchroniczny, status "Indeksuję..." w UI |
