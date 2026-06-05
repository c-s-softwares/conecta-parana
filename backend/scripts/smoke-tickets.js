/**
 * Smoke test -- módulo de tickets
 *
 * Pré-requisitos:
 *   - Servidor rodando em BASE_URL
 *   - Três usuários cadastrados no banco (configurar em CREDENTIALS abaixo)
 *   - cidadao.cityId deve apontar para a mesma cidade de adminCuritiba
 *   - adminMaringa.cityId deve ser diferente das outras duas
 *
 * Uso:
 *   node scripts/smoke-tickets.js
 */

const BASE_URL = 'http://localhost:3000';

const CREDENTIALS = {
  cidadao:       { email: 'citizen@test.com',          password: 'Test@1234' },
  adminCuritiba: { email: 'admin-curitiba@test.com',   password: 'Test@1234' },
  adminMaringa:  { email: 'admin-maringa@test.com',    password: 'Test@1234' },
};

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

let passed = 0;
let failed = 0;

function section(title) {
  console.log(`\n${C.bold}${C.cyan}${'─'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  ${title}${C.reset}`);
  console.log(`${C.cyan}${'─'.repeat(60)}${C.reset}`);
}

async function call(description, method, path, { token, body, expect: expectedStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  let status;
  let json;

  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    status = res.status;
    const text = await res.text();
    json = text ? JSON.parse(text) : null;
  } catch (err) {
    console.log(`${C.red}ERRO DE CONEXÃO:${C.reset} ${err.message}`);
    failed++;
    return null;
  }

  const ok = !expectedStatus || status === expectedStatus;
  const statusColor = ok ? C.green : C.red;
  const mark = ok ? '✓' : '✗';

  console.log(`\n${statusColor}${mark}${C.reset} ${C.bold}${method} ${path}${C.reset}`);
  console.log(`  ${C.gray}${description}${C.reset}`);
  console.log(`  Status: ${statusColor}${status}${C.reset}${expectedStatus ? ` (esperado ${expectedStatus})` : ''}`);

  if (json) {
    const preview = JSON.stringify(json);
    const display = preview.length > 200 ? preview.slice(0, 200) + '...' : preview;
    console.log(`  ${C.gray}${display}${C.reset}`);
  }

  if (ok) passed++; else failed++;
  return json;
}

// ---------------------------------------------------------------------------
// Script principal
// ---------------------------------------------------------------------------

