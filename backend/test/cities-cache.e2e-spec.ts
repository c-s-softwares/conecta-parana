import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/config/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Cities Cache Invalidation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cacheManager: Cache;
  let adminToken: string;
  let cityId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    cacheManager = moduleFixture.get<Cache>(CACHE_MANAGER);
    await app.init();

    // Limpa completamente o cache antes de iniciar o teste para garantir um ambiente limpo
    await cacheManager.clear();

    // Garante que o usuário administrador do seed existe no banco de testes
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.client.user.upsert({
      where: { email: 'admin@conecta.local' },
      update: { role: 'ADMIN', password: hashedPassword, name: 'Admin' },
      create: {
        id: 'usr_seed_admin',
        email: 'admin@conecta.local',
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // Limpa cidades pré-existentes de testes anteriores
    await prisma.client.city.deleteMany({
      where: { name: { in: ['Cidade Teste Cache', 'Cidade Teste Cache Alt'] } },
    });

    // Faz login usando a rota HTTP real de auth (retorna 200)
    const loginResponse = await request(
      app.getHttpServer() as unknown as Server,
    )
      .post('/auth/login')
      .send({ email: 'admin@conecta.local', password: 'admin123' })
      .expect(200);

    const body = loginResponse.body as { access_token: string };
    adminToken = body.access_token;
  });

  afterAll(async () => {
    await prisma.client.city.deleteMany({
      where: { name: { in: ['Cidade Teste Cache', 'Cidade Teste Cache Alt'] } },
    });
    // Limpa o cache novamente ao final para não deixar resíduos nos outros testes
    await cacheManager.clear();
    await app.close();
  });

  it('deve invalidar o cache de busca com query params após atualização de cidade', async () => {
    // 1. Cria a cidade de teste
    const createRes = await request(app.getHttpServer() as unknown as Server)
      .post('/cities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cidade Teste Cache', state: 'PR' })
      .expect(201);

    const createBody = createRes.body as { id: string };
    cityId = createBody.id;

    // 2. Faz uma busca com query params (?page=1&pageSize=10) para gerar e colocar a rota em cache
    const firstGet = await request(app.getHttpServer() as unknown as Server)
      .get('/cities?page=1&pageSize=10')
      .expect(200);

    const firstGetBody = firstGet.body as {
      items: Array<{ id: string; name: string }>;
    };
    const firstItems = firstGetBody.items;
    const cachedCity = firstItems.find((c) => c.id === cityId);
    expect(cachedCity).toBeDefined();
    expect(cachedCity?.name).toBe('Cidade Teste Cache');

    // 3. Atualiza a cidade via PATCH (operação de escrita que deve forçar a invalidação de cache)
    await request(app.getHttpServer() as unknown as Server)
      .patch(`/cities/${cityId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cidade Teste Cache Alt' })
      .expect(200);

    // 4. Faz a busca novamente com os mesmos query params (?page=1&pageSize=10)
    const secondGet = await request(app.getHttpServer() as unknown as Server)
      .get('/cities?page=1&pageSize=10')
      .expect(200);

    // 5. Garante que os dados refletem a atualização, provando que o cache expirou/foi invalidado!
    const secondGetBody = secondGet.body as {
      items: Array<{ id: string; name: string }>;
    };
    const secondItems = secondGetBody.items;
    const updatedCity = secondItems.find((c) => c.id === cityId);
    expect(updatedCity).toBeDefined();
    expect(updatedCity?.name).toBe('Cidade Teste Cache Alt');
  });
});
