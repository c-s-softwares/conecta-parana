import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Cities (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let superAdminToken: string;
  let normalUserToken: string;
  let cityAdminToken: string;
  let testCityId: string;

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
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    await prisma.client.user.deleteMany({
      where: {
        email: {
          in: ['superadmin@test.com', 'normal@test.com', 'cityadmin@test.com'],
        },
      },
    });
    await prisma.client.city.deleteMany({
      where: { name: { in: ['Maringá', 'Curitiba', 'Londrina', 'Cascavel'] } },
    });

    const superAdmin = await prisma.client.user.create({
      data: {
        id: 'usr_superadmin',
        name: 'Super Admin',
        email: 'superadmin@test.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: null,
      },
    });

    const normalUser = await prisma.client.user.create({
      data: {
        id: 'usr_normal',
        name: 'Normal',
        email: 'normal@test.com',
        password: 'hash',
        role: 'USUARIO',
        cityId: null,
      },
    });

    superAdminToken = jwtService.sign({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });
    normalUserToken = jwtService.sign({
      sub: normalUser.id,
      email: normalUser.email,
      role: normalUser.role,
    });
  });

  afterAll(async () => {
    await prisma.client.user.deleteMany({
      where: {
        email: {
          in: ['superadmin@test.com', 'normal@test.com', 'cityadmin@test.com'],
        },
      },
    });
    await prisma.client.city.deleteMany({
      where: { name: { in: ['Maringá', 'Curitiba', 'Londrina', 'Cascavel'] } },
    });
    await app.close();
  });

  it('should create a city (POST /cities) as Super Admin', async () => {
    const response = await request(app.getHttpServer() as unknown as Server)
      .post('/cities')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Maringá', state: 'PR' })
      .expect(201);

    const body = response.body as Record<string, any>;
    expect(body).toHaveProperty('id');
    expect(body.name).toBe('Maringá');
    expect(body.state).toBe('PR');

    testCityId = String(body.id);
  });

  it('should deny create city as Normal User (403)', async () => {
    await request(app.getHttpServer() as unknown as Server)
      .post('/cities')
      .set('Authorization', `Bearer ${normalUserToken}`)
      .send({ name: 'Curitiba', state: 'PR' })
      .expect(403);
  });

  it('should deny create city as City Admin (403)', async () => {
    const cityAdmin = await prisma.client.user.create({
      data: {
        id: 'usr_cityadmin',
        name: 'City Admin',
        email: 'cityadmin@test.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: testCityId,
      },
    });
    cityAdminToken = jwtService.sign({
      sub: cityAdmin.id,
      email: cityAdmin.email,
      role: cityAdmin.role,
    });

    await request(app.getHttpServer() as unknown as Server)
      .post('/cities')
      .set('Authorization', `Bearer ${cityAdminToken}`)
      .send({ name: 'Curitiba', state: 'PR' })
      .expect(403);
  });

  it('should list cities (GET /cities) public access', async () => {
    const response = await request(app.getHttpServer() as unknown as Server)
      .get('/cities')
      .expect(200);

    const body = response.body as Record<string, any>;
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('total');
    expect(
      (body.items as Record<string, any>[]).some((c) => c.name === 'Maringá'),
    ).toBe(true);
  });

  it('should get a city by id (GET /cities/:id)', async () => {
    const response = await request(app.getHttpServer() as unknown as Server)
      .get(`/cities/${testCityId}`)
      .expect(200);

    const body = response.body as Record<string, any>;
    expect(body.id).toBe(testCityId);
    expect(body.name).toBe('Maringá');
  });

  it('should fail to create duplicate city (409)', async () => {
    await request(app.getHttpServer() as unknown as Server)
      .post('/cities')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Maringá', state: 'PR' })
      .expect(409);
  });

  it('should update a city (PATCH /cities/:id)', async () => {
    await request(app.getHttpServer() as unknown as Server)
      .patch(`/cities/${testCityId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ state: 'SP' })
      .expect(200);

    const updated = await prisma.client.city.findUnique({
      where: { id: testCityId },
    });
    expect(updated?.state).toBe('SP');
  });

  it('should fail to delete city with associated content (409)', async () => {
    await prisma.client.local
      .create({
        data: {
          id: 'loc_test',
          name: 'Local Teste',
          description: 'Teste',
          address: 'Rua X',
          phone: '123',
          cityId: testCityId,
          categoryId: 'cat_dummy',
          userId: 'usr_superadmin',
        },
      })
      .catch(async () => {
        await prisma.client.category.create({
          data: { id: 'cat_dummy', name: 'Cat', icon: 'icon' },
        });
        await prisma.client.local.create({
          data: {
            id: 'loc_test',
            name: 'Local Teste',
            description: 'Teste',
            address: 'Rua X',
            phone: '123',
            cityId: testCityId,
            categoryId: 'cat_dummy',
            userId: 'usr_superadmin',
          },
        });
      });

    const res = await request(app.getHttpServer() as unknown as Server)
      .delete(`/cities/${testCityId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(409);

    const body = res.body as Record<string, any>;
    expect(body.code).toBe('city_has_content');
    expect(body.message).toBe('Cidade possui conteúdo associado');

    await prisma.client.local.deleteMany({ where: { id: 'loc_test' } });
  });

  it('should soft delete city (DELETE /cities/:id)', async () => {
    await prisma.client.user.update({
      where: { id: 'usr_cityadmin' },
      data: { cityId: null },
    });

    await request(app.getHttpServer() as unknown as Server)
      .delete(`/cities/${testCityId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(204);

    const deletedCity = await prisma.client.city.findUnique({
      where: { id: testCityId },
    });
    expect(deletedCity?.deletedAt).not.toBeNull();
  });
});
