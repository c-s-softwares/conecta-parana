import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { MailService, SendCodeParams } from '../src/modules/mail/mail.service';
import { MockMailService } from '../src/modules/mail/mock-mail.service';
import { generateId } from '../src/common/utils/ulid.util';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';
import { buildTestApp } from './helpers/test-app';

describe('EmailVerification (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let mail: MockMailService;
  let cache: Cache;
  let testCityId: string;
  let api: () => ReturnType<typeof request>;

  const MOCK_USER = {
    email: 'verify-e2e@teste.com',
    name: 'Verify E2E',
    password: 'SenhaForte1',
  };
  const TEST_CITY = { name: 'Cidade Verify E2E', state: 'PR' };
  const RESEND_RATE_LIMIT_KEY = `resend-verification:${MOCK_USER.email}`;

  async function clearAllUserData(): Promise<void> {
    await prisma.client.refreshToken.deleteMany({
      where: { user: { email: MOCK_USER.email } },
    });
    await prisma.client.emailVerificationCode.deleteMany({
      where: { user: { email: MOCK_USER.email } },
    });
    await prisma.client.passwordResetCode.deleteMany({
      where: { user: { email: MOCK_USER.email } },
    });
    await prisma.client.user.deleteMany({ where: { email: MOCK_USER.email } });
  }

  async function registerUser(): Promise<void> {
    await api()
      .post('/auth/register')
      .send({
        name: MOCK_USER.name,
        email: MOCK_USER.email,
        password: MOCK_USER.password,
        confirmPassword: MOCK_USER.password,
        cityId: testCityId,
      })
      .expect(200);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useClass(MockMailService)
      .compile();

    app = await buildTestApp(moduleFixture);
    api = () => request(app.getHttpServer());

    prisma = app.get<PrismaService>(PrismaService);
    mail = app.get<MailService>(MailService) as MockMailService;
    cache = app.get<Cache>(CACHE_MANAGER);

    testCityId = generateId(TABLE_PREFIX.CITY);
    await prisma.client.city.upsert({
      where: { name_state: TEST_CITY },
      update: {},
      create: { id: testCityId, ...TEST_CITY },
    });
    const city = await prisma.client.city.findFirst({
      where: { ...TEST_CITY, deletedAt: null },
    });
    testCityId = city!.id;
  });

  afterAll(async () => {
    await clearAllUserData();
    await prisma.client.city.deleteMany({ where: TEST_CITY });
    await cache.del(RESEND_RATE_LIMIT_KEY);
    await app.close();
  });

  beforeEach(async () => {
    mail.sentEmails.length = 0;
    await cache.del(RESEND_RATE_LIMIT_KEY);
    await clearAllUserData();
  });

  it('fluxo integrado: register -> verify-email -> login passa a funcionar', async () => {
    await registerUser();

    const params = mail.sentEmails[0].params as SendCodeParams;
    const code = params.code;

    await api()
      .post('/auth/verify-email')
      .send({ email: MOCK_USER.email, code })
      .expect(200);

    await api()
      .post('/auth/login')
      .send({ email: MOCK_USER.email, password: MOCK_USER.password })
      .expect(200);
  });

  it('rate limit real do resend: 4a chamada retorna 429 too_many_attempts', async () => {
    await registerUser();

    await api()
      .post('/auth/resend-verification')
      .send({ email: MOCK_USER.email })
      .expect(200);
    await api()
      .post('/auth/resend-verification')
      .send({ email: MOCK_USER.email })
      .expect(200);
    await api()
      .post('/auth/resend-verification')
      .send({ email: MOCK_USER.email })
      .expect(200);

    const response = await api()
      .post('/auth/resend-verification')
      .send({ email: MOCK_USER.email })
      .expect(429);

    const body = response.body as { code: string };
    expect(body.code).toBe('too_many_attempts');
  });
});
