# Conecta Paraná - Admin

Painel administrativo construído com Angular 21 (standalone components), TypeScript, Tailwind CSS e Vite.

## Como rodar

### Com Docker

Na raiz do monorepo:

```bash
docker-compose up -d admin
```

### Sem Docker

```bash
cd admin
npm install
npm run dev
```

Acesse em: `http://localhost:4200`

## Scripts disponíveis

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `npm run dev` | Dev server (porta 4200) |
| `build` | `npm run build` | Build de produção |
| `watch` | `npm run watch` | Build em modo watch |
| `test` | `npm run test` | Testes unitários (Vitest) |
| `e2e` | `npm run e2e` | Testes E2E (Playwright) |
| `test:mutation` | `npm run test:mutation` | Testes de mutação (Stryker) |
| `lint` | `npm run lint` | ESLint |
| `lint:fix` | `npm run lint:fix` | ESLint com auto-fix |
| `format` | `npm run format` | Prettier |

## Testes

```bash
npm run test              # Unitários (Vitest)
npm run e2e               # E2E (Playwright)
npm run test:mutation     # Mutação (Stryker)
```

## Camada de API

### BaseCrudApi - entidades CRUD

Toda entidade CRUD estende `BaseCrudApi<T, F>`:

```ts
@Injectable({ providedIn: 'root' })
export class CitiesApi extends BaseCrudApi<City> {
  protected readonly endpoint = 'cities';
}
```

Isso disponibiliza automaticamente os cinco métodos HTTP:

| Método | HTTP | Descrição |
|---|---|---|
| `list(params?)` | `GET /endpoint?page=&pageSize=&search=&...filters` | Lista paginada |
| `get(id)` | `GET /endpoint/:id` | Item por ID |
| `create(body)` | `POST /endpoint` | Criação |
| `update(id, body)` | `PATCH /endpoint/:id` | Atualização parcial |
| `delete(id)` | `DELETE /endpoint/:id` | Remoção (204) |

O parâmetro genérico `F extends FilterValues` permite filtros tipados por entidade:

```ts
export class EventsApi extends BaseCrudApi<EventItem, { cityId?: string; type?: string }> {
  protected readonly endpoint = 'events';
}
```

Filtros `undefined`, `null` e `''` são descartados automaticamente; `false` e `0` são enviados.

### Aggregators não-CRUD

Serviços que não mapeiam para operações de recurso único (como dashboards e relatórios) injetam `HttpClient` diretamente, sem estender `BaseCrudApi`:

```ts
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  getMetrics(): Observable<DashboardMetrics> { ... }
  getRecentActivity(limit = 10): Observable<ActivityItem[]> { ... }
}
```

## Decisões técnicas

- **Angular 21** com standalone components
- **Tailwind CSS 4** para estilização
- **Vite** como bundler (via `@angular/build`)
- **Vitest** para testes unitários
- **Playwright** para testes E2E
- **Stryker** para testes de mutação
- **ESLint** (`angular-eslint`) + **Prettier** para linting e formatação
- Environments Angular para staging e produção (`fileReplacements`)

## Componentes Compartilhados (Core)

Os componentes reutilizáveis ficam em `src/app/shared/components/`, um por pasta (`*.ts` + `*.html`). Todos são standalone e usam signals - para usar, basta importar a classe no `imports` do componente consumidor.

Convenções que valem para todos:

- **Inputs** são `signal inputs` (`input()` / `input.required()`). No template, passe com `[input]="valor"`.
- **Outputs** seguem a convenção do Angular: o nome termina no que aconteceu, não na ação. Ou seja, `(pageChange)`, `(cancelled)`, `(fileChange)` - e não `(page)`, `(cancel)`, `(change)`. Se você bindar o nome errado, não há erro de compilação: o handler simplesmente nunca dispara.
- **Estilo** usa o design system em `src/styles.css` (tokens `--brand-*`/`--n-*` e classes `.btn`, `.card`, `.badge`, `.input`, `.list-item`, `.modal`, `.skeleton`). Reutilize essas classes nas telas em vez de recriar cores soltas.

Resumo de quando usar cada um:

| Componente | Use para | Não use para |
|---|---|---|
| `DataList` | Listagem principal de um CRUD (cards paginados do backend) | Listas pequenas estáticas sem paginação |
| `ModalDialog` | Formulário de criar/editar ou tela de detalhe dentro de um modal | Confirmar exclusão (use `ConfirmDialog`) |
| `ConfirmDialog` | Confirmar ação destrutiva sim/não (excluir) | Formulários (use `ModalDialog`) |
| `EmptyState` | Sinalizar lista/área sem dados | - (o `DataList` já usa internamente) |
| `LoadingSkeleton` | Placeholder enquanto a requisição carrega | - |
| `FormField` | Envolver um input de formulário com label/erro, ou upload de arquivo | - |

---

### 1. `DataList` (`<app-data-list>`)

