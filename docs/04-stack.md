# Stack technologiczny

| Warstwa | Technologia | Uzasadnienie |
|---|---|---|
| Model inference | vLLM | Batching, PagedAttention, OpenAI-compatible API |
| Model | Llama-PLLuM-70B-instruct-2512 @ Q8 | Najlepszy PL model dla prawa, RAG-trained |
| Sprzęt | 2× A100 40GB | Wystarczające dla Q8 70B, ~2× tańsze niż H100 |
| Embeddingi | multilingual-e5-large | Dobra jakość dla PL, open-source |
| Vector DB | Qdrant | Stabilny produkcyjnie, filtrowanie metadanych |
| Reranker | bge-reranker-v2-m3 | Opcjonalny, poprawia precyzję retrieval |
| Parser PDF | PyMuPDF | Szybki, dobra obsługa układu strony |
| Parser DOCX | python-docx | Standard |
| OCR | Tesseract / EasyOCR | Dla zeskanowanych dokumentów |
| Backend | FastAPI + Python | Async, streaming SSE, type safety |
| Frontend | Next.js + shadcn/ui | SSR, gotowe komponenty, łatwy deployment |
| Autentykacja | Keycloak / Azure AD | SSO firmowy, RBAC |
| Monitoring | Prometheus + Grafana | Latencja, VRAM, błędy |
| Konteneryzacja | Docker + docker-compose | Łatwy deployment, izolacja |
| Baza danych | PostgreSQL | Historia czatów, metadane dokumentów |

## Porty serwisów (docker-compose)

| Serwis | Port |
|---|---|
| Frontend | 3000 |
| Backend API | 8000 |
| vLLM (model) | 8001 |
| Qdrant | 6333 |
| PostgreSQL | 5432 |
| Keycloak | 8080 |
| Grafana | 3001 |
