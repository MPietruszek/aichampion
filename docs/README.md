# Czat do analizy umów — dokumentacja projektu

Wewnętrzne narzędzie firmy do analizy umów, dokumentów prawnych i regulaminów z użyciem polskiego modelu językowego PLLuM.

## Pliki

| Plik | Zawartość |
|---|---|
| [01-decyzje.md](01-decyzje.md) | Kluczowe decyzje: model, precyzja, sprzęt |
| [02-architektura.md](02-architektura.md) | Diagram systemu, RAG pipeline, prompt systemowy |
| [03-etapy.md](03-etapy.md) | 5 etapów realizacji z checklistami |
| [04-stack.md](04-stack.md) | Pełny stack technologiczny z uzasadnieniem |
| [05-interfejs.md](05-interfejs.md) | Wireframe UI, flow uploadu, model UX (rozmowy o plikach) |
| [06-baza-danych.md](06-baza-danych.md) | Schemat PostgreSQL: users, conversations, messages, audit_log |
| [07-deployment.md](07-deployment.md) | docker-compose, zmienne środowiskowe, uruchomienie na serwerze |
| [08-bezpieczenstwo.md](08-bezpieczenstwo.md) | Auth (SSO/JWT), RBAC, szyfrowanie, nginx, checklist prod |
| [09-rag-pipeline.md](09-rag-pipeline.md) | Pełny przepływ: upload → chunking → embeddingi → odpowiedź |

## TL;DR decyzji

- **Model:** `CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512`
- **Precyzja:** Q8 (jakość jak BF16, połowa VRAM)
- **Sprzęt:** 2× A100 40GB
- **Podejście:** RAG — dokumenty indeksowane w Qdrant, model odpowiada na podstawie pobranych fragmentów
- **Czas realizacji:** ~5–7 tygodni
