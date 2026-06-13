import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { JwtService } from '@nestjs/jwt';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';

import { TABLE_PREFIX } from '../src/common/types/ulid.types';

import { buildTestApp } from './helpers/test-app';

describe('News (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let superAdminToken: string;
  let curitibaAdminToken: string;

  const curitibaId = `${TABLE_PREFIX.CITY}newscuritiba`;
  const maringaId = `${TABLE_PREFIX.CITY}newsmaringa`;

  const TEST_EMAILS = ['super@news.com', 'curitiba@news.com'];

  const TEST_CITY_IDS = [curitibaId, maringaId];

  const VALID_PAYLOAD = {
    title: 'Vacinação amanhã',
    description: 'A vacinação ocorrerá às 08h.',
    type: 'saude',
    linkType: 'interno',
  };

  const auth = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

  let createdNewsId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await buildTestApp(moduleFixture);

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await prisma.client.news.deleteMany({
      where: {
        id: {
          startsWith: TABLE_PREFIX.NEWS,
        },
      },
    });

    await prisma.client.user.deleteMany({
      where: {
        email: {
          in: TEST_EMAILS,
        },
      },
    });

    await prisma.client.city.deleteMany({
      where: {
        id: {
          in: TEST_CITY_IDS,
        },
      },
    });

    await prisma.client.city.createMany({
      data: [
        {
          id: curitibaId,
          name: 'Curitiba E2E',
          state: 'PR',
        },
        {
          id: maringaId,
          name: 'Maringá E2E',
          state: 'PR',
        },
      ],
    });

    const superAdmin = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}news_super`,
        name: 'Super Admin',
        email: 'super@news.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: null,
      },
    });

    const curitibaAdmin = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}news_curi`,
        name: 'Curitiba Admin',
        email: 'curitiba@news.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: curitibaId,
      },
    });

    superAdminToken = jwtService.sign({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });

    curitibaAdminToken = jwtService.sign({
      sub: curitibaAdmin.id,
      email: curitibaAdmin.email,
      role: curitibaAdmin.role,
      cityId: curitibaAdmin.cityId,
    });
  });

  afterAll(async () => {
    await prisma.client.news.deleteMany({
      where: {
        id: {
          startsWith: TABLE_PREFIX.NEWS,
        },
      },
    });

    await prisma.client.user.deleteMany({
      where: {
        email: {
          in: TEST_EMAILS,
        },
      },
    });

    await prisma.client.city.deleteMany({
      where: {
        id: {
          in: TEST_CITY_IDS,
        },
      },
    });

    await app.close();
  });

  it('deve criar notícia com sucesso', async () => {
    const response = await request(app.getHttpServer())
      .post('/news')
      .set(auth(superAdminToken))
      .send({
        ...VALID_PAYLOAD,
        cityId: maringaId,
      })
      .expect(201);

    const body = response.body as Record<string, any>;

    expect(body.title).toBe(VALID_PAYLOAD.title);

    createdNewsId = body.id as string;
  });

  it('deve negar ADMIN acessando outra cidade', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/news/${createdNewsId}`)
      .set(auth(curitibaAdminToken))
      .send({
        title: 'Tentativa inválida',
      })
      .expect(403);

    const body = response.body as Record<string, any>;

    expect(body.code).toBe('city_scope_denied');
  });

  it('deve buscar noticia por id após criação', async () => {
    const response = await request(app.getHttpServer())
      .get(`/news/${createdNewsId}`)
      .expect(200);

    const body = response.body as Record<string, any>;
    expect(body.id).toBe(createdNewsId);
    expect(body.title).toBe(VALID_PAYLOAD.title);
  });

  it('deve filtrar noticias por cidade', async () => {
    await request(app.getHttpServer())
      .post('/news')
      .set(auth(curitibaAdminToken))
      .send({
        ...VALID_PAYLOAD,
        title: 'Noticia Curitiba',
        cityId: curitibaId, // Although admin uses JWT, sending it doesn't hurt or will be overridden depending on the impl. Wait, the impl throws if not matching? No, it just takes from token if admin and uses it, or uses body if superadmin.
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/news?cityId=${maringaId}`);
    if (response.status !== 200) {
      console.log('Error GET /news?cityId:', response.body);
    }
    expect(response.status).toBe(200);

    const body = response.body as { items: Record<string, any>[] };
    expect(body.items).toBeDefined();
    expect(body.items.length).toBeGreaterThan(0);
    body.items.forEach((item) => {
      expect(item.cityId).toBe(maringaId);
    });
  });

  it('deve deletar noticia via soft-delete e ocultar das listagens', async () => {
    await request(app.getHttpServer())
      .delete(`/news/${createdNewsId}`)
      .set(auth(superAdminToken))
      .expect(204);

    await request(app.getHttpServer())
      .get(`/news/${createdNewsId}`)
      .expect(404);

    const response = await request(app.getHttpServer())
      .get(`/news?cityId=${maringaId}`)
      .expect(200);

    const body = response.body as { items: Record<string, any>[] };
    const found = body.items.find((item) => item.id === createdNewsId);
    expect(found).toBeUndefined();
  });
});

