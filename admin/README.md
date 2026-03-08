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
| `test` | `npm run test` | Testes unitários (Jasmine + Karma) |
| `e2e` | `npm run e2e` | Testes E2E (Playwright) |
| `test:mutation` | `npm run test:mutation` | Testes de mutação (Stryker) |
| `lint` | `npm run lint` | ESLint |
| `lint:fix` | `npm run lint:fix` | ESLint com auto-fix |
| `format` | `npm run format` | Prettier |

## Testes

```bash
npm run test              # Unitários (Jasmine + Karma)
npm run e2e               # E2E (Playwright)
npm run test:mutation     # Mutação (Stryker)
```

## Decisões técnicas

- **Angular 21** com standalone components (sem NgModules)
- **Tailwind CSS 4** para estilização
- **Vite** como bundler (via `@angular/build`)
- **Jasmine + Karma** para testes unitários
- **Playwright** para testes E2E
- **Stryker** para testes de mutação
- **ESLint** (`angular-eslint`) + **Prettier** para linting e formatação
- Environments Angular para staging e produção (`fileReplacements`)
