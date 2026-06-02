import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';
import { validationPipeConfig } from '../src/config/validation-pipe.config';

describe('Tickets (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const curitibaId = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9T1`;
  const maringaId = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9T2`;

  const TEST_EMAILS = [
    'curitiba_citizen@tickets.com',
    'maringa_citizen@tickets.com',
    'nocity_citizen@tickets.com',
    'curitiba_admin@tickets.com',
    'maringa_admin@tickets.com',
  ];
  const TEST_CITY_IDS = [curitibaId, maringaId];

  let curitibaCitizenToken: string;
  let maringaCitizenToken: string;
  let nocityCitizenToken: string;
  let curitibaAdminToken: string;
  let maringaAdminToken: string;

  let curitibaCitizenId: string;
  let curitibaAdminId: string;

  let curitibaTicketId: string;
  let api: () => ReturnType<typeof request>;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
    api = () => request(app.getHttpServer());

    // 1. Limpeza do banco de dados
    await prisma.client.ticketComment.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.TICKET_COMMENT } },
    });
    await prisma.client.photo.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.PHOTO } },
    });
    await prisma.client.ticket.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.TICKET } },
    });
    await prisma.client.notification.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.NOTIFICATION } },
    });
    await prisma.client.user.deleteMany({
      where: { email: { in: TEST_EMAILS } },
    });
    await prisma.client.city.deleteMany({
      where: { id: { in: TEST_CITY_IDS } },
    });

    // 2. Criação das cidades
    await prisma.client.city.createMany({
      data: [
        { id: curitibaId, name: 'Curitiba Tickets', state: 'PR' },
        { id: maringaId, name: 'Maringá Tickets', state: 'PR' },
      ],
    });

    // 3. Criação dos usuários
    const curitibaCitizen = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}tktcuricit`,
        name: 'Curitiba Citizen',
        email: 'curitiba_citizen@tickets.com',
        password: 'hash',
        role: 'CIDADAO',
        cityId: curitibaId,
      },
    });
    curitibaCitizenId = curitibaCitizen.id;

    const maringaCitizen = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}tktmaricit`,
        name: 'Maringá Citizen',
        email: 'maringa_citizen@tickets.com',
        password: 'hash',
        role: 'CIDADAO',
        cityId: maringaId,
      },
    });

    const nocityCitizen = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}tktnocicit`,
        name: 'No City Citizen',
        email: 'nocity_citizen@tickets.com',
        password: 'hash',
        role: 'CIDADAO',
        cityId: null,
      },
    });

    const curitibaAdmin = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}tktcuriadm`,
        name: 'Curitiba Admin',
        email: 'curitiba_admin@tickets.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: curitibaId,
      },
    });
    curitibaAdminId = curitibaAdmin.id;

    const maringaAdmin = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}tktmariadm`,
        name: 'Maringá Admin',
        email: 'maringa_admin@tickets.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: maringaId,
      },
    });

    // 4. Geração dos tokens JWT
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
    await prisma.client.ticketComment.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.TICKET_COMMENT } },
    });
    await prisma.client.photo.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.PHOTO } },
    });
    await prisma.client.ticket.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.TICKET } },
    });
    await prisma.client.notification.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.NOTIFICATION } },
    });
    await prisma.client.user.deleteMany({
      where: { email: { in: TEST_EMAILS } },
    });
    await prisma.client.city.deleteMany({
      where: { id: { in: TEST_CITY_IDS } },
    });
    await app.close();
  });

  describe('Criação (POST /tickets)', () => {
    it('deve rejeitar criação sem token (401)', async () => {
      await api()
        .post('/tickets')
        .send({
          type: 'iluminação',
          title: 'Rua escura',
          description: 'Falta lâmpada no poste X',
        })
        .expect(401);
    });

    it('deve rejeitar cidadão sem cidade associada (400)', async () => {
      const response = await api()
        .post('/tickets')
        .set(auth(nocityCitizenToken))
        .send({
          type: 'iluminação',
          title: 'Rua escura',
          description: 'Falta lâmpada no poste X',
        })
        .expect(400);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('user_without_city');
    });

    it('deve rejeitar tipo inválido/fora da lista (400)', async () => {
      const response = await api()
        .post('/tickets')
        .set(auth(curitibaCitizenToken))
        .send({
          type: 'invalido',
          title: 'Rua escura',
          description: 'Falta lâmpada no poste X',
        })
        .expect(400);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('invalid_type');
    });

    it('deve criar chamado com sucesso para cidadão com cidade (201)', async () => {
      const response = await api()
        .post('/tickets')
        .set(auth(curitibaCitizenToken))
        .send({
          type: 'iluminação',
          title: 'Poste queimado',
          description: 'Falta iluminação pública na quadra 12',
          coordinates: { lat: -25.43, lng: -49.27 },
        })
        .expect(201);

      const body = response.body as Record<string, any>;
      expect(body.title).toBe('Poste queimado');
      expect(body.type).toBe('iluminação');
      expect(body.status).toBe('aberto');
      expect(body.cityId).toBe(curitibaId);
      expect(body.coordinates).toEqual({ lat: -25.43, lng: -49.27 });

      curitibaTicketId = body.id as string;
    });
  });

  describe('Listagem do Cidadão (GET /tickets/me)', () => {
    it('deve retornar lista contendo o próprio chamado', async () => {
      const response = await api()
        .get('/tickets/me')
        .set(auth(curitibaCitizenToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(1);
      expect(body[0].id).toBe(curitibaTicketId);
    });

    it('deve retornar lista vazia para cidadão de Maringá', async () => {
      const response = await api()
        .get('/tickets/me')
        .set(auth(maringaCitizenToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(0);
    });
  });

  describe('Listagem do Admin (GET /tickets)', () => {
    it('deve retornar lista contendo chamados da respectiva cidade', async () => {
      const response = await api()
        .get('/tickets')
        .set(auth(curitibaAdminToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(1);
      expect(body[0].id).toBe(curitibaTicketId);
    });

    it('deve retornar lista vazia para admin de Maringá', async () => {
      const response = await api()
        .get('/tickets')
        .set(auth(maringaAdminToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(0);
    });
  });

  describe('Visualização (GET /tickets/:id)', () => {
    it('deve negar cidadão acessar chamado alheio (403)', async () => {
      const response = await api()
        .get(`/tickets/${curitibaTicketId}`)
        .set(auth(maringaCitizenToken))
        .expect(403);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('not_owner_or_admin');
    });

    it('deve negar admin de outra cidade acessar chamado (403)', async () => {
      const response = await api()
        .get(`/tickets/${curitibaTicketId}`)
        .set(auth(maringaAdminToken))
        .expect(403);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('not_owner_or_admin');
    });

    it('deve permitir admin da mesma cidade ver detalhes', async () => {
      const response = await api()
        .get(`/tickets/${curitibaTicketId}`)
        .set(auth(curitibaAdminToken))
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.id).toBe(curitibaTicketId);
    });

    it('deve permitir dono ver detalhes', async () => {
      const response = await api()
        .get(`/tickets/${curitibaTicketId}`)
        .set(auth(curitibaCitizenToken))
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.id).toBe(curitibaTicketId);
    });
  });

  describe('Mudar Status (PUT /tickets/:id/status)', () => {
    it('deve negar cidadão alterar status (403)', async () => {
      await api()
        .put(`/tickets/${curitibaTicketId}/status`)
        .set(auth(curitibaCitizenToken))
        .send({ status: 'em_análise' })
        .expect(403);
    });

    it('deve permitir admin alterar status e disparar notificação', async () => {
      const response = await api()
        .put(`/tickets/${curitibaTicketId}/status`)
        .set(auth(curitibaAdminToken))
        .send({ status: 'em_análise', assignedToId: curitibaAdminId })
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.status).toBe('em_análise');
      expect(body.assignedToId).toBe(curitibaAdminId);

      // Verifica se a notificação foi criada no banco de dados
      const notifications = await prisma.client.notification.findMany({
        where: { userId: curitibaCitizenId },
      });
      expect(notifications.length).toBe(1);
      expect(notifications[0].title).toBe('Status do seu chamado atualizado');
    });

    it('deve rejeitar transições inválidas (400)', async () => {
      const response = await api()
        .put(`/tickets/${curitibaTicketId}/status`)
        .set(auth(curitibaAdminToken))
        .send({ status: 'reaberto' }) // Reaberto não é permitido a partir do status em_análise
        .expect(400);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('invalid_status_transition');
    });
  });

  describe('Comentários (POST & GET /tickets/:id/comments)', () => {
    it('deve permitir dono adicionar comentário (201)', async () => {
      const response = await api()
        .post(`/tickets/${curitibaTicketId}/comments`)
        .set(auth(curitibaCitizenToken))
        .send({ message: 'Estou enviando mais informações.' })
        .expect(201);

      const body = response.body as Record<string, any>;
      expect(body.message).toBe('Estou enviando mais informações.');
    });

    it('deve permitir admin adicionar comentário (201)', async () => {
      const response = await api()
        .post(`/tickets/${curitibaTicketId}/comments`)
        .set(auth(curitibaAdminToken))
        .send({ message: 'Equipe de manutenção despachada.' })
        .expect(201);

      const body = response.body as Record<string, any>;
      expect(body.message).toBe('Equipe de manutenção despachada.');
    });

    it('deve permitir admin ver todos os comentários (200)', async () => {
      const response = await api()
        .get(`/tickets/${curitibaTicketId}/comments`)
        .set(auth(curitibaAdminToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(2);
      expect(body[0].message).toBe('Estou enviando mais informações.');
      expect(body[1].message).toBe('Equipe de manutenção despachada.');
    });

    it('deve permitir cidadão ver todos os comentários (200)', async () => {
      const response = await api()
        .get(`/tickets/${curitibaTicketId}/comments`)
        .set(auth(curitibaCitizenToken))
        .expect(200);

      const body = response.body as Record<string, any>[];
      expect(body.length).toBe(2);
    });
  });
});
