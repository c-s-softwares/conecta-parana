import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';
import { validationPipeConfig } from '../src/config/validation-pipe.config';

describe('Locals (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let superAdminToken: string;
  let curitibaAdminToken: string;

  const curitibaId = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9C1`;
  const maringaId = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9M1`;
  const categoryId = `${TABLE_PREFIX.CATEGORY}01HZX3Y4Q9F8TAB1C2DKEYH9C2`;

  let localCuritibaId: string;
  let localMaringaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // 1. Limpeza completa
    await prisma.client.local.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.LOCAL } },
    });
    await prisma.client.user.deleteMany({
      where: {
        email: {
          in: [
            'super@locals.com',
            'curitiba@locals.com',
            'maringa@locals.com',
            'citizen@locals.com',
          ],
        },
      },
    });
    await prisma.client.category.deleteMany({
      where: { id: categoryId },
    });
    await prisma.client.city.deleteMany({
      where: { id: { in: [curitibaId, maringaId] } },
    });

    // 2. Fixtures básicas
    await prisma.client.city.createMany({
      data: [
        { id: curitibaId, name: 'Curitiba E2E', state: 'PR' },
        { id: maringaId, name: 'Maringá E2E', state: 'PR' },
      ],
    });

    await prisma.client.category.create({
      data: { id: categoryId, name: 'Parque E2E', icon: 'icon-park' },
    });

    // 3. Usuários e Tokens
    const superAdmin = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}e2esuper`,
        name: 'Super Admin',
        email: 'super@locals.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: null,
      },
    });

    const curitibaAdmin = await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}e2ecuri`,
        name: 'Curitiba Admin',
        email: 'curitiba@locals.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: curitibaId,
      },
    });

    await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}e2emari`,
        name: 'Maringá Admin',
        email: 'maringa@locals.com',
        password: 'hash',
        role: 'ADMIN',
        cityId: maringaId,
      },
    });

    await prisma.client.user.create({
      data: {
        id: `${TABLE_PREFIX.USER}e2eciti`,
        name: 'Citizen',
        email: 'citizen@locals.com',
        password: 'hash',
        role: 'CIDADAO',
        cityId: null,
      },
    });

    superAdminToken = jwtService.sign({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });
    curitibaAdminToken = jwtService.sign({
      sub: curitibaAdmin.id,
      email: curitibaAdmin.email,
      role: curitibaAdmin.role,
      cityId: curitibaAdmin.cityId,
    });
  });

  afterAll(async () => {
    await prisma.client.local.deleteMany({
      where: { id: { startsWith: TABLE_PREFIX.LOCAL } },
    });
    await prisma.client.user.deleteMany({
      where: {
        email: {
          in: [
            'super@locals.com',
            'curitiba@locals.com',
            'maringa@locals.com',
            'citizen@locals.com',
          ],
        },
      },
    });
    await prisma.client.category.deleteMany({
      where: { id: categoryId },
    });
    await prisma.client.city.deleteMany({
      where: { id: { in: [curitibaId, maringaId] } },
    });
    await app.close();
  });

  describe('Criação (POST /locals)', () => {
    it('deve rejeitar escrita sem token (401)', async () => {
      await request(app.getHttpServer() as unknown as Server)
        .post('/locals')
        .send({
          name: 'Jardim Botânico',
          description: 'Cartão postal',
          address: 'Rua Ubaldino do Amaral',
          phone: '3221',
          cityId: curitibaId,
          categoryId: categoryId,
        })
        .expect(401);
    });

    it('deve permitir Super Admin criar local em qualquer cidade', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .post('/locals')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Catedral de Maringá',
          description: 'Catedral cônica',
          address: 'Av. Tiradentes, 1',
          phone: '443221',
          cityId: maringaId,
          categoryId: categoryId,
          latitude: -23.426,
          longitude: -51.938,
        })
        .expect(201);

      const body = response.body as Record<string, any>;
      expect(body.name).toBe('Catedral de Maringá');
      expect(body.coordinates).toEqual({ lat: -23.426, lng: -51.938 });
      localMaringaId = body.id as string;
    });

    it('deve permitir admin municipal criar local na própria cidade', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .post('/locals')
        .set('Authorization', `Bearer ${curitibaAdminToken}`)
        .send({
          name: 'Jardim Botânico',
          description: 'Estufa de vidro',
          address: 'Rua Eng. Ostoja Roguski',
          phone: '3321',
          cityId: curitibaId,
          categoryId: categoryId,
          latitude: -25.443,
          longitude: -49.239,
        })
        .expect(201);

      const body = response.body as Record<string, any>;
      expect(body.name).toBe('Jardim Botânico');
      expect(body.cityId).toBe(curitibaId);
      localCuritibaId = body.id as string;
    });

    it('deve rejeitar admin municipal criando local em outra cidade (403)', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .post('/locals')
        .set('Authorization', `Bearer ${curitibaAdminToken}`)
        .send({
          name: 'Parque do Ingá',
          description: 'Parque urbano',
          address: 'Av. Anchieta',
          phone: '123',
          cityId: maringaId,
          categoryId: categoryId,
        })
        .expect(403);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('city_scope_denied');
    });
  });

  describe('Consultas (GET /locals)', () => {
    it('deve retornar lista paginada pública de locais (200)', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .get('/locals')
        .expect(200);

      const body = response.body as Record<string, any>;
      const items = body.items as Record<string, any>[];
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items[0]).toHaveProperty('coordinates');
    });

    it('deve retornar detalhes de local público (200)', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .get(`/locals/${localCuritibaId}`)
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.name).toBe('Jardim Botânico');
      expect(body.coordinates).toEqual({ lat: -25.443, lng: -49.239 });
    });

    it('deve retornar 404 para local inexistente', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .get(`/locals/loc_01HZX3Y4Q9F8TAB1C2DKEYH9FF`)
        .expect(404);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('local_not_found');
    });
  });

  describe('Busca Geoespacial (GET /locals/nearby)', () => {
    it('deve encontrar local próximo no raio de busca', async () => {
      // Ponto de busca: exatamente no Jardim Botânico (-25.443, -49.239)
      const response = await request(app.getHttpServer() as unknown as Server)
        .get('/locals/nearby?lat=-25.443&lng=-49.239&radius=1000')
        .expect(200);

      const body = response.body as Record<string, any>;
      const items = body.items as Record<string, any>[];
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('Jardim Botânico');
      expect(items[0].distance).toBe(0);
    });

    it('deve ordenar por proximidade e incluir a distância', async () => {
      // Ponto de busca: Catedral de Maringá (-23.426, -51.938)
      // Jardim Botânico está a mais de 300km, então com raio 400.000m (400km) deve retornar ambos ordenados
      const response = await request(app.getHttpServer() as unknown as Server)
        .get('/locals/nearby?lat=-23.426&lng=-51.938&radius=45000') // Maringá está a ~0m
        .expect(200);

      const body = response.body as Record<string, any>;
      const items = body.items as Record<string, any>[];
      expect(items[0].name).toBe('Catedral de Maringá');
      expect(items[0].distance).toBeLessThan(100);
    });

    it('deve falhar se o raio for superior a 50.000m (400)', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .get('/locals/nearby?lat=-23.42&lng=-51.93&radius=55000')
        .expect(400);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('validation_failed');
    });

    it('deve falhar se as coordenadas estiverem fora da faixa (-90 a 90 / -180 a 180)', async () => {
      await request(app.getHttpServer() as unknown as Server)
        .get('/locals/nearby?lat=-95.0&lng=-51.93&radius=2000')
        .expect(400);

      await request(app.getHttpServer() as unknown as Server)
        .get('/locals/nearby?lat=-23.0&lng=-185.0&radius=2000')
        .expect(400);
    });
  });

  describe('Alteração (PUT /locals/:id)', () => {
    it('deve permitir admin municipal atualizar local da sua cidade', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .put(`/locals/${localCuritibaId}`)
        .set('Authorization', `Bearer ${curitibaAdminToken}`)
        .send({
          name: 'Jardim Botânico Alterado',
          description: 'Estufa icônica',
          address: 'Rua Eng. Ostoja Roguski',
          phone: '3321-0000',
          categoryId: categoryId,
          latitude: -25.442,
          longitude: -49.238,
        })
        .expect(200);

      const body = response.body as Record<string, any>;
      expect(body.name).toBe('Jardim Botânico Alterado');
      expect(body.coordinates).toEqual({ lat: -25.442, lng: -49.238 });
    });

    it('deve negar admin municipal atualizando local de outra cidade (403)', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .put(`/locals/${localMaringaId}`)
        .set('Authorization', `Bearer ${curitibaAdminToken}`)
        .send({
          name: 'Invasão',
        })
        .expect(403);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('city_scope_denied');
    });
  });

  describe('Remoção (DELETE /locals/:id)', () => {
    it('deve negar admin municipal deletando local de outra cidade (403)', async () => {
      const response = await request(app.getHttpServer() as unknown as Server)
        .delete(`/locals/${localMaringaId}`)
        .set('Authorization', `Bearer ${curitibaAdminToken}`)
        .expect(403);

      const body = response.body as Record<string, any>;
      expect(body.code).toBe('city_scope_denied');
    });

    it('deve permitir admin municipal deletar local da sua cidade', async () => {
      await request(app.getHttpServer() as unknown as Server)
        .delete(`/locals/${localCuritibaId}`)
        .set('Authorization', `Bearer ${curitibaAdminToken}`)
        .expect(204);

      // Valida soft-delete: findOne retorna 404 após deletado
      const responseGet = await request(
        app.getHttpServer() as unknown as Server,
      )
        .get(`/locals/${localCuritibaId}`)
        .expect(404);

      const bodyGet = responseGet.body as Record<string, any>;
      expect(bodyGet.code).toBe('local_not_found');
    });
  });
});
