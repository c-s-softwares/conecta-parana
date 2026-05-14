# Template CRUD Genérico - Conecta Paraná

Guia passo a passo para criar novos módulos CRUD replicando o padrão do módulo **Cidades**.

---

## Estrutura de Referência

```
src/modules/cidades/
├── dto/
│   ├── create-cidade.dto.ts   ← DTOs de criação
│   └── update-cidade.dto.ts   ← PartialType(CreateDto)
├── cidades.controller.ts      ← Rotas + Guards + Swagger
├── cidades.service.ts         ← Lógica de negócio + Prisma
├── cidades.service.spec.ts    ← Testes unitários
└── cidades.module.ts          ← Módulo NestJS
```

---

## Passo a Passo

### 1. Copiar o módulo `cidades/`

```bash
cp -r src/modules/cidades src/modules/<novo-modulo>
```

### 2. Renomear arquivos e classes

- `cidades.service.ts` → `<novo-modulo>.service.ts`
- `CidadesService` → `<NovoModulo>Service`
- `CreateCidadeDto` → `Create<NovoModulo>Dto`
- etc.

### 3. Ajustar DTOs

- Adicionar/remover campos conforme a entidade.
- Manter `@ApiProperty` em **todos** os campos.
- Aplicar `@Transform` conforme convenção (ver `TECHNICAL_GLOSSARY.md`).

### 4. Ajustar Service

- Alterar o model Prisma (`this.prisma.client.<entidade>`).
- Atualizar `TABLE_PREFIX` para o prefixo correto da tabela.
- Ajustar mapeamento de resposta (`toResponse()`).
- Implementar soft delete se aplicável (`deletedAt`).

### 5. Ajustar Controller

- Alterar `@ApiTags('...')` e `@Controller('...')`.
- Definir quais rotas são públicas e quais exigem admin.
- Documentar com `@ApiOperation`, `@ApiResponse`.

### 6. Registrar no `app.module.ts`

```typescript
import { <NovoModulo>Module } from './modules/<novo-modulo>/<novo-modulo>.module';

@Module({
  imports: [
    // ... existentes
    <NovoModulo>Module,
  ],
})
```

### 7. Criar Migration (se necessário)

```bash
# Dentro do container Docker:
npx prisma migrate dev --name <descricao>
```

---

## Checklist de Validação

- [ ] `@ApiProperty` em todos os campos do DTO
- [ ] `@Transform` para normalização (trim, lowercase, uppercase)
- [ ] `PartialType` no UpdateDto
- [ ] Resposta paginada com `{ items, total, page, pageSize }`
- [ ] Soft delete com `deletedAt` (quando aplicável)
- [ ] Guards de autorização (`JwtAuthGuard`, `RolesGuard`) em rotas protegidas
- [ ] `@ApiBearerAuth()` em rotas protegidas
- [ ] ID gerado com `generateId(TABLE_PREFIX.<ENTIDADE>)`
- [ ] Testes unitários no service (`*.spec.ts`)
- [ ] `npm test` passando
- [ ] `npm run lint` limpo
- [ ] Swagger documentado em `/api/docs`

---

## Padrão de Endpoints

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/<modulo>` | Público | Listar com paginação |
| `GET` | `/<modulo>/:id` | Público | Buscar por ID |
| `POST` | `/<modulo>` | Admin | Criar |
| `PATCH` | `/<modulo>/:id` | Admin | Atualizar parcialmente |
| `DELETE` | `/<modulo>/:id` | Admin | Soft delete |

---

## Padrão de Erros

| Código | `error` | Quando |
|--------|---------|--------|
| 400 | `validation_failed` | Campos inválidos no body |
| 400 | `invalid_id_format` | ULID com formato inválido |
| 404 | — | Entidade não encontrada |
| 409 | `<entidade>_exists` | Duplicata (unique constraint) |
