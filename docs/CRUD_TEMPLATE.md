# Guia de Implementação CRUD - Conecta Paraná

Este documento descreve o padrão oficial para criação de novos módulos CRUD utilizando a infraestrutura genérica do projeto.

---

## 1. Arquitetura de Herança (DRY)

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
Para evitar repetição de código, utilizamos classes base que já implementam as operações padrão (GET, POST, PATCH, DELETE).

- **Service**: Estende `BaseCrudService`
- **Controller**: Estende `BaseCrudController`

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
Crie a estrutura básica e registre o módulo no `app.module.ts`.

### 2. Definir DTOs
Crie o `CreateDto` e o `ResponseDto`. O `UpdateDto` deve usar `PartialType`:
```typescript
export class UpdateXDto extends PartialType(CreateXDto) {}
```

### 3. Implementar o Service
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

### 4. Implementar o Controller
```typescript
@ApiTags('x')
@Controller('x')
export class XController extends BaseCrudController<XResponse, CreateXDto, UpdateXDto> {
  constructor(private readonly xService: XService) {
    super(xService);
  }

  // Override apenas para tipagem do Swagger ou customização de rota
  @Post()
  @ApiOperation({ summary: 'Criar X' })
  override create(@Body() dto: CreateXDto) {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar X' })
  override update(@Param('id') id: string, @Body() dto: UpdateXDto) {
    return super.update(id, dto);
  }
}
```

---

## 4. Segurança por Padrão

- **Público**: `findAll` e `findOne` são públicos por herança.
- **Admin**: `create`, `update` e `remove` exigem `@AdminRoute()` na base.
- Se precisar mudar a segurança, sobrescreva o método no controller filho com os guards desejados.

---

## 5. Formato de Respostas

### Sucesso (Paginado)
```json
{
  "items": [],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```

### Erro de Validação
```json
{
  "statusCode": 400,
  "code": "validation_failed",
  "message": [
    { "field": "email", "errors": ["email must be an email"] }
  ]
}
```
