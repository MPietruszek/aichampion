# Architektura systemu

## Diagram

```
[Użytkownik]
     │
     ▼
[Frontend — Next.js + shadcn/ui]
     │  upload PDF/DOCX + czat
     ▼
[Backend API — FastAPI/Python]
     ├── [Moduł ingestion]
     │    ├── PyMuPDF (PDF)
     │    ├── python-docx (DOCX)
     │    └── OCR fallback (Tesseract) dla skanów
     │
     ├── [RAG Pipeline]
     │    ├── Chunking (po paragrafach/punktach umowy)
     │    ├── Embeddingi: multilingual-e5-large
     │    ├── Vector DB: Qdrant (self-hosted)
     │    └── Reranker: bge-reranker-v2-m3 (opcjonalnie)
     │
     └── [PLLuM Inference — vLLM]
          └── Llama-PLLuM-70B-instruct-2512 @ Q8
               └── tensor-parallel-size 2 (2× A100)
```

## Kluczowe decyzje architektoniczne

### Chunking prawny (nie sliding window)
Umowy mają strukturę (§1, §2, pkt 1, pkt 2). Chunki po paragrafach/punktach zachowują semantykę lepiej niż okno przesuwne o stałej długości.

### RAG zamiast stuffing
Pełna umowa może przekroczyć okno kontekstu. RAG retrieves top-k najbardziej relewantnych fragmentów do każdego pytania.

### Qdrant zamiast Chroma
Produkcyjnie bardziej stabilny, lepsze wsparcie dla filtrowania metadanych (np. "szukaj tylko w tej umowie").

### vLLM zamiast transformers
- Batching wielu zapytań jednocześnie
- PagedAttention — znacznie efektywniejsze zarządzanie VRAM
- OpenAI-compatible API endpoint

## Prompt systemowy

```
Jesteś ekspertem od analizy umów i dokumentów prawnych.
Odpowiadaj wyłącznie na podstawie dostarczonych fragmentów dokumentu.
Jeśli fragmenty nie zawierają odpowiedzi, powiedz wprost:
"Nie znalazłem tej informacji w dokumencie."
Wskazuj numery paragrafów/klauzul, z których pochodzi odpowiedź.
```
