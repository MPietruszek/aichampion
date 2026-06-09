# Deployment

## Struktura docker-compose

```yaml
# docker-compose.yml
services:

  vllm:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - HUGGING_FACE_HUB_TOKEN=${HF_TOKEN}
    command: >
      --model CYFRAGOVPL/Llama-PLLuM-70B-instruct-2512
      --dtype bfloat16
      --quantization bitsandbytes
      --load-in-8bit
      --tensor-parallel-size 2
      --max-model-len 32768
    ports:
      - "8001:8000"
    volumes:
      - ./models:/root/.cache/huggingface
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 2
              capabilities: [gpu]

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: czat_umowy
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    depends_on: [vllm, qdrant, postgres]
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres/czat_umowy
      - VLLM_URL=http://vllm:8000
      - QDRANT_URL=http://qdrant:6333
      - SECRET_KEY=${SECRET_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./data/documents:/data/documents

  frontend:
    build: ./frontend
    depends_on: [backend]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    ports:
      - "3000:3000"

volumes:
  qdrant_data:
  postgres_data:
```

## Zmienne środowiskowe (.env)

```bash
HF_TOKEN=hf_xxxxxxxxxxxx          # token do pobrania modelu z HuggingFace
POSTGRES_USER=czat_admin
POSTGRES_PASSWORD=silne_haslo
SECRET_KEY=jwt_secret_key
```

## Uruchomienie na serwerze

```bash
# 1. Klonowanie repozytorium
git clone <repo> && cd czat-umowy

# 2. Konfiguracja
cp .env.example .env
# uzupełnij .env

# 3. Pierwsze uruchomienie (pobieranie modelu ~140GB — może trwać 1-2h)
docker compose up -d qdrant postgres
docker compose up -d vllm   # czekaj na "Uvicorn running"

# 4. Migracje bazy
docker compose run --rm backend alembic upgrade head

# 5. Start całości
docker compose up -d

# 6. Sprawdzenie stanu
docker compose ps
docker compose logs vllm --tail=50
```

## Wymagania serwera

| Komponent | Minimum |
|---|---|
| GPU | 2× A100 40GB (lub równoważne 80GB VRAM łącznie) |
| RAM | 128 GB |
| CPU | 16 rdzeni |
| Dysk | 500 GB SSD (model ~70GB + dokumenty + logi) |
| OS | Ubuntu 22.04 LTS |
| CUDA | 12.1+ |
| Docker | 24+ z nvidia-container-toolkit |

## Aktualizacja modelu

```bash
# Zatrzymaj vllm, wyczyść cache, podmień model w docker-compose
docker compose stop vllm
rm -rf ./models/models--CYFRAGOVPL*/
# zmień wersję modelu w docker-compose.yml
docker compose up -d vllm
```