async function run() {
  console.log(`\n${C.bold}Smoke test -- Tickets${C.reset}  ${C.gray}${BASE_URL}${C.reset}`);

  // -------------------------------------------------------------------------
  section('1. Autenticação');
  // -------------------------------------------------------------------------

  const loginCidadao = await call(
    'cidadão faz login',
    'POST', '/auth/login',
    { body: CREDENTIALS.cidadao, expect: 200 },
  );
  const loginAdminCuritiba = await call(
    'admin Curitiba faz login',
    'POST', '/auth/login',
    { body: CREDENTIALS.adminCuritiba, expect: 200 },
  );
  const loginAdminMaringa = await call(
    'admin Maringá faz login',
    'POST', '/auth/login',
    { body: CREDENTIALS.adminMaringa, expect: 200 },
  );

  const tokenCidadao       = loginCidadao?.access_token;
  const tokenAdminCuritiba = loginAdminCuritiba?.access_token;
  const tokenAdminMaringa  = loginAdminMaringa?.access_token;

  if (!tokenCidadao || !tokenAdminCuritiba || !tokenAdminMaringa) {
    console.log(`\n${C.red}${C.bold}Autenticação falhou -- encerrando.${C.reset}`);
    console.log('Verifique as credenciais em CREDENTIALS no topo do script.\n');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  section('2. Criação de ticket');
  // -------------------------------------------------------------------------

  await call(
    'sem token deve retornar 401',
    'POST', '/tickets',
    {
      body: { type: 'iluminação', title: 'Poste apagado', description: 'Rua sem luz há 3 dias' },
      expect: 401,
    },
  );

  await call(
    'admin não pode criar ticket (role CIDADAO exigida)',
    'POST', '/tickets',
    {
      token: tokenAdminCuritiba,
      body: { type: 'iluminação', title: 'Poste apagado', description: 'Rua sem luz há 3 dias' },
      expect: 403,
    },
  );

  await call(
    'tipo fora da lista controlada retorna invalid_type',
    'POST', '/tickets',
    {
      token: tokenCidadao,
      body: { type: 'inexistente', title: 'Poste apagado', description: 'Rua sem luz há 3 dias' },
      expect: 400,
    },
  );

  const ticketCriado = await call(
    'cidadão com cidade cria ticket com sucesso',
    'POST', '/tickets',
    {
      token: tokenCidadao,
      body: {
        type: 'iluminação',
        title: 'Poste apagado na Rua XV',
        description: 'Falta iluminação pública há 3 dias na quadra 7',
        coordinates: { lat: -25.43, lng: -49.27 },
      },
      expect: 201,
    },
  );

  const ticketId = ticketCriado?.id;

  if (!ticketId) {
    console.log(`\n${C.red}Ticket não foi criado -- encerrando.${C.reset}\n`);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  section('3. Listagem');
  // -------------------------------------------------------------------------

  await call(
    'cidadão vê apenas os próprios tickets',
    'GET', '/tickets/me',
    { token: tokenCidadao, expect: 200 },
  );

  await call(
    'admin Curitiba vê tickets da sua cidade',
    'GET', '/tickets',
    { token: tokenAdminCuritiba, expect: 200 },
  );

  await call(
    'admin Maringá vê apenas tickets da sua cidade (não os de Curitiba)',
    'GET', '/tickets',
    { token: tokenAdminMaringa, expect: 200 },
  );

  // -------------------------------------------------------------------------
  section('4. Detalhe');
  // -------------------------------------------------------------------------

  await call(
    'cidadão dono vê o próprio ticket',
    'GET', `/tickets/${ticketId}`,
    { token: tokenCidadao, expect: 200 },
  );

  await call(
    'admin da mesma cidade vê o ticket',
    'GET', `/tickets/${ticketId}`,
    { token: tokenAdminCuritiba, expect: 200 },
  );

  await call(
    'admin de outra cidade não pode ver o ticket (403)',
    'GET', `/tickets/${ticketId}`,
    { token: tokenAdminMaringa, expect: 403 },
  );

  // -------------------------------------------------------------------------
  section('5. Atualização de status');
  // -------------------------------------------------------------------------

  await call(
    'cidadão não pode alterar status (role ADMIN exigida)',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenCidadao, body: { status: 'em_análise' }, expect: 403 },
  );

  await call(
    'admin de outra cidade não pode alterar status (403)',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenAdminMaringa, body: { status: 'em_análise' }, expect: 403 },
  );

  await call(
    'admin altera status para em_análise e notificação é disparada',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenAdminCuritiba, body: { status: 'em_análise' }, expect: 200 },
  );

  await call(
    'mesmo status (em_análise → em_análise) é idempotente, sem escrita no banco',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenAdminCuritiba, body: { status: 'em_análise' }, expect: 200 },
  );

  await call(
    'transição inválida (em_análise → reaberto) retorna invalid_status_transition',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenAdminCuritiba, body: { status: 'reaberto' }, expect: 400 },
  );

  // -------------------------------------------------------------------------
  section('6. Comentários');
  // -------------------------------------------------------------------------

  await call(
    'cidadão dono adiciona comentário',
    'POST', `/tickets/${ticketId}/comments`,
    {
      token: tokenCidadao,
      body: { message: 'O problema continua, já faz uma semana.' },
      expect: 201,
    },
  );

  await call(
    'admin adiciona comentário',
    'POST', `/tickets/${ticketId}/comments`,
    {
      token: tokenAdminCuritiba,
      body: { message: 'Equipe de manutenção despachada para o local.' },
      expect: 201,
    },
  );

  await call(
    'admin de outra cidade não pode comentar (403)',
    'POST', `/tickets/${ticketId}/comments`,
    {
      token: tokenAdminMaringa,
      body: { message: 'Tentativa inválida.' },
      expect: 403,
    },
  );

  await call(
    'cidadão vê todos os comentários do ticket',
    'GET', `/tickets/${ticketId}/comments`,
    { token: tokenCidadao, expect: 200 },
  );

  await call(
    'admin vê todos os comentários do ticket',
    'GET', `/tickets/${ticketId}/comments`,
    { token: tokenAdminCuritiba, expect: 200 },
  );

  // -------------------------------------------------------------------------
  section('7. Ciclo completo de status');
  // -------------------------------------------------------------------------

  await call(
    'em_análise → resolvido (define resolvedAt)',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenAdminCuritiba, body: { status: 'resolvido' }, expect: 200 },
  );

  await call(
    'resolvido → fechado',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenAdminCuritiba, body: { status: 'fechado' }, expect: 200 },
  );

  await call(
    'fechado → reaberto (dentro de 7 dias, deve funcionar)',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenAdminCuritiba, body: { status: 'reaberto' }, expect: 200 },
  );

  await call(
    'fechado → aberto deve ser rejeitado (transição inválida)',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenAdminCuritiba, body: { status: 'fechado' }, expect: 200 },
  );

  await call(
    'fechado → aberto deve ser rejeitado (transição removida)',
    'PUT', `/tickets/${ticketId}/status`,
    { token: tokenAdminCuritiba, body: { status: 'aberto' }, expect: 400 },
  );

  // -------------------------------------------------------------------------
  section('Resultado');
  // -------------------------------------------------------------------------

  const total = passed + failed;
  const passColor = failed === 0 ? C.green : C.yellow;
  console.log(`\n  ${passColor}${C.bold}${passed}/${total} chamadas com status esperado${C.reset}`);
  if (failed > 0) {
    console.log(`  ${C.red}${C.bold}${failed} divergência(s) acima para investigar${C.reset}`);
  }
  console.log();
}

run().catch((err) => {
  console.error(`\n${C.red}Erro inesperado:${C.reset}`, err);
  process.exit(1);
});
