import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Logger } from 'nestjs-pino';
import { AppModule } from './../src/app.module';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(app.get(Logger));
    app.enableShutdownHooks();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('deve retornar 200 com status ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('environment');
        });
    });
  });

  it('deve retornar x-request-id no response quando enviado no header', () => {
    return request(app.getHttpServer())
      .get('/health')
      .set('x-request-id', 'test-e2e-123')
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-request-id']).toBe('test-e2e-123');
      });
  });

  it('deve gerar x-request-id no response quando não enviado', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-request-id']).toMatch(UUID_V4_REGEX);
      });
  });

  it('deve retornar x-request-id no response quando enviado no header', () => {
    return request(app.getHttpServer())
      .get('/health')
      .set('x-request-id', 'test-e2e-123')
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-request-id']).toBe('test-e2e-123');
      });
  });

  it('deve gerar x-request-id no response quando não enviado', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-request-id']).toMatch(UUID_V4_REGEX);
      });
  });
});
