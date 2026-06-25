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
- **Vite** como bundler
- **Vitest** para testes unitários
- **Playwright** para testes E2E
- **Stryker** para testes de mutação
- **ESLint** + **Prettier** para linting e formatação
