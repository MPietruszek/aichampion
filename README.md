# Czat Umowy

Wewnętrzne narzędzie do analizy umów i dokumentów prawnych z użyciem polskiego modelu językowego **PLLuM 70B**. Działa w pełni lokalnie — dane nie opuszczają firmy.

## Jak to działa

Wgrywasz PDF lub DOCX → system indeksuje dokument → zadajesz pytania w języku naturalnym → model odpowiada wskazując konkretne paragrafy i klauzule.

```
PDF/DOCX → [RAG Pipeline] → PLLuM 70B → odpowiedź + §źródło
```

## Demo

Bez GPU, bez konfiguracji — tryb sandbox uruchamia się z mockowymi danymi:

```bash
make sandbox
# → http://localhost:3000
# aichampion / krzysiek12
# admin       / krzysiek12
```

---

## Stack

| Warstwa | Technologia |
|---|---|
| Model | `CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512` @ Q8 |
| Inference | vLLM (tensor-parallel, 2× GPU) |
| RAG | Qdrant + multilingual-e5-large |
| Backend | FastAPI + SQLAlchemy async + PostgreSQL |
| Frontend | React 18 + TypeScript + Ant Design 5 + Zustand |
| Auth | JWT + bcrypt |

---

## Szybki start

### Sandbox (bez GPU, dane mock)

```bash
git clone git@github.com:MPietruszek/aichampion.git
cd aichampion
make sandbox
```

Aplikacja dostępna pod `http://localhost:3000`.

### Produkcja (2× A100 40GB)

```bash
# 1. Uzupełnij .env.prod — wstaw HF_TOKEN i zmień hasła
nano .env.prod

# 2. Pobierz model (~70 GB, jednorazowo)
export HF_TOKEN=hf_...
make download-model

# 3. Uruchom
make prod
```

### Wszystkie komendy

```
make sandbox          Uruchom w trybie demo (mock, bez GPU)
make prod             Uruchom z modelem PLLuM na GPU
make down             Zatrzymaj wszystkie serwisy
make download-model   Pobierz model PLLuM 70B (~70 GB)
make logs             Logi na żywo
make migrate          Migracje bazy danych
make ps               Status kontenerów
```

---

## Tryby działania

| | Sandbox | Prod |
|---|---|---|
| `APP_ENV` | `sandbox` | `prod` |
| `VITE_DEMO_MODE` | `true` | `false` |
| vLLM | nie startuje | startuje z PLLuM |
| GPU | nie potrzebne | 2× A100 40GB |
| Dane | wbudowany mock | prawdziwy backend |

Przełączanie: `make sandbox` / `make prod` — kopiują odpowiedni plik `.env.*` i restartują Docker Compose.

---

## Architektura

```
[Użytkownik]
     │
     ▼
[React Frontend]  ←── VITE_DEMO_MODE=false → prawdziwy backend
     │                 VITE_DEMO_MODE=true  → dane mock (bez backendu)
     ▼
[FastAPI Backend]
     ├── [Document Processor]
     │    ├── PyMuPDF (PDF)
     │    ├── python-docx (DOCX)
     │    └── Tesseract OCR (skany)
     │
     ├── [RAG Pipeline]
     │    ├── Chunking po paragrafach (§1, §2, pkt 1...)
     │    ├── Embeddingi: multilingual-e5-large (1024-dim)
     │    └── Qdrant — similarity search z filtrem po conversation_id
     │
     └── [vLLM — tylko APP_ENV=prod]
          └── PLLuM-70B-instruct @ Q8
               └── tensor-parallel-size 2 (2× A100 40GB)
```

### Funkcje slash (komendy prawne)

W oknie czatu wpisz `/` aby zobaczyć dostępne analizy:

| Komenda | Opis |
|---|---|
| `/dpa-review` | Przegląd umowy powierzenia danych (RODO art. 28) |
| `/ip-clause-review` | Analiza klauzul IP i cesji praw autorskich |
| `/is-this-a-problem` | Szybka ocena ryzyka wybranego postanowienia |
| `/hiring-review` | Przegląd NDA i klauzul zakazu konkurencji |
| `/reg-gap-analysis` | Analiza luk regulacyjnych (RODO, PKE, UŚUDE) |

---

## Wymagania sprzętowe (prod)

| Komponent | Minimum |
|---|---|
| GPU | 2× NVIDIA A100 40GB (80 GB VRAM łącznie) |
| RAM | 128 GB |
| CPU | 16 rdzeni |
| Dysk | 500 GB SSD |
| OS | Ubuntu 22.04 LTS |
| CUDA | 12.1+ |
| Docker | 24+ z `nvidia-container-toolkit` |

---

## Dokumentacja

Szczegółowa dokumentacja projektowa znajduje się w katalogu [`docs/`](docs/):

| Plik | Zawartość |
|---|---|
| [01-decyzje.md](docs/01-decyzje.md) | Wybór modelu, precyzji Q8, sprzętu |
| [02-architektura.md](docs/02-architektura.md) | Diagram systemu, RAG pipeline, prompt systemowy |
| [03-etapy.md](docs/03-etapy.md) | 5 etapów realizacji z checklistami (~5–7 tygodni) |
| [04-stack.md](docs/04-stack.md) | Pełny stack z uzasadnieniem wyboru |
| [05-interfejs.md](docs/05-interfejs.md) | Wireframe UI, flow uploadu, model UX |
| [06-baza-danych.md](docs/06-baza-danych.md) | Schemat PostgreSQL (users, conversations, messages, audit_log) |
| [07-deployment.md](docs/07-deployment.md) | Docker Compose, zmienne env, uruchomienie na serwerze |
| [08-bezpieczenstwo.md](docs/08-bezpieczenstwo.md) | Auth JWT, RBAC, szyfrowanie, nginx, checklist prod |
| [09-rag-pipeline.md](docs/09-rag-pipeline.md) | Pełny przepływ: upload → chunking → embeddingi → odpowiedź |

---

## Struktura repozytorium

```
czat-umowy/
├── backend/                # FastAPI + SQLAlchemy
│   ├── routers/            # auth, conversations, messages
│   ├── services/           # rag, vllm, embeddings, commands
│   ├── models/             # modele SQLAlchemy
│   └── alembic/            # migracje bazy
├── frontend/               # React + TypeScript
│   └── src/
│       ├── api/            # klient HTTP + mock
│       ├── components/     # Sidebar, ChatArea, CommandPicker
│       ├── store/          # Zustand (auth, chat)
│       └── pages/          # LoginPage
├── docs/                   # dokumentacja projektowa
├── docker-compose.yml      # vllm (profile: prod), qdrant, postgres, backend, frontend
├── Makefile                # make sandbox | prod | download-model | ...
├── .env.sandbox            # szablon: tryb demo
├── .env.prod               # szablon: tryb produkcyjny
└── .env.example            # opis wszystkich zmiennych
```

---

## Bezpieczeństwo

- Dane nie opuszczają infrastruktury firmy (model hostowany lokalnie)
- Każdy użytkownik widzi tylko swoje rozmowy (filtrowanie po `user_id` z JWT)
- vLLM i Qdrant dostępne wyłącznie w wewnętrznej sieci Docker
- Audit log wszystkich operacji w bazie danych
- Szczegóły: [08-bezpieczenstwo.md](docs/08-bezpieczenstwo.md)
