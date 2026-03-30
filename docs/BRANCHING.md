# Estratégia de Branches

O Conecta Paraná usa um fluxo **trunk-based simplificado**. Não existe branch `develop`.

## Branch principal

- `main` — branch protegida, sempre deployável
- Nenhum push direto permitido
- Toda alteração entra via **Pull Request com aprovação**

## Branches de trabalho

Toda branch é derivada de `main` e segue o padrão:

```
tipo/CPR-XX-descricao-curta
```

Onde `CPR-XX` é o ID da tarefa no board.

### Tipos permitidos

| Tipo | Uso |
|---|---|
| `feature` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adição ou ajuste de testes |
| `chore` | Manutenção, configs, dependências |
| `ci` | Alteração em pipelines CI/CD |

### Exemplos

```
feature/CPR-21-docs-setup
fix/CPR-40-login-validation
docs/CPR-30-glossary
```

## Regras de merge

1. O PR deve ter **ao menos uma aprovação**
2. **Todos os pipelines de CI devem passar**: lint + unit + e2e (mutation futuramente)
3. Após o merge, a branch de trabalho é deletada

## Commits

Seguimos **Conventional Commits**:

```
tipo: descrição curta
```

Exemplos:

```
feature: add user registration endpoint
fix: correct geolocation query on PostGIS
docs: update setup guide
refactor: extract validation pipe to shared module
test: add e2e tests for auth flow
chore: upgrade Prisma to v7.5
ci: add mutation testing to backend pipeline
```

## Deploy

- **Staging:** deploy manual via GitHub Actions (`workflow_dispatch`)
- **Produção:** deploy automático ao mergear PR na `main`

Veja [CI_CD.md](./CI_CD.md) para detalhes dos workflows.
