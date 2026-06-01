import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let superAdminToken: string;

  const suffix = Date.now();

  const userId = `usr_category_${suffix}`;
  const cityId = `cit_category_${suffix}`;
  const categoryId = `cat_category_${suffix}`;
  const localId = `loc_category_${suffix}`;
  const email = `category-super-${suffix}@test.com`;

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

    await prisma.client.city.create({
      data: {
        id: cityId,
        name: `Cidade E2E ${suffix}`,
        state: 'PR',
      },
    });

    await prisma.client.category.create({
      data: {
        id: categoryId,
        name: `Categoria E2E ${suffix}`,
        icon: 'medical-cross',
      },
    });

    const superAdmin = await prisma.client.user.create({
      data: {
        id: userId,
        name: 'Super Admin',
        email,
        password: 'hash',
        role: 'ADMIN',
        cityId: null,
      },
    });

    superAdminToken = jwtService.sign({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve rejeitar delete de categoria com locais vinculados (409)', async () => {
    await prisma.client.local.create({
      data: {
        id: localId,
        name: 'Local Teste',
        description: 'Teste',
        address: 'Rua Teste',
        phone: '999999999',
        cityId,
        categoryId,
        userId,
      },
    });

    const response = await request(app.getHttpServer() as unknown as Server)
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(409);

    const body = response.body as Record<string, any>;

    expect(body.code).toBe('category_has_locals');
  });
});
