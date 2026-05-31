import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Events (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

  let jwtService: JwtService;

  let superAdminToken: string;

  let cityAdminToken: string;

  let cityId: string;

  let eventId: string;

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

    await prisma.client.event.deleteMany({
      where: {
        title: {
          contains: 'E2E',
        },
      },
    });

    await prisma.client.city.deleteMany({
      where: {
        name: 'Cidade E2E',
      },
    });

    const city = await prisma.client.city.create({
      data: {
        id: 'cit_e2e',
        name: 'Cidade E2E',
        state: 'PR',
      },
    });

    cityId = city.id;

    const superAdmin = await prisma.client.user.create({
      data: {
        id: 'usr_e2e_super',
        name: 'Super Admin',
        email: 'events-super@test.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: null,
      },
    });

    const cityAdmin = await prisma.client.user.create({
      data: {
        id: 'usr_e2e_city',
        name: 'City Admin',
        email: 'events-city@test.com',
        password: 'hash',
        role: 'ADMIN',
        cityId,
      },
    });

    superAdminToken = jwtService.sign({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });

    cityAdminToken = jwtService.sign({
      sub: cityAdmin.id,
      email: cityAdmin.email,
      role: cityAdmin.role,
      cityId,
    });
  });

  afterAll(async () => {
    await prisma.client.event.deleteMany({
      where: {
        title: {
          contains: 'E2E',
        },
      },
    });

    await prisma.client.user.deleteMany({
      where: {
        email: {
          in: ['events-super@test.com', 'events-city@test.com'],
        },
      },
    });

    await prisma.client.city.deleteMany({
      where: {
        id: cityId,
      },
    });

    await app.close();
  });

  it('should create event (POST /events)', async () => {
    const response = await request(app.getHttpServer() as unknown as Server)
      .post('/events')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        title: 'Evento E2E',
        description: 'Teste',
        type: 'cultural',
        status: 'publicado',
        eventDate: '2026-12-31T20:00:00Z',
        cityId,
      })
      .expect(201);

    const body = response.body as Record<string, any>;

    expect(body).toHaveProperty('id');

    eventId = String(body.id);
  });
});
