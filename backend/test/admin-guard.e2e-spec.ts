import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from '@prisma/client';

describe('AdminController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/admin/test (GET)', () => {
    it('deve retornar 401 quando nenhum token é fornecido', () => {
      return request(app.getHttpServer()).get('/admin/test').expect(401);
    });

    it('deve retornar 401 quando o token é inválido', () => {
      return request(app.getHttpServer())
        .get('/admin/test')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it('deve retornar 403 para usuário com role USUARIO', async () => {
      const token = jwtService.sign({ sub: 2, role: Role.USUARIO });

      return request(app.getHttpServer())
        .get('/admin/test')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('deve retornar 200 para usuário com role ADMIN', async () => {
      const token = jwtService.sign({ sub: 1, role: Role.ADMIN });

      return request(app.getHttpServer())
        .get('/admin/test')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty(
            'message',
            'Acesso admin autorizado com sucesso',
          );
        });
    });
  });
});
