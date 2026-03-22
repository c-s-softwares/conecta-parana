# GlitchTip - APM / Error Tracking

GlitchTip é a ferramenta de monitoramento de erros do Conecta Paraná. Open-source, self-hosted, compatível com SDK do Sentry.

## Setup Local (Desenvolvimento)

### 1. Subir o GlitchTip

```bash
docker compose -f docker-compose.glitchtip.yml up -d
```

### 2. Criar superusuário (apenas no primeiro uso)

```bash
docker compose -f docker-compose.glitchtip.yml exec glitchtip-web ./manage.py createsuperuser
```

### 3. Acessar o dashboard

Abrir: **http://localhost:8080**

Login com o email e senha criados.

### 4. Criar organização e projeto (apenas no primeiro uso)

1. Criar organização: `Conecta Paraná`
2. New Project → Platform: Node.js → Nome: `backend-dev`
3. Copiar o DSN gerado

### 5. Configurar DSN

Colar o DSN no `.env` da raiz:

```env
GLITCHTIP_DSN=http://<chave>@localhost:8080/1
```

### 6. Reiniciar backend

```bash
docker compose restart backend
```

Pronto - erros do backend aparecerão no dashboard.

---

## Acesso ao GlitchTip em Staging / Produção

Os dashboards de staging e produção estão configurados na VM Oracle. Para acessar, solicite ao DevOps a liberação do seu IP na Oracle Cloud.

---

## Para Devs Backend - Como logar erros

A integração com o GlitchTip (`@sentry/nestjs`, `Sentry.init()`, global exception filter) já está configurada. Erros não-tratados são capturados automaticamente.

Para capturar erros manualmente em pontos específicos do código:

```typescript
import * as Sentry from '@sentry/nestjs';

// Capturar uma exceção com contexto
try {
  await algumaOperacao();
} catch (error) {
  Sentry.captureException(error);
  throw error; // re-throw se quiser que o NestJS trate a response
}

// Capturar uma mensagem (não é exceção, mas quer registrar)
Sentry.captureMessage('Usuário tentou acessar recurso inexistente', 'warning');

// Adicionar contexto extra a um erro
Sentry.withScope((scope) => {
  scope.setTag('modulo', 'auth');
  scope.setUser({ id: userId, email: userEmail });
  scope.setExtra('payload', requestBody);
  Sentry.captureException(error);
});
```

**Níveis disponíveis:** `'fatal'`, `'error'`, `'warning'`, `'info'`, `'debug'`

**Quando usar cada um:**
- `captureException(error)` - quando um `catch` captura um erro inesperado
- `captureMessage('...', 'warning')` - quando algo deu errado mas não é uma exceção (ex: dados inconsistentes, fallback acionado)
- Não precisa capturar erros de validação (400) ou not found (404) - esses são esperados e o exception filter já ignora HttpExceptions

---

## Comandos Úteis

```bash
# Subir
docker compose -f docker-compose.glitchtip.yml up -d

# Parar
docker compose -f docker-compose.glitchtip.yml down

# Logs
docker compose -f docker-compose.glitchtip.yml logs glitchtip-web --tail 50

# Reset completo (apaga todos os dados)
docker compose -f docker-compose.glitchtip.yml down -v
docker compose -f docker-compose.glitchtip.yml up -d
```
