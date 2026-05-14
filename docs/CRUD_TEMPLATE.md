# Template CRUD Genérico - Conecta Paraná

Guia passo a passo para criar novos módulos CRUD replicando o padrão do módulo **Cidades**.

---

## Estrutura de Referência

```
src/modules/cidades/
├── dto/
│   ├── request/
│   │   ├── create-cidade.dto.ts   ← Ponto principal de customização
│   │   └── update-cidade.dto.ts   ← PartialType(CreateDto)
│   └── response/
│       └── cidade-response.dto.ts ← Interface de retorno
├── cidades.controller.ts          ← Rotas + Guards + Swagger
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

### 3. Ajustar DTOs (Customização Principal)

Este é o passo mais importante para definir o comportamento do seu módulo:
- Defina os campos, validações (`class-validator`) e tipos.
- Adicione `@ApiProperty` em **todos** os campos para o Swagger.
- O `BaseController` herdará automaticamente essas definições para a documentação.
- Aplique `@Transform` conforme convenção (ex: trim, lowercase).

### 4. Ajustar Service

- Alterar o model Prisma (`this.prisma.client.<entidade>`).
- Atualizar `TABLE_PREFIX` para o prefixo correto da tabela (ver `ulid.types.ts`).
- Ajustar mapeamento de resposta (`toResponse()`).

### 5. Ajustar Controller

- Alterar `@ApiTags('...')` e `@Controller('...')`.
- **Importante**: O `BaseController` já provê documentação básica e rotas.
- Realize o `override` de métodos **apenas** quando houver necessidade de customizar a lógica, segurança ou comportamento da rota. Não sobrescreva apenas para mudar textos do Swagger.

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

---

## Checklist de Validação

- [ ] `@ApiProperty` em todos os campos do DTO
- [ ] `@Transform` para normalização (trim, lowercase, uppercase)
- [ ] `PartialType` no UpdateDto
- [ ] Resposta paginada com `{ items, total, page, pageSize }`
- [ ] Guards de autorização (`JwtAuthGuard`, `RolesGuard`) em rotas protegidas
- [ ] `@ApiBearerAuth()` em rotas protegidas
- [ ] ID gerado com `generateId(TABLE_PREFIX.<ENTIDADE>)`
- [ ] Testes unitários no service (`*.spec.ts`)
- [ ] `npm test` passando
- [ ] `npm run lint` limpo

---

## Padrão de Endpoints

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/<modulo>` | Público | Listar com paginação |
| `GET` | `/<modulo>/:id` | Público | Buscar por ID |
| `POST` | `/<modulo>` | Admin | Criar |
| `PATCH` | `/<modulo>/:id` | Admin | Atualizar parcialmente |
| `DELETE` | `/<modulo>/:id` | Admin | Remoção física |

---

## Padrão de Erros

A API utiliza o formato padrão do NestJS. O `exceptionFactory` produz um array de strings planas para mensagens de validação.

| Código | Mensagem (`message`) | Quando |
|--------|----------------------|--------|
| 400 | `["campo deve ser email"]` | Erro de validação (strings planas) |
| 401 | `Unauthorized` | Token ausente ou inválido |
| 403 | `Forbidden resource` | Usuário sem permissão (ex: não é ADMIN) |
| 404 | `Not Found` | Registro não encontrado |
| 409 | `Conflict` | Duplicata de campo único no banco |
