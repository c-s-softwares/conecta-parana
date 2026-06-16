import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { buildTestApp } from './helpers/test-app';

describe('Users - PUT /users/me/city (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let normalUserToken: string;
  const testUserId = 'usr_01HZX3Y4Q9F8TAB1C2DKEYH9US';
  const testCityId1 = 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MA';
  const testCityId2 = 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9PA';
  const nonExistentCityId = 'cit_00000000000000000000000000';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await buildTestApp(moduleFixture);

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Limpa dados de teste
    await prisma.client.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.client.city.deleteMany({
      where: { id: { in: [testCityId1, testCityId2] } },
    });

    // Cria cidades de teste
    await prisma.client.city.createMany({
      data: [
        { id: testCityId1, name: 'Maringá E2E', state: 'PR' },
        { id: testCityId2, name: 'Paiçandu E2E', state: 'PR' },
      ],
    });

    // Cria usuário cidadão de teste
    const user = await prisma.client.user.create({
      data: {
        id: testUserId,
        name: 'Cidadão E2E',
        email: 'e2e-cidadao-city@test.com',
        password: 'hash',
        role: 'CIDADAO',
        cityId: null,
        lastCityUpdateAt: null,
      },
    });

    normalUserToken = jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  });

  afterAll(async () => {
    await prisma.client.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.client.city.deleteMany({
      where: { id: { in: [testCityId1, testCityId2] } },
    });
    await app.close();
  });

  it('deve retornar 401 sem token de autenticação', async () => {
    await request(app.getHttpServer() as unknown as Server)
      .put('/users/me/city')
      .send({ cityId: testCityId1 })
      .expect(401);
  });

  it('deve retornar 400 validation_failed quando cityId está ausente', async () => {
    const response = await request(app.getHttpServer() as unknown as Server)
      .put('/users/me/city')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({})
      .expect(400);

    const body = response.body as { code: string; message: string[] };
    expect(body.code).toBe('validation_failed');
  });

  it('deve retornar 400 validation_failed quando cityId tem formato inválido', async () => {
    const response = await request(app.getHttpServer() as unknown as Server)
      .put('/users/me/city')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({ cityId: 'invalido' })
      .expect(400);

    const body = response.body as { code: string; message: string[] };
    expect(body.code).toBe('validation_failed');
  });

  it('deve retornar 404 city_not_found para cidade inexistente', async () => {
    const response = await request(app.getHttpServer() as unknown as Server)
      .put('/users/me/city')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({ cityId: nonExistentCityId })
      .expect(404);

    const body = response.body as { code: string; message: string };
    expect(body.code).toBe('city_not_found');
    expect(body.message).toBe('Cidade não encontrada');
  });

  it('deve atualizar a cidade do cidadão com sucesso (primeira chamada)', async () => {
    const response = await request(app.getHttpServer() as unknown as Server)
      .put('/users/me/city')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({ cityId: testCityId1 })
      .expect(200);

    const body = response.body as Record<string, any>;
    expect(body.id).toBe(testUserId);
    expect(body.cityId).toBe(testCityId1);
    expect(body.lastCityUpdateAt).toBeDefined();
  });

  it('deve retornar 429 update_too_frequent na segunda chamada em sequência rápida', async () => {
    const response = await request(app.getHttpServer() as unknown as Server)
      .put('/users/me/city')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({ cityId: testCityId2 })
      .expect(429);

    const body = response.body as { code: string; message: string };
    expect(body.code).toBe('update_too_frequent');
    expect(body.message).toBe(
      'Cidade já foi atualizada há menos de 60 segundos. Tente novamente em instantes.',
    );
  });
});
