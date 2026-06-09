# Bezpieczeństwo

## Autentykacja

### Flow (SSO / JWT)

```
Użytkownik → Frontend → [Keycloak / Azure AD]
                              │
                              ▼ JWT token (access + refresh)
                         Backend API
                              │
                    weryfikacja tokenu przy każdym requeście
```

Jeśli firma ma Azure AD / Active Directory — bezpośrednia integracja OIDC.
Jeśli nie — Keycloak jako self-hosted IdP.

### Konfiguracja FastAPI

```python
# Każdy endpoint wymaga ważnego tokenu
@router.post("/conversations")
async def create_conversation(
    current_user: User = Depends(get_current_user),  # weryfikacja JWT
    ...
):
```

## RBAC (Role-Based Access Control)

| Rola | Upload | Czat | Usuń swoje | Usuń wszystkie | Admin panel |
|---|---|---|---|---|---|
| `viewer` | ✗ | ✓ | ✗ | ✗ | ✗ |
| `uploader` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `admin` | ✓ | ✓ | ✓ | ✓ | ✓ |

Role przypisywane w Keycloak / Azure AD — backend weryfikuje z tokenu.

## Szyfrowanie danych

### Pliki w spoczynku
- Dysk serwera szyfrowany (LUKS / dm-crypt) — szyfrowanie na poziomie OS
- Alternatywa: pliki szyfrowane AES-256-GCM przed zapisem, klucz w zmiennych środowiskowych

### Baza danych
- PostgreSQL z `pg_crypto` dla wrażliwych pól (opcjonalnie)
- Połączenie SSL między backendem a PostgreSQL

### Transmisja
- HTTPS/TLS 1.3 — obowiązkowo na produkcji (nginx reverse proxy z certyfikatem)
- Wewnętrzne połączenia (backend ↔ vLLM ↔ Qdrant) przez sieć Docker — izolowane

## Izolacja danych między użytkownikami

- Każda rozmowa ma `user_id` — backend **zawsze** filtruje po `user_id` z tokenu JWT
- Qdrant: każda rozmowa ma osobną kolekcję lub payload filter `conversation_id`
- Użytkownik nigdy nie widzi dokumentów innych użytkowników

## Audyt

Każda operacja zapisywana w `audit_log`:
- Kto uploadował jaki plik i kiedy
- Kto zadał jakie pytanie (treść pytania + timestamp)
- Kto usunął rozmowę

Logi audytu dostępne tylko dla `admin`.

## Nginx (reverse proxy)

```nginx
server {
    listen 443 ssl;
    server_name czat-umowy.firma.pl;

    ssl_certificate     /etc/ssl/certs/firma.crt;
    ssl_certificate_key /etc/ssl/private/firma.key;
    ssl_protocols       TLSv1.3;

    # Rate limiting — ochrona przed nadużyciami
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

    location /api/ {
        limit_req zone=api burst=10;
        proxy_pass http://backend:8000/;
    }

    location / {
        proxy_pass http://frontend:3000/;
    }
}
```

## Checklist przed wdrożeniem produkcyjnym

- [ ] HTTPS włączone, HTTP → redirect na HTTPS
- [ ] JWT secret rotowany (nie default)
- [ ] Postgres hasło silne, nie domyślne
- [ ] vLLM API niedostępne z zewnątrz (tylko wewnętrzna sieć Docker)
- [ ] Qdrant niedostępne z zewnątrz
- [ ] Regularne backupy PostgreSQL (pg_dump cron)
- [ ] Monitoring alertów (Grafana) skonfigurowany
