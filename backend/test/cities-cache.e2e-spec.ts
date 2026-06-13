import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/config/prisma.service';
import * as bcrypt from 'bcryptjs';
import { buildTestApp } from './helpers/test-app';

const ADMIN_CREDENTIALS = {
  email: 'admin@conecta.local',
  password: 'admin123',
};

const TEST_CITY_NAMES = ['Cidade Teste Cache', 'Cidade Teste Cache Alt'];

interface CitiesResponse {
  items: Array<{ id: string; name: string }>;
}

describe('Cities Cache Invalidation (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let cacheManager: Cache;
  let adminToken: string;
  let cityId: string;

  async function cleanupTestData() {
    await prisma.client.city.deleteMany({
      where: { name: { in: TEST_CITY_NAMES } },
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await buildTestApp(moduleFixture);

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    cacheManager = moduleFixture.get<Cache>(CACHE_MANAGER);
    server = app.getHttpServer() as Server;

    // Limpa completamente o cache antes de iniciar o teste para garantir um ambiente limpo
    await cacheManager.clear();

    // Garante que o usuário administrador do seed existe no banco de testes
    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10);
    await prisma.client.user.upsert({
      where: { email: ADMIN_CREDENTIALS.email },
      update: { role: 'ADMIN', password: hashedPassword, name: 'Admin' },
      create: {
        id: 'usr_seed_admin',
        email: ADMIN_CREDENTIALS.email,
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // Limpa cidades pré-existentes de testes anteriores
    await cleanupTestData();

    // Faz login usando a rota HTTP real de auth (retorna 200)
    const loginResponse = await request(server)
      .post('/auth/login')
      .send(ADMIN_CREDENTIALS)
      .expect(200);

    const body = loginResponse.body as { access_token: string };
    adminToken = body.access_token;
  });

  afterAll(async () => {
    await cleanupTestData();
    // Limpa o cache novamente ao final para não deixar resíduos nos outros testes
    await cacheManager.clear();
    await app.close();
  });

  it('deve invalidar o cache de busca com query params após atualização de cidade', async () => {
    const citiesUrl = '/cities?page=1&pageSize=10';

    // 1. Cria a cidade de teste
    const createRes = await request(server)
      .post('/cities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: TEST_CITY_NAMES[0], state: 'PR' })
      .expect(201);

    const createBody = createRes.body as { id: string };
    cityId = createBody.id;

    // 2. Faz uma busca com query params (?page=1&pageSize=10) para gerar e colocar a rota em cache
    const firstGet = await request(server).get(citiesUrl).expect(200);

    const firstGetBody = firstGet.body as CitiesResponse;
    const firstItems = firstGetBody.items;
    const cachedCity = firstItems.find((c) => c.id === cityId);
    expect(cachedCity).toBeDefined();
    expect(cachedCity?.name).toBe(TEST_CITY_NAMES[0]);

    // 3. Atualiza a cidade via PATCH (operação de escrita que deve forçar a invalidação de cache)
    await request(server)
      .patch(`/cities/${cityId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: TEST_CITY_NAMES[1] })
      .expect(200);

    // 4. Faz a busca novamente com os mesmos query params (?page=1&pageSize=10)
    const secondGet = await request(server).get(citiesUrl).expect(200);

    // 5. Garante que os dados refletem a atualização, provando que o cache expirou/foi invalidado!
    const secondGetBody = secondGet.body as CitiesResponse;
    const secondItems = secondGetBody.items;
    const updatedCity = secondItems.find((c) => c.id === cityId);
    expect(updatedCity).toBeDefined();
    expect(updatedCity?.name).toBe(TEST_CITY_NAMES[1]);
  });
});
