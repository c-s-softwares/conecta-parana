import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshToken: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await prisma.client.refreshToken.deleteMany({
      where: { user: { email: 'e2e@teste.com' } },
    });
    await prisma.client.user.deleteMany({
      where: { email: 'e2e@teste.com' },
    });
  });

  afterAll(async () => {
    await prisma.client.refreshToken.deleteMany({
      where: { user: { email: 'e2e@teste.com' } },
    });
    await prisma.client.user.deleteMany({
      where: { email: 'e2e@teste.com' },
    });
    await app.close();
  });

  it('POST /auth/register — deve criar um usuário', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Teste E2E',
        email: 'e2e@teste.com',
        password: 'senha123',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', 'e2e@teste.com');
    expect(response.body).not.toHaveProperty('password');
  });

  it('POST /auth/login — deve retornar tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'e2e@teste.com',
        password: 'senha123',
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
        password: 'senha123',
      })
      .expect(409);
  });

  it('POST /auth/login — deve retornar 401 com senha errada', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'e2e@teste.com',
        password: 'senhaerrada',
      })
      .expect(401);
  });
});
