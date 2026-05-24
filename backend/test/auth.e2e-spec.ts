import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { generateId } from '../src/common/utils/ulid.util';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';

import { validationPipeConfig } from '../src/config/validation-pipe.config';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshToken: string;
  let prisma: PrismaService;
  let testCityId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Limpar dados  anterioes
    await prisma.client.refreshToken.deleteMany({
      where: { user: { email: 'e2e@teste.com' } },
    });
    await prisma.client.user.deleteMany({
      where: { email: 'e2e@teste.com' },
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
      where: { user: { email: 'e2e@teste.com' } },
    });
    await prisma.client.user.deleteMany({
      where: { email: 'e2e@teste.com' },
    });
    await prisma.client.city.deleteMany({
      where: { name: 'Cidade E2E', state: 'PR' },
    });
    await app.close();
  });

  it('POST /auth/register — deve criar um usuário', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Teste E2E',
        email: 'e2e@teste.com',
        password: 'Senha123',
        cityId: testCityId,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', 'e2e@teste.com');
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('role');
  });

  it('POST /auth/register — normalizar email com trim e lowercase', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Teste E2E',
        email: '  E2E@TESTE.COM  ',
        password: 'Senha123',
        cityId: testCityId,
      })
      .expect(409);

    // 409(email ja esxite)
    const body = response.body as { code: string };
    expect(body.code).toBe('email_exists');
  });

  it('POST /auth/register —  retornar 400 sem cityId', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Teste Sem Cidade',
        email: 'sem-cidade@teste.com',
        password: 'Senha123',
      })
      .expect(400);

    const body = response.body as { code: string; message: string[] };
    expect(body.code).toBe('validation_failed');
    expect(body.message).toContain('O campo de ID da cidade é obrigatório');
  });

  it('POST /auth/register — retornar 400 com formato de cityId inválido', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Teste Formato Invalido',
        email: 'formato-invalido@teste.com',
        password: 'Senha123',
        cityId: 'invalido',
      })
      .expect(400);

    const body = response.body as { code: string; message: string[] };
    expect(body.code).toBe('validation_failed');
    expect(body.message).toContain('Formato de id inválido');
  });

  it('POST /auth/register — retornar 404 com cidade inexistente', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Teste Cidade Inexistente',
        email: 'cidade-inexistente@teste.com',
        password: 'Senha123',
        cityId: `${TABLE_PREFIX.CITY}00000000000000000000000000`,
      })
      .expect(404);

    const body = response.body as { code: string; message: string };
    expect(body.code).toBe('city_not_found');
    expect(body.message).toBe('Cidade não encontrada');
  });

  it('POST /auth/login — deve retornar tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'e2e@teste.com',
        password: 'Senha123',
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
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('email', 'e2e@teste.com');
    expect(response.body).not.toHaveProperty('password');
  });

  it('POST /auth/refresh — deve rotacionar o token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: refreshToken })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('refresh_token');

    const body = response.body as { access_token: string };
    accessToken = body.access_token;
  });

  it('GET /auth/me — deve funcionar com o novo token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('email', 'e2e@teste.com');
  });

  it('GET /auth/me — deve retornar 401 sem token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('POST /auth/register — deve retornar 409 com email duplicado', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Teste E2E',
        email: 'e2e@teste.com',
        password: 'Senha123',
        cityId: testCityId,
      })
      .expect(409);
  });

  it('POST /auth/login — deve retornar 401 com senha errada', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'e2e@teste.com',
        password: 'SenhaErrada1',
      })
      .expect(401);
  });
});
