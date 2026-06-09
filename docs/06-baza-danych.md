# Schemat bazy danych (PostgreSQL)

## Tabele

### users
```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'viewer', -- 'admin' | 'uploader' | 'viewer'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### conversations
```sql
CREATE TABLE conversations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,              -- domyślnie: nazwa pliku
    file_name    TEXT NOT NULL,
    file_size    INTEGER NOT NULL,           -- bajty
    file_type    TEXT NOT NULL,              -- 'pdf' | 'docx'
    qdrant_collection TEXT NOT NULL,         -- ID kolekcji w Qdrant
    indexed      BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### messages
```sql
CREATE TABLE messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role             TEXT NOT NULL,   -- 'user' | 'assistant'
    content          TEXT NOT NULL,
    sources          JSONB,           -- [{paragraph: "§8 pkt 3", text: "...", score: 0.92}]
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### audit_log
```sql
CREATE TABLE audit_log (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID REFERENCES users(id),
    action           TEXT NOT NULL,   -- 'upload' | 'query' | 'delete' | 'login'
    conversation_id  UUID REFERENCES conversations(id),
    metadata         JSONB,           -- dodatkowe info (IP, user agent)
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Indeksy

```sql
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
```

## Relacje

```
users ──< conversations ──< messages
  │              │
  └──< audit_log ┘
```

## Przechowywanie plików

Pliki (PDF/DOCX) **nie trafiają do PostgreSQL**. Są zapisywane na dysku serwera (lub S3-compatible storage) w ścieżce:

```
/data/documents/{user_id}/{conversation_id}/original.{pdf|docx}
```

PostgreSQL trzyma tylko metadane. Qdrant trzyma wektory z chunkami tekstu.
