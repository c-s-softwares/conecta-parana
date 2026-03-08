# Conecta Paraná — Backend

API REST construída com NestJS 11, TypeScript, Prisma 7 e PostgreSQL 16 + PostGIS.

## Como rodar

### Com Docker (recomendado)

Na raiz do monorepo:

```bash
docker-compose up -d db backend
```

O backend sobe na porta **3000** com hot reload.

### Sem Docker

Requer um PostgreSQL com PostGIS rodando localmente.

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL
npm install
npx prisma migrate dev
npm run start:dev
```

## Swagger

Documentação da API disponível em: `http://localhost:3000/api/docs`

## Scripts disponíveis

| Script | Comando | Descrição |
|---|---|---|
| `start:dev` | `npm run start:dev` | Dev server com hot reload |
| `start:debug` | `npm run start:debug` | Dev server com debug |
| `start:prod` | `npm run start:prod` | Produção (`node dist/main`) |
| `build` | `npm run build` | Build do projeto |
| `lint` | `npm run lint` | ESLint |
| `lint:fix` | `npm run lint:fix` | ESLint com auto-fix |
| `format` | `npm run format` | Prettier |
| `test` | `npm run test` | Testes unitários (Jest) |
| `test:cov` | `npm run test:cov` | Testes com cobertura |
| `test:e2e` | `npm run test:e2e` | Testes E2E (requer banco) |
| `test:mutation` | `npm run test:mutation` | Testes de mutação (Stryker) |
| `prisma:migrate:dev` | `npm run prisma:migrate:dev` | Criar/aplicar migrations |
| `prisma:migrate:deploy` | `npm run prisma:migrate:deploy` | Aplicar migrations (prod) |
| `prisma:studio` | `npm run prisma:studio` | Interface visual do banco |
| `prisma:generate` | `npm run prisma:generate` | Gerar Prisma Client |

## Testes

```bash
npm run test              # Unitários
npm run test:e2e          # E2E (banco precisa estar rodando)
npm run test:mutation     # Mutação (Stryker)
```

## Decisões técnicas

- **NestJS 11** com módulos e standalone components
- **Prisma 7** com `@prisma/adapter-pg` (PrismaPg adapter) para conexão direta via `pg`
- **PostGIS** para dados geoespaciais (geometria `Point`, SRID 4326)
- **Swagger** (`@nestjs/swagger`) para documentação automática da API
- **Jest** para testes unitários e E2E, **Stryker** para testes de mutação
- **Joi** para validação de variáveis de ambiente
