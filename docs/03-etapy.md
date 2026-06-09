# Etapy realizacji

## Etap 1 — Infrastruktura i model (1–2 tygodnie)

- [ ] Uruchomienie vLLM z modelem PLLuM-70B Q8
- [ ] Weryfikacja latencji i memory footprint na A100
- [ ] Konteneryzacja: Docker + docker-compose (model, API, Qdrant)

```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512 \
  --dtype bfloat16 \
  --quantization bitsandbytes \
  --load-in-8bit \
  --tensor-parallel-size 2
```

## Etap 2 — Pipeline RAG (1–2 tygodnie)

- [ ] Parser dokumentów: PyMuPDF (PDF) + python-docx (DOCX)
- [ ] OCR fallback dla zeskanowanych umów (Tesseract lub EasyOCR)
- [ ] Chunking po paragrafach — NIE sliding window
- [ ] Embeddingi: `intfloat/multilingual-e5-large`
- [ ] Indeksowanie w Qdrant z metadanymi (nazwa pliku, numer paragrafu)
- [ ] Retrieval: top-5 fragmentów + opcjonalny reranker

## Etap 3 — Backend API (1 tydzień)

- [ ] FastAPI z endpointami:
  - `POST /conversations` — upload pliku → tworzy nową rozmowę + indeksuje dokument
  - `GET /conversations` — lista rozmów użytkownika (sidebar)
  - `DELETE /conversations/{id}` — usuń rozmowę i dokument
  - `PATCH /conversations/{id}` — rename rozmowy
  - `POST /conversations/{id}/messages` — wyślij wiadomość (stream SSE)
  - `GET /conversations/{id}/messages` — historia wiadomości
- [ ] Walidacja typów plików (PDF, DOCX) i rozmiaru
- [ ] Logowanie zapytań (audytowalność)

## Etap 4 — Frontend (1 tydzień)

- [ ] Next.js + shadcn/ui
- [ ] Layout: sidebar z listą rozmów + obszar czatu (jak ChatGPT/Claude)
- [ ] Sidebar: pogrupowane rozmowy (Dziś / Wcześniej), rename, usuń
- [ ] Nowa rozmowa: modal z upload PDF/DOCX → spinner → otwiera czat
- [ ] Streaming odpowiedzi (SSE)
- [ ] Cytowanie źródła pod każdą odpowiedzią (§ i numer punktu)
- [ ] Szczegóły: [05-interfejs.md](05-interfejs.md)

## Etap 5 — Bezpieczeństwo i wdrożenie (1 tydzień)

- [ ] Autentykacja: SSO firmowy (Keycloak / Azure AD / LDAP)
- [ ] Szyfrowanie dokumentów w spoczynku (AES-256)
- [ ] RBAC: kto może uploadować, kto tylko czytać
- [ ] Deployment on-premise (dane nie opuszczają firmy)
- [ ] Monitoring: Prometheus + Grafana (latencja, użycie VRAM)

## Łączny czas

~5–7 tygodni dla jednego fullstack developera + devops
