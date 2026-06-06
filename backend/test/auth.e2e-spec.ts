import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { generateId } from '../src/common/utils/ulid.util';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';
import { buildTestApp } from './helpers/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshToken: string;
  let prisma: PrismaService;
  let testCityId: string;
  let api: () => ReturnType<typeof request>;

  const MOCK_TEST_USER = { email: 'e2e@teste.com', password: 'Senha123' };
  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function doLogin(
    server: App,
    email = MOCK_TEST_USER.email,
    password = MOCK_TEST_USER.password,
  ) {
    const res = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body as { access_token: string; refresh_token: string };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await buildTestApp(moduleFixture);

    api = () => request(app.getHttpServer());

    prisma = app.get<PrismaService>(PrismaService);

    // Limpar dados anteriores
    await prisma.client.refreshToken.deleteMany({
      where: { user: { email: MOCK_TEST_USER.email } },
    });
    await prisma.client.user.deleteMany({
      where: { email: MOCK_TEST_USER.email },
    });

    // criar cidade
    testCityId = generateId(TABLE_PREFIX.CITY);
    await prisma.client.city.upsert({
      where: { name_state: { name: 'Cidade E2E', state: 'PR' } },
      update: {},
      create: { id: testCityId, name: 'Cidade E2E', state: 'PR' },
    });

    // busca(upsert)
    const city = await prisma.client.city.findFirst({
      where: { name: 'Cidade E2E', state: 'PR', deletedAt: null },
    });
    testCityId = city!.id;
  });

  afterAll(async () => {
    await prisma.client.refreshToken.deleteMany({
      where: { user: { email: MOCK_TEST_USER.email } },
    });
    await prisma.client.user.deleteMany({
      where: { email: MOCK_TEST_USER.email },
    });
    await prisma.client.city.deleteMany({
      where: { name: 'Cidade E2E', state: 'PR' },
    });
    await app.close();
  });

  it('POST /auth/register — deve criar um usuário', async () => {
    const response = await api()
      .post('/auth/register')
      .send({
        name: 'Teste E2E',
        email: MOCK_TEST_USER.email,
        password: MOCK_TEST_USER.password,
        cityId: testCityId,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', MOCK_TEST_USER.email);
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('role');
  });

  it('POST /auth/register — normaliza email com trim e lowercase no check de duplicidade', async () => {
    const response = await api()
      .post('/auth/register')
      .send({
        name: 'Teste E2E',
        email: '  E2E@TESTE.COM  ',
        password: MOCK_TEST_USER.password,
        cityId: testCityId,
      })
      .expect(400);

    const body = response.body as { code: string };
    expect(body.code).toBe('registration_failed');
  });

  it('POST /auth/register —  retornar 400 sem cityId', async () => {
    const response = await api()
      .post('/auth/register')
      .send({
        name: 'Teste Sem Cidade',
        email: 'sem-cidade@teste.com',
        password: MOCK_TEST_USER.password,
      })
      .expect(400);

    const body = response.body as { code: string; message: string[] };
    expect(body.code).toBe('validation_failed');
    expect(body.message).toContain('O campo de ID da cidade é obrigatório');
  });

  it('POST /auth/register — retornar 400 com formato de cityId inválido', async () => {
    const response = await api()
      .post('/auth/register')
      .send({
        name: 'Teste Formato Invalido',
        email: 'formato-invalido@teste.com',
        password: MOCK_TEST_USER.password,
        cityId: 'invalido',
      })
      .expect(400);

    const body = response.body as { code: string; message: string[] };
    expect(body.code).toBe('validation_failed');
    expect(body.message).toContain('Formato de id inválido');
  });

  it('POST /auth/register — retornar 404 com cidade inexistente', async () => {
    const response = await api()
      .post('/auth/register')
      .send({
        name: 'Teste Cidade Inexistente',
        email: 'cidade-inexistente@teste.com',
        password: MOCK_TEST_USER.password,
        cityId: `${TABLE_PREFIX.CITY}00000000000000000000000000`,
      })
      .expect(404);

    const body = response.body as { code: string; message: string };
    expect(body.code).toBe('city_not_found');
    expect(body.message).toBe('Cidade não encontrada');
  });

  it('POST /auth/login — deve retornar tokens', async () => {
    const response = await api()
      .post('/auth/login')
      .send({
        email: MOCK_TEST_USER.email,
        password: MOCK_TEST_USER.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');

    const body = response.body as {
      access_token: string;
      refresh_token: string;
    };
    accessToken = body.access_token;
    refreshToken = body.refresh_token;
  });

  it('GET /auth/me — deve retornar dados do usuário autenticado', async () => {
    const response = await api()
      .get('/auth/me')
      .set(authHeader(accessToken))
      .expect(200);

    expect(response.body).toHaveProperty('email', MOCK_TEST_USER.email);
    expect(response.body).not.toHaveProperty('password');
  });

  it('POST /auth/refresh — deve rotacionar o token', async () => {
    const response = await api()
      .post('/auth/refresh')
      .send({ refresh_token: refreshToken })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');

    const body = response.body as { access_token: string };
    accessToken = body.access_token;
  });

  it('GET /auth/me — deve funcionar com o novo token', async () => {
    const response = await api()
      .get('/auth/me')
      .set(authHeader(accessToken))
      .expect(200);

    expect(response.body).toHaveProperty('email', MOCK_TEST_USER.email);
  });

  it('GET /auth/me — deve retornar 401 sem token', async () => {
    await api().get('/auth/me').expect(401);
  });

  it('POST /auth/register — deve retornar 400 genérico com email já cadastrado (sem revelar existência)', async () => {
    const response = await api()
      .post('/auth/register')
      .send({
        name: 'Teste E2E',
        email: MOCK_TEST_USER.email,
        password: MOCK_TEST_USER.password,
        cityId: testCityId,
      })
      .expect(400);

    const body = response.body as { code: string; message: string };
    expect(body.code).toBe('registration_failed');
    // Mensagem propositalmente genérica para evitar enumeração de emails.
    expect(body.message).not.toContain('Email');
    expect(body.message).not.toContain('cadastrado');
  });

  it('POST /auth/login — deve retornar 401 com senha errada', async () => {
    await api()
      .post('/auth/login')
      .send({
        email: MOCK_TEST_USER.email,
        password: 'SenhaErrada1',
      })
      .expect(401);
  });

  describe('Logout Endpoints', () => {
    let activeRefreshToken: string;
    let activeAccessToken: string;

    beforeEach(async () => {
      // Limpar tokens anteriores do usuário de teste para evitar colisão de iat no JWT do login
      await prisma.client.refreshToken.deleteMany({
        where: { user: { email: MOCK_TEST_USER.email } },
      });

      // Login para obter tokens frescos para cada teste
      const tokens = await doLogin(app.getHttpServer());
      activeAccessToken = tokens.access_token;
      activeRefreshToken = tokens.refresh_token;
    });

    it('POST /auth/logout — deve revogar o refresh token de forma idempotente', async () => {
      // 1. Revogar o token
      await api()
        .post('/auth/logout')
        .set(authHeader(activeAccessToken))
        .send({ refresh_token: activeRefreshToken })
        .expect(204);

      // 2. Chamar novamente para testar a idempotência (deve responder 204 sem estourar erro)
      await api()
        .post('/auth/logout')
        .set(authHeader(activeAccessToken))
        .send({ refresh_token: activeRefreshToken })
        .expect(204);

      // 3. Tentar renovar com o token revogado deve falhar com 401
      const res = await api()
        .post('/auth/refresh')
        .send({ refresh_token: activeRefreshToken })
        .expect(401);

      expect((res.body as { message: string }).message).toBe(
        'Refresh token inválido ou expirado',
      );
    });

    it('POST /auth/logout-all — deve retornar 401 se não autenticado', async () => {
      const res = await api()
        .post('/auth/logout-all')
        .send({ password: MOCK_TEST_USER.password })
        .expect(401);

      expect(res.body).toEqual({
        code: 'unauthenticated',
        message: 'Token ausente, inválido ou expirado',
      });
    });

    it('POST /auth/logout-all — deve retornar 400 se body/senha estiver ausente', async () => {
      const res = await api()
        .post('/auth/logout-all')
        .set(authHeader(activeAccessToken))
        .send({})
        .expect(400);

      expect((res.body as { code: string }).code).toBe('validation_failed');
    });

    it('POST /auth/logout-all — deve retornar 401 se a senha for inválida', async () => {
      const res = await api()
        .post('/auth/logout-all')
        .set(authHeader(activeAccessToken))
        .send({ password: 'SenhaIncorreta999' })
        .expect(401);

      expect(res.body).toEqual({
        code: 'invalid_password',
        message: 'Senha incorreta',
      });
    });

    it('POST /auth/logout-all — deve revogar todos os refresh tokens do usuário', async () => {
      // 1. Obter o ID do usuário de teste
      const user = await prisma.client.user.findUniqueOrThrow({
        where: { email: MOCK_TEST_USER.email },
      });

      // 2. Inserir manualmente um segundo refresh token ativo no banco de dados
      const refreshToken2 = 'another-mock-refresh-token-for-e2e';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.client.refreshToken.create({
        data: {
          id: generateId(TABLE_PREFIX.REFRESH_TOKEN),
          token: refreshToken2,
          userId: user.id,
          expiresAt,
        },
      });

      // 3. Chamar logout-all com a senha correta
      await api()
        .post('/auth/logout-all')
        .set(authHeader(activeAccessToken))
        .send({ password: MOCK_TEST_USER.password })
        .expect(204);

      // 4. Tentar renovar com qualquer um dos dois refresh tokens antigos deve falhar
      await api()
        .post('/auth/refresh')
        .send({ refresh_token: activeRefreshToken })
        .expect(401);

      await api()
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken2 })
        .expect(401);
    });
  });
});
