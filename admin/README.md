# Conecta Paraná — Admin

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
npm start
```

Acesse em: `http://localhost:4200`

## Scripts disponíveis

| Script | Comando | Descrição |
|---|---|---|
| `start` | `npm start` | Dev server (porta 4200) |
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

## Decisões técnicas

- **Angular 21** com standalone components (sem NgModules)
- **Tailwind CSS 4** para estilização
- **Vite** como bundler (via `@angular/build`)
- **Vitest** para testes unitários
- **Playwright** para testes E2E
- **Stryker** para testes de mutação
- **ESLint** (`angular-eslint`) + **Prettier** para linting e formatação
- Environments Angular para staging e produção (`fileReplacements`)

## Componentes Compartilhados (Core)

Os componentes reutilizáveis ficam localizados em `src/app/shared/components/`. Aqui está um guia rápido de quando utilizar cada um:

### 1. `DataTable` (`<app-data-table>`)
*   **Finalidade**: Renderizar tabelas com paginação e ordenação server-side integradas, incluindo suporte nativo a estados de *loading* (LoadingSkeleton) e *empty* (EmptyState).
*   **Quando usar**: Para listagens principais de CRUDs que consomem a paginação do backend (`PaginatedResponseDto`). Substitui o antigo `EntityList`.

### 2. `ModalDialog` (`<app-modal-dialog>`)
*   **Finalidade**: Modal genérico estruturado para abrigar formulários complexos e conteúdos interativos. Possui suporte nativo a focus trapping, fechamento por clique no backdrop, tecla ESC e botão de fechar.
*   **Quando usar**: Para telas de criação, edição ou exibição de detalhes que requerem interação do usuário. Não possui botões de ação pré-definidos (devem ser projetados).

### 3. `ConfirmDialog` (`<app-confirm-dialog>`)
*   **Finalidade**: Modal específico e simplificado para confirmação de ações destrutivas (ex: deleção).
*   **Quando usar**: Apenas para confirmar ações sim/não rápidas, como exclusão de registros.

### 4. `EmptyState` (`<app-empty-state>`)
*   **Finalidade**: Componente visual para sinalizar a ausência de dados, exibindo um título, descrição e ícone personalizáveis.
*   **Quando usar**: Standalone ou integrado a listagens vazias.

### 5. `LoadingSkeleton` (`<app-loading-skeleton>`)
*   **Finalidade**: Exibir placeholders de carregamento com efeito animado.
*   **Quando usar**: Para simular o conteúdo de listas, tabelas ou painéis de dashboard enquanto a requisição HTTP está pendente.

### 6. `FormField` (`<app-form-field>`)
*   **Finalidade**: Container para campos de formulários com validação integrada. Suporta também upload de arquivos (`type="file"`) com restrição de tamanho, tipo e suporte a múltiplos arquivos ou drag & drop.

