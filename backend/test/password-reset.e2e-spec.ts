import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';
import { MockMailService } from '../src/modules/mail/mock-mail.service';
import { generateId } from '../src/common/utils/ulid.util';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';
import { buildTestApp } from './helpers/test-app';

describe('PasswordReset (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let mail: MockMailService;
  let cache: Cache;
  let testCityId: string;
  let api: () => ReturnType<typeof request>;

  const MOCK_USER = {
    email: 'reset-e2e@teste.com',
    name: 'Reset E2E',
    password: 'SenhaAntiga1',
  };
  const NEW_PASSWORD = 'NovaSenha1';
  const UNKNOWN_EMAIL = 'inexistente-reset-e2e@teste.com';
  const RATE_LIMIT_KEY = `forgot-password:${MOCK_USER.email}`;
  const RATE_LIMIT_KEY_UNKNOWN = `forgot-password:${UNKNOWN_EMAIL}`;

  async function ensureUser(): Promise<void> {
    await prisma.client.refreshToken.deleteMany({
      where: { user: { email: MOCK_USER.email } },
    });
    await prisma.client.passwordResetCode.deleteMany({
      where: { user: { email: MOCK_USER.email } },
    });
    await prisma.client.emailVerificationCode.deleteMany({
      where: { user: { email: MOCK_USER.email } },
    });
    await prisma.client.user.deleteMany({ where: { email: MOCK_USER.email } });

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

    await prisma.client.user.update({
      where: { email: MOCK_USER.email },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async function clearRateLimit(): Promise<void> {
    await cache.del(RATE_LIMIT_KEY);
    await cache.del(RATE_LIMIT_KEY_UNKNOWN);
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
      where: { name_state: { name: 'Cidade Reset E2E', state: 'PR' } },
      update: {},
      create: { id: testCityId, name: 'Cidade Reset E2E', state: 'PR' },
    });
    const city = await prisma.client.city.findFirst({
      where: { name: 'Cidade Reset E2E', state: 'PR', deletedAt: null },
    });
    testCityId = city!.id;
  });

  afterAll(async () => {
    await prisma.client.refreshToken.deleteMany({
      where: { user: { email: MOCK_USER.email } },
    });
    await prisma.client.passwordResetCode.deleteMany({
      where: { user: { email: MOCK_USER.email } },
    });
    await prisma.client.emailVerificationCode.deleteMany({
      where: { user: { email: MOCK_USER.email } },
    });
    await prisma.client.user.deleteMany({ where: { email: MOCK_USER.email } });
    await prisma.client.city.deleteMany({
      where: { name: 'Cidade Reset E2E', state: 'PR' },
    });
    await clearRateLimit();
    await app.close();
  });

  beforeEach(async () => {
    await clearRateLimit();
    await ensureUser();
    mail.sentEmails.length = 0;
  });

  it('POST /auth/forgot-password - envia código quando email existe', async () => {
    const response = await api()
      .post('/auth/forgot-password')
      .send({ email: MOCK_USER.email })
      .expect(200);

    expect(response.body).toEqual({
      message: 'Se o email existir, código enviado',
    });
    expect(mail.sentEmails).toHaveLength(1);
    expect(mail.sentEmails[0].method).toBe('sendPasswordResetCode');
    const params = mail.sentEmails[0].params;
    expect(params.email).toBe(MOCK_USER.email);
    expect('code' in params && params.code).toMatch(/^\d{6}$/);
  });

  it('POST /auth/forgot-password - mesma resposta quando email não existe, sem enviar email', async () => {
    const response = await api()
      .post('/auth/forgot-password')
      .send({ email: UNKNOWN_EMAIL })
      .expect(200);

    expect(response.body).toEqual({
      message: 'Se o email existir, código enviado',
    });
    expect(mail.sentEmails).toHaveLength(0);
  });

  it('POST /auth/reset-password - caminho feliz: senha trocada, nova funciona, antiga não', async () => {
    await api()
      .post('/auth/forgot-password')
      .send({ email: MOCK_USER.email })
      .expect(200);

    const code = (mail.sentEmails[0].params as { code: string }).code;

    const resetResponse = await api()
      .post('/auth/reset-password')
      .send({
        email: MOCK_USER.email,
        code,
        newPassword: NEW_PASSWORD,
      })
      .expect(200);

    expect(resetResponse.body).toEqual({ message: 'Senha alterada' });

    await api()
      .post('/auth/login')
      .send({ email: MOCK_USER.email, password: NEW_PASSWORD })
      .expect(200);

    await api()
      .post('/auth/login')
      .send({ email: MOCK_USER.email, password: MOCK_USER.password })
      .expect(401);
  });

  it('POST /auth/reset-password - código inválido retorna invalid_or_expired_code', async () => {
    await api()
      .post('/auth/forgot-password')
      .send({ email: MOCK_USER.email })
      .expect(200);

    const response = await api()
      .post('/auth/reset-password')
      .send({
        email: MOCK_USER.email,
        code: '000000',
        newPassword: NEW_PASSWORD,
      })
      .expect(400);

    const body = response.body as { code: string };
    expect(body.code).toBe('invalid_or_expired_code');
  });

  it('POST /auth/reset-password - código já usado retorna invalid_or_expired_code', async () => {
    await api()
      .post('/auth/forgot-password')
      .send({ email: MOCK_USER.email })
      .expect(200);

    const code = (mail.sentEmails[0].params as { code: string }).code;

    await api()
      .post('/auth/reset-password')
      .send({
        email: MOCK_USER.email,
        code,
        newPassword: NEW_PASSWORD,
      })
      .expect(200);

    const response = await api()
      .post('/auth/reset-password')
      .send({
        email: MOCK_USER.email,
        code,
        newPassword: 'OutraSenha1',
      })
      .expect(400);

    const body = response.body as { code: string };
    expect(body.code).toBe('invalid_or_expired_code');
  });

  it('POST /auth/reset-password - senha fraca retorna weak_password', async () => {
    await api()
      .post('/auth/forgot-password')
      .send({ email: MOCK_USER.email })
      .expect(200);

    const code = (mail.sentEmails[0].params as { code: string }).code;

    const response = await api()
      .post('/auth/reset-password')
      .send({
        email: MOCK_USER.email,
        code,
        newPassword: 'fraca',
      })
      .expect(400);

    const body = response.body as { code: string };
    expect(body.code).toBe('weak_password');
  });

  it('POST /auth/forgot-password - 4a tentativa retorna too_many_attempts', async () => {
    await api()
      .post('/auth/forgot-password')
      .send({ email: MOCK_USER.email })
      .expect(200);
    await api()
      .post('/auth/forgot-password')
      .send({ email: MOCK_USER.email })
      .expect(200);
    await api()
      .post('/auth/forgot-password')
      .send({ email: MOCK_USER.email })
      .expect(200);

    const response = await api()
      .post('/auth/forgot-password')
      .send({ email: MOCK_USER.email })
      .expect(429);

    const body = response.body as { code: string };
    expect(body.code).toBe('too_many_attempts');
  });

  it('POST /auth/register - confirmPassword diferente de password retorna validation_failed', async () => {
    const response = await api()
      .post('/auth/register')
      .send({
        name: 'Confirm Mismatch',
        email: 'confirm-mismatch@teste.com',
        password: MOCK_USER.password,
        confirmPassword: 'Outra1234',
        cityId: testCityId,
      })
      .expect(400);

    const body = response.body as { code: string; message: string[] };
    expect(body.code).toBe('validation_failed');
    expect(body.message).toContain('confirmPassword deve ser igual a password');
  });
});
