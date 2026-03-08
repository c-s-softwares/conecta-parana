# Arquitetura do Conecta Paraná

## Visão geral

O Conecta Paraná é um monorepo com três frentes que se comunicam através de uma API REST centralizada.

```mermaid
graph TD
    %% Definição de Estilos
    classDef infra fill:#f9f,stroke:#333,stroke-width:2px;
    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef server fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef database fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    subgraph Clientes [Clientes]
        MOBILE[Mobile<br/>Flutter 3.11+]:::client
        ADMIN[Admin Web<br/>Angular 21]:::client
    end

    subgraph External [Integrações Externas]
        GMAPS[Google Maps API<br/>Geocoding & Maps]:::external
    end

    subgraph Backend [Core Backend - NestJS]
        API[API REST<br/>Porta 3000 - Staging<br/>Porta 3001 - Produção]:::server
        SWAGGER[Swagger Docs<br/>/api/docs]:::server
    end

    subgraph Dados [Camada de Persistência]
        DB[(PostgreSQL 16<br/>+ PostGIS)]:::database
        OBJ[Object Storage<br/>Oracle Cloud]:::database
    end

    %% Fluxos de Comunicação
    MOBILE -- "JSON / HTTP" --> API
    ADMIN -- "JSON / HTTP" --> API
    
    API -- "Query / Prisma" --> DB
    API -. "Upload / SDK" .-> OBJ
    API -- "Geolocalização" --> GMAPS
    
    API --- SWAGGER

    %% Notas de implementação
    linkStyle 4 stroke:#ff9800,stroke-width:2px,stroke-dasharray: 5 5;
    linkStyle 3 stroke:#2196f3,stroke-width:2px,stroke-dasharray: 5 5;
```

## Stack por frente

| Frente | Tecnologias principais |
|---|---|
| **Backend** | NestJS 11, TypeScript, Prisma 7 (PrismaPg adapter), PostGIS, Swagger, Jest, Stryker |
| **Admin** | Angular 21 (standalone components), TypeScript, Tailwind CSS, Vite, Jasmine + Karma, Playwright, Stryker |
| **Mobile** | Flutter 3.11+, Dart
| **Infra** | Docker, Docker Compose, PostgreSQL 16 + PostGIS, GHCR, GitHub Actions |

## Fluxo de dados

```mermaid
flowchart LR
    %% Clientes
    A[Cidadão<br/>App Mobile] -->|Requisição HTTP| B
    C[Admin Municipal<br/>Painel Web] -->|Requisição HTTP| B

    %% Backend com Portas
    B[API NestJS 11]

    %% Processamento Geográfico
    B <-->|Geocoding| G[Google Maps API]

    %% Persistência e Upload
    B -->|Prisma ORM| D[(PostgreSQL 16<br/>+ PostGIS)]
    B -->|1. Upload| E[Object Storage Oracle]
    E -.->|2. Retorna URL| B
    B -.->|3. Salva URL| D

    %% Estilos
    style B fill:#f3e5f5,stroke:#4a148c
    style D fill:#e8f5e9,stroke:#1b5e20
    style G fill:#fff3e0,stroke:#e65100
```

## Ambientes

| Ambiente | Compose file | Descrição |
|---|---|---|
| **Local** | `docker-compose.yml` | Desenvolvimento com hot reload. Backend na porta 3000, admin na 4200, banco na 5432. |
| **Staging** | `docker-compose.staging.yml` | Imagens pré-construídas do GHCR com tag `:staging`. Deploy manual via GitHub Actions. |
| **Produção** | `docker-compose.production.yml` | Imagens do GHCR com tag `:latest`. Deploy automático ao mergear PR na `main`. |

## Deploy

- **Registry:** GitHub Container Registry (GHCR)
- **Plataforma:** Linux/arm64 (build via QEMU + Buildx)
- **Servidor:** VM acessada via SSH

## Estrutura do monorepo

```
conecta-parana/
├── backend/             # API NestJS + Prisma
├── admin/               # Painel web Angular
├── mobile/              # App Flutter
├── infra/               # Dockerfile do banco (PostGIS)
├── docs/                # Documentação do projeto
├── .github/workflows             # CI/CD pipelines
├── docker-compose.yml            # Local
├── docker-compose.staging.yml    # Staging
└── docker-compose.production.yml # Produção
```
