import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from '@prisma/client';
import { buildTestApp } from './helpers/test-app';
import { PrismaService } from '../src/config/prisma.service';
import { hash } from 'bcryptjs';

// IDs fixos para facilitar cleanup idempotente
const SUPER_ADMIN_ID = 'usr_e2e_superadmin00000000000001';
const CITY_ADMIN_ID = 'usr_e2e_cityadmin000000000000001';
const TEST_CITY_ID = 'cit_e2e00000000000000000000001';

const SUPER_ADMIN_EMAIL = 'e2e-super-admin@test.com';
const CITY_ADMIN_EMAIL = 'e2e-city-admin@test.com';
const TARGET_EMAIL = 'e2e-new-admin@test.com';

describe('AdminController (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let superAdminToken: string;
  let cityAdminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await buildTestApp(moduleFixture);
    app.enableShutdownHooks();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // ── Limpeza de dados anteriores (por email e por ID fixo) ─────────────
    await prisma.client.user.deleteMany({ where: { email: TARGET_EMAIL } });
    await prisma.client.user.deleteMany({
      where: { email: SUPER_ADMIN_EMAIL },
    });
    await prisma.client.user.deleteMany({ where: { email: CITY_ADMIN_EMAIL } });
    await prisma.client.city.deleteMany({ where: { id: TEST_CITY_ID } });

    // ── Criar cidade de teste ─────────────────────────────────────────────
    await prisma.client.city.create({
      data: { id: TEST_CITY_ID, name: 'Cidade Admin E2E', state: 'PR' },
    });

    // ── Criar Super Admin real no banco (ADMIN, cityId = null) ────────────
    const hashed = await hash('Senha123', 10);
    await prisma.client.user.create({
      data: {
        id: SUPER_ADMIN_ID,
        name: 'Super Admin E2E',
        email: SUPER_ADMIN_EMAIL,
        password: hashed,
        role: Role.ADMIN,
        cityId: null,
      },
    });

    // ── Criar Admin de cidade (ADMIN, cityId != null) ─────────────────────
    await prisma.client.user.create({
      data: {
        id: CITY_ADMIN_ID,
        name: 'City Admin E2E',
        email: CITY_ADMIN_EMAIL,
        password: hashed,
        role: Role.ADMIN,
        cityId: TEST_CITY_ID,
      },
    });

    // ── Assinar tokens JWT ────────────────────────────────────────────────
    superAdminToken = jwtService.sign({
      sub: SUPER_ADMIN_ID,
      email: SUPER_ADMIN_EMAIL,
      role: Role.ADMIN,
      cityId: null,
    });

    cityAdminToken = jwtService.sign({
      sub: CITY_ADMIN_ID,
      email: CITY_ADMIN_EMAIL,
      role: Role.ADMIN,
      cityId: TEST_CITY_ID,
    });
  });

  afterAll(async () => {
    await prisma.client.user.deleteMany({ where: { email: TARGET_EMAIL } });
    await prisma.client.user.deleteMany({ where: { email: CITY_ADMIN_EMAIL } });
    await prisma.client.user.deleteMany({
      where: { email: SUPER_ADMIN_EMAIL },
    });
    await prisma.client.city.deleteMany({ where: { id: TEST_CITY_ID } });
    await app.close();
  });

  // ── Testes do endpoint legado /admin/test ─────────────────────────────────

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

    it('deve retornar 403 para usuário com role CIDADAO', async () => {
      const token = jwtService.sign({ sub: 2, role: Role.CIDADAO });

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

  // ── Testes do novo endpoint POST /admin/users ─────────────────────────────

  describe('/admin/users (POST)', () => {
    const validBody = () => ({
      name: 'Novo Admin',
      email: TARGET_EMAIL,
      cityId: TEST_CITY_ID,
    });

    it('deve retornar 401 sem token', () => {
      return request(app.getHttpServer())
        .post('/admin/users')
        .send(validBody())
        .expect(401);
    });

    it('role_denied (403): ADMIN vinculado a cidade não é Super Admin', async () => {
      return request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${cityAdminToken}`)
        .send(validBody())
        .expect(403)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', 'super_admin_required');
        });
    });

    it('validation_failed (400): name muito curto', async () => {
      return request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'A', email: TARGET_EMAIL, cityId: TEST_CITY_ID })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', 'validation_failed');
        });
    });

    it('city_not_found (404): cityId inexistente', async () => {
      return request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Novo Admin',
          email: TARGET_EMAIL,
          cityId: 'cit_00000000000000000000000000',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', 'city_not_found');
        });
    });

    it('caminho feliz (201): Super Admin cria um ADMIN para cidade real', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validBody())
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Novo Admin',
        email: TARGET_EMAIL,
        cityId: TEST_CITY_ID,
        role: Role.ADMIN,
      });
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('emailSent');
      expect(res.body).not.toHaveProperty('password');

      // Verificar persistência no banco
      const created = await prisma.client.user.findUnique({
        where: { email: TARGET_EMAIL },
      });
      expect(created).not.toBeNull();
      expect(created?.role).toBe(Role.ADMIN);
      expect(created?.cityId).toBe(TEST_CITY_ID);
    });

    it('email_exists (409): email já em uso', async () => {
      // TARGET_EMAIL foi criado no teste anterior
      return request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(validBody())
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', 'email_exists');
        });
    });
  });
});
