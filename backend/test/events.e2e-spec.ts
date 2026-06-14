import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { validationPipeConfig } from '../src/config/validation-pipe.config';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';

describe('Events (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let superAdminToken: string;

  const TEST_EMAILS = ['events-super@test.com', 'events-city@test.com'];
  const cityId = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9C3`;
  const eventId = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2DKEYH9E1`;

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

    await prisma.client.event.deleteMany({
      where: { id: eventId },
    });

    await prisma.client.user.deleteMany({
      where: { email: { in: TEST_EMAILS } },
    });

    await prisma.client.city.deleteMany({
      where: { id: cityId },
    });

    await prisma.client.city.create({
      data: {
        id: cityId,
        name: 'Cidade E2E',
        state: 'PR',
      },
    });

    const superAdmin = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}e2esuper`,
        name: 'Super Admin',
        email: 'events-super@test.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: null,
      },
    });

    // City admin user created but token not strictly needed for this test

    superAdminToken = jwtService.sign({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });
  });

  afterAll(async () => {
    await prisma.client.event.deleteMany({
      where: { id: eventId },
    });

    await prisma.client.user.deleteMany({
      where: { email: { in: TEST_EMAILS } },
    });

    await prisma.client.city.deleteMany({
      where: { id: cityId },
    });

    await app.close();
  });

  it('deve retornar 409 (event_changed) quando updatedAt diverge', async () => {
    // criar evento diretamente no banco para o teste
    await prisma.client.event.create({
      data: {
        id: eventId,
        title: 'Evento E2E Lock Otimista',
        description: 'Teste',
        type: 'CULTURAL',
        status: 'SCHEDULED',
        eventDate: new Date('2026-12-31T20:00:00Z'),
        cityId,
        userId: `${TABLE_PREFIX.USER}e2esuper`,
      },
    });

    await prisma.client.$executeRaw`UPDATE events SET updated_at = '2025-01-01T10:00:00.000Z'::timestamp WHERE id = ${eventId}`;

    // simular que outro processo alterou o evento no banco
    await prisma.client.event.update({
      where: { id: eventId },
      data: { title: 'Modificado por outro processo' },
    });

    // tentar PUT com o updatedAt original (antes da alteração paralela)
    const response = await request(app.getHttpServer())
      .put(`/events/${eventId}`)
      .set(auth(superAdminToken))
      .send({
        title: 'Nova Tentativa de Update',
        updatedAt: '2025-01-01T10:00:00.000Z',
        cityId,
      })
      .expect(409);

    const body = response.body as Record<string, any>;
    expect(body.code).toBe('event_changed');
  });
});
