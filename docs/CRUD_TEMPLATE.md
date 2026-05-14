# Template CRUD Genérico - Conecta Paraná

Este documento descreve o padrão oficial para criação de novos módulos CRUD utilizando a infraestrutura genérica do projeto, replicando o padrão do módulo **Cidades**.

---

## 1. Arquitetura de Herança (DRY)

Para evitar repetição de código, utilizamos classes base que já implementam as operações padrão (GET, POST, PATCH, DELETE).

- **Service**: Estende `BaseCrudService`
- **Controller**: Estende `BaseCrudController`

### Estrutura de Referência
```text
src/modules/cidades/
├── dto/
│   ├── request/
│   │   ├── create-cidade.dto.ts   ← Ponto principal de customização
│   │   └── update-cidade.dto.ts   ← PartialType(CreateDto)
│   └── response/
│       └── cidade-response.dto.ts ← Interface de retorno
├── cidades.controller.ts          ← Rotas + Guards + Swagger
├── cidades.service.ts             ← Lógica de negócio + Prisma
├── cidades.service.spec.ts        ← Testes unitários
└── cidades.module.ts              ← Módulo NestJS
```

---

## 2. Convenções de DTO

### Localização
Os DTOs devem ficar em subpastas dentro do módulo:
`src/modules/<modulo>/dto/request/` e `src/modules/<modulo>/dto/response/`

### Transformações (@Transform)
- **Strings**: `.trim()`
- **Email**: `.trim().toLowerCase()`
- **Siglas**: `.trim().toUpperCase()`
- **Tipagem**: Sempre `({ value }: { value: unknown })`.

### Swagger (@ApiProperty)
- Obrigatório em todos os campos.
- Sempre incluir `example`.

---

## 3. Passo a Passo para Novo Módulo

### 1. Criar a Pasta e o Módulo
Você pode copiar o módulo `cidades/` ou criar do zero.
```bash
cp -r src/modules/cidades src/modules/<novo-modulo>
```

### 2. Renomear arquivos e classes
- `cidades.service.ts` → `<novo-modulo>.service.ts`
- `CidadesService` → `<NovoModulo>Service`
- `CreateCidadeDto` → `Create<NovoModulo>Dto`
- etc.

### 3. Definir DTOs
Crie o `CreateDto` e o `ResponseDto`. O `UpdateDto` deve usar `PartialType`:
```typescript
export class UpdateXDto extends PartialType(CreateXDto) {}
```
- Adicionar/remover campos conforme a entidade.
- Manter `@ApiProperty` em **todos** os campos.
- Aplicar `@Transform` conforme convenção.

### 4. Implementar o Service
```typescript
@Injectable()
export class XService extends BaseCrudService<XResponse, CreateXDto, UpdateXDto> {
  constructor(prisma: PrismaService) {
    super(prisma, TABLE_PREFIX.X);
  }

  protected toResponse(entity: any): XResponse {
    return { ...entity }; // Mapeamento manual aqui
  }
}
```

### 5. Implementar o Controller
```typescript
@ApiTags('x')
@Controller('x')
export class XController extends BaseCrudController<XResponse, CreateXDto, UpdateXDto> {
  constructor(private readonly xService: XService) {
    super(xService);
  }

  // O BaseCrudController já provê a documentação básica e endpoints.
  // Realize o 'override' apenas quando precisar customizar a lógica interna de uma rota.
}
```

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

## 4. Checklist de Validação

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

## 5. Padrão de Endpoints e Segurança

- **Público**: `findAll` e `findOne` são públicos por herança.
- **Admin**: `create`, `update` e `remove` exigem `@AdminRoute()` na base.
- Se precisar mudar a segurança, sobrescreva o método no controller filho com os guards desejados.

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/<modulo>` | Público | Listar com paginação |
| `GET` | `/<modulo>/:id` | Público | Buscar por ID |
| `POST` | `/<modulo>` | Admin | Criar |
| `PATCH` | `/<modulo>/:id` | Admin | Atualizar parcialmente |
| `DELETE` | `/<modulo>/:id` | Admin | Soft delete |

---

## 6. Formato de Respostas

### Sucesso (Paginado)
```json
{
  "items": [],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```

### Padrão de Erros

| Código | `error` | Quando |
|--------|---------|--------|
| 400 | `validation_failed` | Campos inválidos no body |
| 400 | `invalid_id_format` | ULID com formato inválido |
| 404 | — | Entidade não encontrada |
| 409 | `<entidade>_exists` | Duplicata (unique constraint) |

**Exemplo de Erro de Validação:**
```json
{
  "statusCode": 400,
  "code": "validation_failed",
  "message": [
    "email must be an email"
  ]
}
```
