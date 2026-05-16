# Glossário Técnico - Conecta Paraná

Este documento detalha a infraestrutura e as ferramentas tecnológicas que sustentam a plataforma.

---

### API REST (NestJS)
- **Definição:** Interface que utiliza **NestJS 11** para servir dados via requisições HTTP.
- **Contexto de uso:** Localizada na porta **3000 (Staging)** ou **3001 (Produção)**.

### PostgreSQL + PostGIS
- **Definição:** Banco de dados relacional com extensão para armazenamento e consulta de dados espaciais.
- **Contexto de uso:** Onde ocorrem as buscas por raio de distância e localização.

### Prisma ORM
- **Definição:** Ferramenta que mapeia o código TypeScript para o banco de dados.
- **Contexto de uso:** Utilizado para realizar operações de leitura, escrita e migrações.

### Object Storage (Oracle Cloud)
- **Definição:** Serviço de nuvem para armazenamento de arquivos binários (fotos).
- **Contexto de uso:** A API faz o upload e salva o link de retorno no banco de dados.

### Swagger
- **Definição:** Documentação interativa de todos os endpoints da API.
- **Contexto de uso:** Acessível via rota `/api/docs` para consulta dos desenvolvedores.

### ULID Prefixado
- **Definição:** Identificador Único Universal Ordenável Lexicograficamente (Universally Unique Lexicographically Sortable Identifier) quem tem um prefixo de 4 caracteres que indica a entidade (ex: `usr_01HZX...`).
- **Contexto de uso:** Chave primária padrão em todas as tabelas e referências de chave estrangeira, garantindo formatação type-safe e ordenação baseada no tempo sem depender de autoincrementos do banco.

### Convenções de DTO

#### Transformações (`@Transform`)
- **Strings de texto** (`name`, `nome`): `.trim()` para remover espaços nas pontas.
- **Email**: `.trim().toLowerCase()` para normalizar.
- **Siglas de estado**: `.trim().toUpperCase()` para padronizar.
- **Regra geral**: Sempre tipar o callback como `({ value }: { value: unknown })` para evitar erros de lint.

#### Updates com `PartialType`
- Todos os DTOs de update devem estender `PartialType(CreateDto)` importado de `@nestjs/swagger`.
- Isso garante que todos os campos são opcionais e as validações são herdadas.

#### `@ApiProperty` Obrigatório
- **Todo** campo de DTO deve ter `@ApiProperty` com `example` e, quando aplicável, `description`, `minLength`, `maxLength`.

#### Formato Padrão de Erro de Validação
```json
{
  "statusCode": 400,
  "code": "validation_failed",
  "message": [
    { "field": "email", "errors": ["email must be an email"] }
  ]
}
```

#### Formato Padrão de Resposta Paginada
```json
{
  "items": [],
  "total": 42,
  "page": 1,
  "pageSize": 10
}
```
- DTOs: `PaginationQueryDto` (query params), `PaginatedResponseDto<T>` (resposta).
- `page` default `1`, `pageSize` default `10`, máximo `100`.
### Design Token
- **Definição:** Unidade atômica do design system que mapeia uma decisão de design (cor, tipografia, espaçamento, raio, sombra) a um **nome semântico independente de implementação**. Um token desacopla o *valor* (ex: `#006733`) da *intenção* (ex: `color/mobile/primary/default`), permitindo que diferentes plataformas (web, Flutter, iOS) consumam os mesmos valores sem duplicação.
- **Contexto de uso:** Todos os tokens do projeto estão definidos no [Figma — Designs Conecta Paraná](https://www.figma.com/design/xys9bh2mEhMSAnRd8ZuQe8/) e documentados em [docs/DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md). São organizados em três camadas: **Base** (valores raw), **Semântica** (intenção por frente: Mobile, Admin, Landing) e **Componente** (uso específico).
- **Exemplos:**
  - `color/mobile/primary/default` → `#006733` (Verde Paraná)
  - `color/admin/surface/sidebar` → `#002E1D`
  - `typography/h1` → Sora 40px Bold
  - `spacing/s` → 16px
  - `radius/sm` → 8px
- **Equivalências:** Cada token possui mapeamento explícito para CSS Custom Property, Tailwind config key e Flutter ThemeData — ver tabelas em `DESIGN_SYSTEM.md`.
### Convenções de DTO

<!-- Adicione mais termos conforme necessário -->