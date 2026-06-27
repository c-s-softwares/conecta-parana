# Diagrama Entidade-Relacionamento - Conecta Parana

Modelo físico derivado de `backend/prisma/schema.prisma`. Os nomes seguem as tabelas reais do banco (snake_case). Colunas de índice espacial/textual e o tipo bruto `geometry` foram omitidos; apenas chaves e colunas relevantes ao relacionamento aparecem.

```mermaid
erDiagram
    cities ||--o{ users : "moradores"
    cities ||--o{ events : "sedia"
    cities ||--o{ news : "publica"
    cities ||--o{ locals : "possui"
    cities ||--o{ communicates : "emite"
    cities ||--o{ suggestions : "recebe"
    cities ||--o{ tickets : "recebe"

    users ||--o{ events : "cria"
    users ||--o{ news : "publica"
    users ||--o{ locals : "cadastra"
    users ||--o{ communicates : "emite"
    users ||--o{ photos : "envia"
    users ||--o{ likes : "curte"
    users ||--o{ saves : "salva"
    users ||--o{ notifications : "recebe"
    users ||--o{ suggestions : "envia"
    users ||--o{ suggestions : "responde"
    users ||--o{ tickets : "abre"
    users ||--o{ tickets : "atende"
    users ||--o{ ticket_comments : "comenta"
    users ||--o{ refresh_tokens : "mantem"
    users ||--o{ password_reset_codes : "solicita"
    users ||--o{ email_verification_codes : "verifica"

    categories ||--o{ locals : "classifica"
    locals ||--o{ events : "sedia"
    locals ||--o{ photos : "tem"
    locals ||--o{ saves : "salvo_em"

    events ||--o{ photos : "tem"
    events ||--o{ likes : "recebe"
    events ||--o{ saves : "salvo_em"
    events ||--o{ notifications : "gera"

    news ||--o{ photos : "tem"
    news ||--o{ likes : "recebe"
    news ||--o{ saves : "salvo_em"

    communicates ||--o{ photos : "tem"
    communicates ||--o{ likes : "recebe"
    communicates ||--o{ saves : "salvo_em"
    communicates ||--o{ notifications : "gera"

    tickets ||--o{ ticket_comments : "tem"
    tickets ||--o{ photos : "tem"

    cities {
        string id PK
        string name
        string state
        datetime created_at
        datetime deleted_at "nullable"
    }

    users {
        string id PK
        string name
        string email UK
        string password
        Role role
        string city_id FK "nullable"
        datetime last_city_update_at "nullable"
        datetime email_verified_at "nullable"
    }

    refresh_tokens {
        string id PK
        string token UK
        datetime expires_at
        string user_id FK
    }

    password_reset_codes {
        string id PK
        string user_id FK
        string code_hash UK
        datetime expires_at
        datetime used_at "nullable"
    }

    email_verification_codes {
        string id PK
        string user_id FK
        string code_hash UK
        datetime expires_at
        datetime used_at "nullable"
    }

    events {
        string id PK
        string title
        string description
        string type
        boolean is_active
        boolean priority
        datetime event_date
        string city_id FK
        string user_id FK
        string local_id FK "nullable"
        datetime created_at
        datetime updated_at
        datetime deleted_at "nullable"
    }

    news {
        string id PK
        string title
        string description
        string type
        string link_type
        string link_url "nullable"
        boolean is_active
        string city_id FK
        string user_id FK "nullable"
        datetime created_at
        datetime updated_at
    }

    communicates {
        string id PK
        string title
        string description
        boolean is_active
        boolean priority
        string city_id FK
        string user_id FK
        datetime created_at
        datetime updated_at
    }

    categories {
        string id PK
        string name UK
        string icon
        datetime created_at
        datetime updated_at
        datetime deleted_at "nullable"
    }

    locals {
        string id PK
        string name
        string description
        string address
        string phone
        string city_id FK
        string category_id FK
        string created_by_user_id FK
        datetime created_at
        datetime updated_at
        datetime deleted_at "nullable"
    }

    photos {
        string id PK
        string url UK
        string thumb_url "nullable"
        string user_id FK
        string event_id FK "nullable"
        string local_id FK "nullable"
        string ticket_id FK "nullable"
        string news_id FK "nullable"
        string communicate_id FK "nullable"
    }

    likes {
        string id PK
        string user_id FK
        string event_id FK "nullable"
        string communicate_id FK "nullable"
        string news_id FK "nullable"
    }

    saves {
        string id PK
        datetime created_at
        string user_id FK
        string event_id FK "nullable"
        string communicate_id FK "nullable"
        string news_id FK "nullable"
        string local_id FK "nullable"
    }

    notifications {
        string id PK
        string title
        string description
        boolean is_read
        datetime created_at
        string user_id FK
        string event_id FK "nullable"
        string communicate_id FK "nullable"
    }

    suggestions {
        string id PK
        string subject
        string message
        string status
        string user_id FK
        string city_id FK
        string response "nullable"
        datetime responded_at "nullable"
        string responded_by_id FK "nullable"
    }

    tickets {
        string id PK
        string type
        string title
        string description
        string status
        string address "nullable"
        string city_id FK
        string user_id FK
        string assigned_to_id FK "nullable"
        datetime created_at
        datetime updated_at
        datetime resolved_at "nullable"
    }

    ticket_comments {
        string id PK
        string ticket_id FK
        string author_id FK
        string message
        datetime created_at
    }
```

## Notas de leitura

- **PK** = chave primária (ULID prefixado), **FK** = chave estrangeira, **UK** = chave única. `nullable` marca coluna opcional.
- **`users` aparece duas vezes** ligada a `suggestions` (autor `user_id` e respondente `responded_by_id`) e a `tickets` (autor `user_id` e responsável `assigned_to_id`).
- **`likes` e `saves`** carregam FKs opcionais mútuas para os diferentes conteúdos; a unicidade real é por (usuário, conteúdo) e garante um voto/salvo por item. `saves` também alcança `locals`, o que `likes` não faz.
- **`photos`** referencia um único dono entre evento, local, chamado, notícia ou comunicado, sempre com o `user_id` de quem enviou.
- Colunas `geometry(Point, 4326)` (em `events`, `locals`, `tickets`) e os índices GIN/Gist do PostGIS/`pg_trgm` foram omitidos por serem detalhe de infra, não de modelagem relacional.
