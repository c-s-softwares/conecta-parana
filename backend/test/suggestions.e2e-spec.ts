import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';
import { buildTestApp } from './helpers/test-app';

describe('Suggestions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const curitibaId = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9S1`;
  const maringaId = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9S2`;

  const TEST_EMAILS = [
    'curitiba_citizen@suggestions.com',
    'maringa_citizen@suggestions.com',
    'nocity_citizen@suggestions.com',
    'curitiba_admin@suggestions.com',
    'maringa_admin@suggestions.com',
  ];
  const TEST_CITY_IDS = [curitibaId, maringaId];

  let curitibaCitizenToken: string;
  let maringaCitizenToken: string;
  let nocityCitizenToken: string;
  let curitibaAdminToken: string;
  let maringaAdminToken: string;

  let curitibaCitizenId: string;
  let curitibaAdminId: string;

  let curitibaSuggestionId: string;
  let api: () => ReturnType<typeof request>;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await buildTestApp(moduleFixture);

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    api = () => request(app.getHttpServer());

    // 1. Limpeza completa
    await prisma.client.notification.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.NOTIFICATION } },
    });
    await prisma.client.suggestion.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.SUGGESTION } },
    });
    await prisma.client.user.deleteMany({
      where: { email: { in: TEST_EMAILS } },
    });
    await prisma.client.city.deleteMany({
      where: { id: { in: TEST_CITY_IDS } },
    });

    // 2. Fixtures de cidades
    await prisma.client.city.createMany({
      data: [
        { id: curitibaId, name: 'Curitiba Suggestions', state: 'PR' },
        { id: maringaId, name: 'Maringá Suggestions', state: 'PR' },
      ],
    });

    // 3. Usuários e Tokens
    const curitibaCitizen = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}citcuri`,
        name: 'Curitiba Citizen',
        email: 'curitiba_citizen@suggestions.com',
        password: 'hash',
        role: 'CIDADAO',
        cityId: curitibaId,
      },
    });
    curitibaCitizenId = curitibaCitizen.id;

    const maringaCitizen = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}citmari`,
        name: 'Maringá Citizen',
        email: 'maringa_citizen@suggestions.com',
        password: 'hash',
        role: 'CIDADAO',
        cityId: maringaId,
      },
    });

    const nocityCitizen = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}citnoci`,
        name: 'No City Citizen',
        email: 'nocity_citizen@suggestions.com',
        password: 'hash',
        role: 'CIDADAO',
        cityId: null,
      },
    });

    const curitibaAdmin = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}admcuri`,
        name: 'Curitiba Admin',
        email: 'curitiba_admin@suggestions.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: curitibaId,
      },
    });
    curitibaAdminId = curitibaAdmin.id;

    const maringaAdmin = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}admmari`,
        name: 'Maringá Admin',
        email: 'maringa_admin@suggestions.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: maringaId,
      },
    });

    curitibaCitizenToken = jwtService.sign({
      sub: curitibaCitizen.id,
      email: curitibaCitizen.email,
      role: curitibaCitizen.role,
    });

    maringaCitizenToken = jwtService.sign({
      sub: maringaCitizen.id,
      email: maringaCitizen.email,
      role: maringaCitizen.role,
    });

    nocityCitizenToken = jwtService.sign({
      sub: nocityCitizen.id,
      email: nocityCitizen.email,
      role: nocityCitizen.role,
    });

    curitibaAdminToken = jwtService.sign({
      sub: curitibaAdmin.id,
      email: curitibaAdmin.email,
      role: curitibaAdmin.role,
      cityId: curitibaAdmin.cityId,
    });

    maringaAdminToken = jwtService.sign({
      sub: maringaAdmin.id,
      email: maringaAdmin.email,
      role: maringaAdmin.role,
      cityId: maringaAdmin.cityId,
    });
  });

  afterAll(async () => {
    await prisma.client.notification.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.NOTIFICATION } },
    });
    await prisma.client.suggestion.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.SUGGESTION } },
    });
    await prisma.client.user.deleteMany({
      where: { email: { in: TEST_EMAILS } },
    });
    await prisma.client.city.deleteMany({
      where: { id: { in: TEST_CITY_IDS } },
    });
    await app.close();
  });

  describe('Criação (POST /suggestions)', () => {
    it('deve rejeitar criação sem token (401)', async () => {
      await api()
        .post('/suggestions')
        .send({ subject: 'Test', message: 'Test' })
        .expect(401);
    });

    it('deve rejeitar cidadão sem cidade associada (400)', async () => {
      const response = await api()
        .post('/suggestions')
        .set(auth(nocityCitizenToken))
        .send({ subject: 'Test', message: 'Test' })
        .expect(400);

      const body = response.body as { code: string };
      expect(body.code).toBe('user_without_city');
    });

    it('deve rejeitar assunto superior a 200 caracteres (400)', async () => {
      const longSubject = 'A'.repeat(201);
      const response = await api()
        .post('/suggestions')
        .set(auth(curitibaCitizenToken))
        .send({ subject: longSubject, message: 'Test' })
        .expect(400);

      const body = response.body as { code: string };
      expect(body.code).toBe('subject_too_long');
    });

    it('deve rejeitar mensagem superior a 1000 caracteres (400)', async () => {
      const longMessage = 'A'.repeat(1001);
      const response = await api()
        .post('/suggestions')
        .set(auth(curitibaCitizenToken))
        .send({ subject: 'Test', message: longMessage })
        .expect(400);

      const body = response.body as { code: string };
      expect(body.code).toBe('message_too_long');
    });

    it('deve criar sugestão com sucesso para cidadão com cidade (201)', async () => {
      const response = await api()
        .post('/suggestions')
        .set(auth(curitibaCitizenToken))
        .send({
          subject: 'Praça nova',
          message: 'Seria ótimo ter uma praça no Jardim Aclimação',
        })
        .expect(201);

      const body = response.body as Record<string, any>;
      expect(body.subject).toBe('Praça nova');
      expect(body.status).toBe('enviada');
      expect(body.cityId).toBe(curitibaId);
      curitibaSuggestionId = body.id as string;
    });
  });

  describe('Listagem do Cidadão (GET /suggestions/me)', () => {
    it('deve retornar lista contendo a própria sugestão', async () => {
      const response = await api()
        .get('/suggestions/me')
        .set(auth(curitibaCitizenToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(1);
      expect(body[0].id).toBe(curitibaSuggestionId);
    });

    it('deve retornar lista vazia para cidadão de Maringá', async () => {
      const response = await api()
        .get('/suggestions/me')
        .set(auth(maringaCitizenToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(0);
    });
  });

  describe('Listagem do Admin (GET /suggestions)', () => {
    it('deve retornar lista contendo sugestão da respectiva cidade', async () => {
      const response = await api()
        .get('/suggestions')
        .set(auth(curitibaAdminToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(1);
      expect(body[0].id).toBe(curitibaSuggestionId);
    });

    it('deve retornar lista vazia para admin de Maringá', async () => {
      const response = await api()
        .get('/suggestions')
        .set(auth(maringaAdminToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(0);
    });
  });

  describe('Visualização (GET /suggestions/:id)', () => {
    it('deve negar cidadão acessar sugestão alheia (403)', async () => {
      const response = await api()
        .get(`/suggestions/${curitibaSuggestionId}`)
        .set(auth(maringaCitizenToken))
        .expect(403);

      const body = response.body as { code: string };
      expect(body.code).toBe('not_owner_or_admin');
    });

    it('deve negar admin de outra cidade acessar sugestão (403)', async () => {
      const response = await api()
        .get(`/suggestions/${curitibaSuggestionId}`)
        .set(auth(maringaAdminToken))
        .expect(403);

      const body = response.body as { code: string };
      expect(body.code).toBe('not_owner_or_admin');
    });

    it('deve permitir admin da mesma cidade ver detalhes e transicionar status para lida', async () => {
      const response = await api()
        .get(`/suggestions/${curitibaSuggestionId}`)
        .set(auth(curitibaAdminToken))
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.id).toBe(curitibaSuggestionId);
      expect(body.status).toBe('lida');

      // Verificar persistência no DB
      const dbSuggestion = await prisma.client.suggestion.findUnique({
        where: { id: curitibaSuggestionId },
      });
      expect(dbSuggestion?.status).toBe('lida');
    });
  });

  describe('Resposta (PUT /suggestions/:id/respond)', () => {
    it('deve negar admin de outra cidade responder sugestão (403)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestionId}/respond`)
        .set(auth(maringaAdminToken))
        .send({ response: 'Tentativa' })
        .expect(403);

      const body = response.body as { code: string };
      expect(body.code).toBe('not_owner_or_admin');
    });

    it('deve permitir admin responder sugestão, transicionar para respondida e disparar notificação (200)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestionId}/respond`)
        .set(auth(curitibaAdminToken))
        .send({ response: 'Obrigado, vamos avaliar.' })
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.status).toBe('respondida');
      expect(body.response).toBe('Obrigado, vamos avaliar.');
      expect(body.respondedById).toBe(curitibaAdminId);
      expect(body.respondedAt).not.toBeNull();

      // Verificar gravação da notificação no banco
      const notifications = await prisma.client.notification.findMany({
        where: { userId: curitibaCitizenId },
      });
      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toBe('Sua sugestão foi respondida!');
    });

    it('deve proibir nova resposta se a sugestão já estiver respondida (400)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestionId}/respond`)
        .set(auth(curitibaAdminToken))
        .send({ response: 'Nova tentativa' })
        .expect(400);

      const body = response.body as { code: string };
      expect(body.code).toBe('invalid_status_transition');
    });
  });

  describe('Conclusão (PUT /suggestions/:id/conclude)', () => {
    it('deve negar admin de outra cidade concluir sugestão (403)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestionId}/conclude`)
        .set(auth(maringaAdminToken))
        .send({ response: 'Tentativa' })
        .expect(403);

      const body = response.body as { code: string };
      expect(body.code).toBe('not_owner_or_admin');
    });

    it('deve permitir admin concluir sugestão, transicionar para concluída e disparar notificação (200)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestionId}/conclude`)
        .set(auth(curitibaAdminToken))
        .send({ response: 'Foi feito, a praça está pronta!' })
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.status).toBe('concluída');
      expect(body.response).toBe('Foi feito, a praça está pronta!');
      expect(body.respondedById).toBe(curitibaAdminId);

      // Verificar gravação da notificação de conclusão no banco
      const notifications = await prisma.client.notification.findMany({
        where: {
          userId: curitibaCitizenId,
          title: 'Sua sugestão foi concluída!',
        },
      });
      expect(notifications.length).toBe(1);
    });

    it('deve proibir arquivar uma sugestão já concluída (400)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestionId}/archive`)
        .set(auth(curitibaAdminToken))
        .send({ response: 'Negado pós conclusão' })
        .expect(400);

      const body = response.body as { code: string };
      expect(body.code).toBe('invalid_status_transition');
    });
  });

  describe('Arquivamento (PUT /suggestions/:id/archive)', () => {
    let curitibaSuggestion2Id: string;

    beforeAll(async () => {
      // Criar uma segunda sugestão fresca para testar o arquivamento normal
      const response = await api()
        .post('/suggestions')
        .set(auth(curitibaCitizenToken))
        .send({
          subject: 'Outra sugestão',
          message: 'Mais uma sugestão para Curitiba',
        })
        .expect(201);

      const body = response.body as Record<string, any>;
      curitibaSuggestion2Id = body.id as string;
    });

    it('deve negar admin de outra cidade arquivar (403)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestion2Id}/archive`)
        .set(auth(maringaAdminToken))
        .send({ response: 'Negativa' })
        .expect(403);

      const body = response.body as { code: string };
      expect(body.code).toBe('not_owner_or_admin');
    });

    it('deve rejeitar arquivamento sem corpo/motivo de resposta (400)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestion2Id}/archive`)
        .set(auth(curitibaAdminToken))
        .send({})
        .expect(400);

      const body = response.body as { code: string };
      expect(body.code).toBe('validation_failed');
    });

    it('deve permitir admin arquivar sugestão com sucesso (200)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestion2Id}/archive`)
        .set(auth(curitibaAdminToken))
        .send({ response: 'Não será possível no momento.' })
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.status).toBe('arquivada');
      expect(body.response).toBe('Não será possível no momento.');
    });

    it('deve ser idempotente (200) e retornar sem modificar ao re-arquivar uma sugestão já arquivada', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestion2Id}/archive`)
        .set(auth(curitibaAdminToken))
        .send({ response: 'Outra negativa que será ignorada' })
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.status).toBe('arquivada');
      expect(body.response).toBe('Não será possível no momento.'); // Deve manter a primeira resposta original
    });

    it('deve proibir qualquer transição de status a partir do arquivada (400)', async () => {
      const response = await api()
        .put(`/suggestions/${curitibaSuggestion2Id}/respond`)
        .set(auth(curitibaAdminToken))
        .send({ response: 'Nova resposta em sugestão arquivada' })
        .expect(400);

      const body = response.body as { code: string };
      expect(body.code).toBe('invalid_status_transition');
    });
  });
});