Renderiza a listagem principal de um CRUD como **cards (padrão list-item do design)**, já integrando `LoadingSkeleton` (quando `loading`), `EmptyState` (quando a lista vem vazia) e a paginação **server-side**. Substitui o antigo `EntityList`. Consome direto o shape paginado do backend (`PaginatedResponseDto<T>` = `{ items, total, page, pageSize }`).

O componente dona a *casca* (estados + paginação + container). **A linha de cada item é definida pela tela**, via um `<ng-template #row let-item>` projetado - é o que permite cada CRUD ter seu próprio card (thumb, badges, meta, ações) sem duplicar a paginação.

**Inputs**

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `items` (obrigatório) | `Record<string, unknown>[]` | - | Linhas da página atual (`response.items`) |
| `total` | `number` | `0` | Total de registros no backend (`response.total`) |
| `page` | `number` | `1` | Página atual (base 1) |
| `pageSize` | `number` | `10` | Itens por página |
| `loading` | `boolean` | `false` | Mostra o skeleton e esconde a lista |
| `emptyTitle` | `string` | `'Nenhum item encontrado'` | Título do estado vazio |
| `emptyDescription` | `string` | `''` | Descrição do estado vazio |
| `emptyIcon` | `string` | `''` | Ícone Heroicon do estado vazio (ex: `'heroMapPin'`) |
| `trackBy` | `string` | `'id'` | Chave usada para rastrear cada linha |

**Outputs**

| Output | Payload | Quando dispara |
|---|---|---|
| `pageChange` | `{ page, pageSize }` | Usuário troca de página |

**Template de linha**

O `<ng-template #row>` recebe o item no contexto `$implicit` (`let-item`) e o índice em `let i="index"`. Use a classe `.list-item` do design para o card. As ações da linha (editar/excluir) ficam dentro do template - assim cada tela decide quais existem.

**Exemplo**

```ts
onPage(e: DataListPageEvent) { /* refetch com e.page / e.pageSize */ }
```

```html
<app-data-list
  [items]="state().items"
  [total]="state().total"
  [page]="state().page"
  [pageSize]="state().pageSize"
  [loading]="state().loading"
  emptyTitle="Nenhum local cadastrado"
  emptyIcon="heroMapPin"
  (pageChange)="onPage($event)"
>
  <ng-template #row let-local>
    <div class="list-item">
      <div class="thumb"><ng-icon name="heroBuildingOffice2" size="24" /></div>
      <div class="body">
        <div class="title-row">
          <span class="title">{{ local.name }}</span>
          <span class="badge badge-local">{{ local.category }}</span>
          <span class="badge badge-dot" [class.badge-ativo]="local.active" [class.badge-inativo]="!local.active">
            {{ local.active ? 'Ativo' : 'Inativo' }}
          </span>
        </div>
        <div class="meta"><span><ng-icon name="heroMapPin" size="13" /> {{ local.city }}</span></div>
      </div>
      <div class="actions">
        <button type="button" class="btn-icon" (click)="openEdit(local)" aria-label="Editar">
          <ng-icon name="heroPencilSquare" size="16" />
        </button>
        <button type="button" class="btn-icon danger" (click)="confirmDelete(local)" aria-label="Excluir">
          <ng-icon name="heroTrash" size="16" />
        </button>
      </div>
    </div>
  </ng-template>
</app-data-list>
```

> Precisa de coluna formatada (boolean, data, status)? Formate dentro do próprio template (`local.active ? 'Ativo' : 'Inativo'`) - não há formatter separado porque a linha já é livre.

---

### 2. `ModalDialog` (`<app-modal-dialog>`)

Modal genérico para formulários e telas de detalhe. Já traz focus trap (Tab cicla dentro do modal), bloqueio de scroll do body, blur no backdrop e fechamento por ESC, clique no backdrop e botão "X". **Não** tem botões de ação próprios - o conteúdo vai no slot padrão (`<ng-content>`) e os botões de ação no slot opcional de footer.

**Inputs**

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `visible` (obrigatório) | `boolean` | - | Controla a exibição |
| `title` | `string` | `''` | Título no topo. Vazio = sem título |
| `eyebrow` | `string` | `''` | Rótulo pequeno acima do título (ex: `'Criar'` / `'Editar'`) |
| `subtitle` | `string` | `''` | Linha de apoio abaixo do título |
| `size` | `'s' \| 'm' \| 'l'` | `'m'` | Largura do modal (440 / 640 / 820px) |
| `dismissOnBackdrop` | `boolean` | `true` | Se `false`, clicar fora não fecha |
| `footer` | `boolean` | `false` | Habilita o rodapé com o slot `[modal-footer]` |

**Outputs**

| Output | Payload | Quando dispara |
|---|---|---|
| `cancelled` | `void` | ESC, clique no backdrop ou botão "X". O submit do formulário fica por conta do conteúdo projetado |

**Slots**

- Conteúdo padrão (`<ng-content>`): o corpo do modal (formulário, campos).
- `[modal-footer]`: o rodapé com os botões de ação - só aparece se `[footer]="true"`.

**Exemplo**

