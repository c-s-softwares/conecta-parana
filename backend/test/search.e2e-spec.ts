import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { buildTestApp } from './helpers/test-app';
import { SEARCH_ERRORS } from '../src/modules/search/search.errors';

describe('SearchController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await buildTestApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /search', () => {
    it('deve retornar erro se a query for menor que 3 caracteres (400 validation_failed se não informado, query_too_short se muito curta)', async () => {
      let response = await request(app.getHttpServer()).get('/search');
      expect(response.status).toBe(400);

      response = await request(app.getHttpServer()).get('/search?q=ab');
      expect(response.status).toBe(400);
      const body = response.body as { code: string };
      expect(body.code).toBe(SEARCH_ERRORS.QUERY_TOO_SHORT);
    });

    it('deve retornar erro se tipos inválidos forem passados', async () => {
      const response = await request(app.getHttpServer()).get(
        '/search?q=teste&types=events,invalid',
      );
      expect(response.status).toBe(400);
      const body = response.body as { code: string };
      expect(body.code).toBe(SEARCH_ERRORS.INVALID_TYPES);
    });

    it('deve realizar busca e retornar todos os grupos se types omitido', async () => {
      const response = await request(app.getHttpServer()).get(
        '/search?q=teste',
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('events');
      expect(response.body).toHaveProperty('communicates');
      expect(response.body).toHaveProperty('news');
      expect(response.body).toHaveProperty('locals');
    });

    it('deve omitir grupos não especificados em types', async () => {
      const response = await request(app.getHttpServer()).get(
        '/search?q=teste&types=locals,events',
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('locals');
      expect(response.body).toHaveProperty('events');
      expect(response.body).not.toHaveProperty('news');
      expect(response.body).not.toHaveProperty('communicates');
    });
  });
});
