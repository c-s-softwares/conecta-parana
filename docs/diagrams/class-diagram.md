# Diagrama de Classe - Conecta Parana

Modelo de domínio derivado de `backend/prisma/schema.prisma`. Cada classe corresponde a um model do Prisma (nome da tabela entre parênteses). Atributos técnicos de índice (GIN/Gist, geometry bruto) foram omitidos para manter o foco no domínio. As entidades de infra de autenticação aparecem de forma simplificada.

```mermaid
classDiagram
    class City {
        +string id
        +string name
        +string state
        +datetime createdAt
        +datetime~null~ deletedAt
    }

    class User {
        +string id
        +string name
        +string email
        +string password
        +Role role
        +string~null~ cityId
        +datetime~null~ lastCityUpdateAt
        +datetime~null~ emailVerifiedAt
    }

    class Role {
        <<enumeration>>
        ADMIN
        CIDADAO
    }

    class Event {
        +string id
        +string title
        +string description
        +string type
        +boolean isActive
        +boolean priority
        +Point~null~ coordinates
        +datetime eventDate
        +string cityId
        +string userId
        +string~null~ localId
        +datetime createdAt
        +datetime updatedAt
        +datetime~null~ deletedAt
    }

    class News {
        +string id
        +string title
        +string description
        +string type
        +string linkType
        +string~null~ linkUrl
        +boolean isActive
        +string cityId
        +string~null~ userId
        +datetime createdAt
        +datetime updatedAt
    }

    class Communicate {
        +string id
        +string title
        +string description
        +boolean isActive
        +boolean priority
        +string cityId
        +string userId
        +datetime createdAt
        +datetime updatedAt
    }

    class Category {
        +string id
        +string name
        +string icon
        +datetime createdAt
        +datetime updatedAt
        +datetime~null~ deletedAt
    }

    class Local {
        +string id
        +string name
        +string description
        +string address
        +string phone
        +Point~null~ coordinates
        +string cityId
        +string categoryId
        +string userId
        +datetime createdAt
        +datetime updatedAt
        +datetime~null~ deletedAt
    }

    class Photo {
        +string id
        +string url
        +string~null~ thumbUrl
        +string~null~ eventId
        +string userId
        +string~null~ localId
        +string~null~ ticketId
        +string~null~ newsId
        +string~null~ communicateId
    }

    class Like {
        +string id
        +string userId
        +string~null~ eventId
        +string~null~ communicateId
        +string~null~ newsId
    }

    class Save {
        +string id
        +datetime createdAt
        +string userId
        +string~null~ eventId
        +string~null~ communicateId
        +string~null~ newsId
        +string~null~ localId
    }

    class Notification {
        +string id
        +string title
        +string description
        +boolean isRead
        +datetime createdAt
        +string userId
        +string~null~ eventId
        +string~null~ communicateId
    }

    class Suggestion {
        +string id
        +string subject
        +string message
        +string status
        +string userId
        +string cityId
        +string~null~ response
        +datetime~null~ respondedAt
        +string~null~ respondedById
    }

    class Ticket {
        +string id
        +string type
        +string title
        +string description
        +string status
        +Point~null~ coordinates
        +string~null~ address
        +string cityId
        +string userId
        +string~null~ assignedToId
        +datetime createdAt
        +datetime updatedAt
        +datetime~null~ resolvedAt
    }

    class TicketComment {
        +string id
        +string ticketId
        +string authorId
        +string message
        +datetime createdAt
    }

    class RefreshToken {
        +string id
        +string token
        +datetime expiresAt
        +string userId
    }

    class PasswordResetCode {
        +string id
        +string userId
        +string codeHash
        +datetime expiresAt
        +datetime~null~ usedAt
    }

    class EmailVerificationCode {
        +string id
        +string userId
        +string codeHash
        +datetime expiresAt
        +datetime~null~ usedAt
    }

    User --> Role : role

    City "1" --> "0..*" User : moradores
    City "1" --> "0..*" Event : eventos
    City "1" --> "0..*" News : notícias
    City "1" --> "0..*" Local : locais
    City "1" --> "0..*" Communicate : comunicados
    City "1" --> "0..*" Suggestion : sugestões
    City "1" --> "0..*" Ticket : chamados

    User "1" --> "0..*" Event : cria
    User "1" --> "0..*" News : publica
    User "1" --> "0..*" Local : cadastra
    User "1" --> "0..*" Communicate : emite
    User "1" --> "0..*" Photo : envia
    User "1" --> "0..*" Like : curte
    User "1" --> "0..*" Save : salva
    User "1" --> "0..*" Notification : recebe
    User "1" --> "0..*" Suggestion : envia
    User "1" --> "0..*" Ticket : abre
    User "1" --> "0..*" TicketComment : comenta
    User "1" --> "0..*" RefreshToken : sessões
    User "1" --> "0..*" PasswordResetCode : resets
    User "1" --> "0..*" EmailVerificationCode : verificações

    Category "1" --> "0..*" Local : classifica
    Local "1" --> "0..*" Event : sedia
    Local "1" --> "0..*" Photo : fotos
    Local "1" --> "0..*" Save : salvos

    Event "1" --> "0..*" Photo : fotos
    Event "1" --> "0..*" Like : curtidas
    Event "1" --> "0..*" Save : salvos
    Event "1" --> "0..*" Notification : avisos

    News "1" --> "0..*" Photo : fotos
    News "1" --> "0..*" Like : curtidas
    News "1" --> "0..*" Save : salvos

    Communicate "1" --> "0..*" Photo : fotos
    Communicate "1" --> "0..*" Like : curtidas
    Communicate "1" --> "0..*" Save : salvos
    Communicate "1" --> "0..*" Notification : avisos

    Ticket "1" --> "0..*" TicketComment : comentários
    Ticket "1" --> "0..*" Photo : fotos
```

## Notas de leitura

- **Save** é a entidade antes chamada "Favorite" (tabela `saves`, prefixo `sav_`). Representa conteúdo salvo pelo cidadão e pode apontar para evento, comunicado, notícia ou local.
- **Like** e **Save** são polimórficos por convenção: cada registro referencia no máximo um tipo de conteúdo via FKs opcionais, com unicidade por (usuário, conteúdo).
- **Photo** também é poliassociada: pertence a um único dono (evento, local, chamado, notícia ou comunicado) e sempre a um usuário que enviou.
- **Ticket** modela chamados de serviço, com atribuição opcional a um admin (`assignedToId`) e histórico em **TicketComment**.
- Entidades de auth (`RefreshToken`, `PasswordResetCode`, `EmailVerificationCode`) sustentam sessão e fluxos de senha/verificação; aparecem simplificadas por não fazerem parte do domínio de negócio.
- `HealthCheck` foi omitida por ser tabela de diagnóstico de infra.