```html
<app-modal-dialog [visible]="isModalOpen()" eyebrow="Criar" title="Novo local"
  subtitle="Preencha os campos abaixo." [footer]="true" (cancelled)="closeModal()">
  <form id="local-form" [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
    <!-- campos -->
  </form>

  <div modal-footer class="flex gap-2">
    <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancelar</button>
    <button type="submit" form="local-form" class="btn btn-primary">Salvar</button>
  </div>
</app-modal-dialog>
```

---

### 3. `ConfirmDialog` (`<app-confirm-dialog>`)

Modal simplificado e específico para confirmar ações destrutivas (ex: exclusão). Diferente do `ModalDialog`, já vem com os botões confirmar/cancelar prontos.

**Inputs**

| Input | Tipo | Padrão |
|---|---|---|
| `visible` (obrigatório) | `boolean` | - |
| `title` | `string` | `'Confirmar exclusão'` |
| `message` | `string` | `'Tem certeza que deseja excluir este item?'` |

**Outputs**

| Output | Quando dispara |
|---|---|
| `confirmed` | Usuário confirma a ação |
| `cancelled` | Usuário cancela |

```html
<app-confirm-dialog
  [visible]="confirmOpen()"
  [message]="'Excluir a cidade ' + selected()?.name + '?'"
  (confirmed)="remove()"
  (cancelled)="confirmOpen.set(false)"
/>
```

---

### 4. `EmptyState` (`<app-empty-state>`)

Bloco visual para sinalizar ausência de dados. O `DataList` já o usa internamente quando a lista vem vazia - use direto só fora do contexto de lista.

**Inputs**

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `title` | `string` | `'Nenhum item encontrado'` | Título |
| `description` | `string` | `''` | Texto secundário (opcional) |
| `icon` | `string` | `'heroInbox'` | Chave de um ícone Heroicon registrado no `app.config.ts` |

```html
<app-empty-state title="Sem notificações" description="Você está em dia." icon="heroBell" />
```

> Ao usar um `icon` novo, lembre-se de registrá-lo em `provideIcons(...)` no `app.config.ts`.

---

### 5. `LoadingSkeleton` (`<app-loading-skeleton>`)

Placeholder animado (shimmer) enquanto a requisição carrega. Usado pelo `DataList`, pela Sidebar/TopBar (CPR-42) e pelos cards do Dashboard (CPR-50).

**Inputs**

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `rows` | `number` | `3` | Quantidade de linhas placeholder |
| `height` | `string` | `'1rem'` | Altura CSS de cada linha (ex: `'2.5rem'`) |

```html
@if (loading()) {
  <app-loading-skeleton [rows]="4" height="2rem" />
}
```

---

### 6. `FormField` (`<app-form-field>`)

Envolve um campo de formulário com label, marcador de obrigatório e mensagem de erro inline. Tem dois modos:

- **Padrão**: você projeta o input via `<ng-content>` (texto, email, senha, checkbox, etc.).
- **Upload** (`type="file"`): vira um dropzone com clique e drag & drop. Valida tamanho e tipo no próprio componente e avisa o usuário via `ToastService` em PT-BR; arquivos inválidos são descartados.

**Inputs**

| Input | Tipo | Padrão | Descrição |
|---|---|---|---|
| `label` (obrigatório) | `string` | - | Texto do label |
| `fieldId` (obrigatório) | `string` | - | `id` do input, associado ao label via `for` |
| `required` | `boolean` | `false` | Mostra o asterisco vermelho |
| `errorMessage` | `string` | `''` | Mensagem de erro a exibir |
| `showError` | `boolean` | `false` | Quando `true`, exibe a `errorMessage` |
| `type` | `string` | `''` | `'file'` ativa o modo upload. Qualquer outro valor usa `<ng-content>` |
| `accept` | `string` | `''` | Tipos aceitos (modo file). Ex: `'image/*,.pdf'` |
| `maxSizeMb` | `number` | `0` | Tamanho máximo por arquivo em MB. `0` = sem limite |
| `multiple` | `boolean` | `false` | Permite selecionar vários arquivos (modo file) |
| `hint` | `string` | `''` | Linha de apoio dentro do dropzone (ex: `'PNG, JPG até 5MB'`) |

**Outputs**

| Output | Payload | Quando dispara |
|---|---|---|
| `fileChange` | `File[]` | Lista atual de arquivos válidos muda (seleção, drop ou remoção). Só no modo file |

**Exemplo - campo de texto**

```html
<app-form-field label="Nome" fieldId="name" [required]="true"
  [showError]="form.controls.name.invalid && form.controls.name.touched"
  errorMessage="Campo obrigatório.">
  <input id="name" formControlName="name" class="..." />
</app-form-field>
```

**Exemplo - upload de imagem**

```html
<app-form-field label="Foto de capa" fieldId="cover" type="file"
  accept="image/png,image/jpeg,image/webp" [maxSizeMb]="5" hint="PNG, JPG ou WebP até 5MB" (fileChange)="onCover($event)" />
```

> Fotos aceitam apenas imagens (PNG, JPG, WebP) - sem PDF. O backend converte para WebP ao subir no bucket.
