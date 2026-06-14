import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';
import { validationPipeConfig } from '../src/config/validation-pipe.config';

describe('Categories (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let superAdminToken: string;

  const cityId = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYC1`;
  const categoryId = `${TABLE_PREFIX.CATEGORY}01HZX3Y4Q9F8TAB1C2DKEYC2`;
  const localId = `${TABLE_PREFIX.LOCAL}01HZX3Y4Q9F8TAB1C2DKEYC3`;
  const userId = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYC4`;

  const TEST_EMAILS = ['category-super@test.com'];

  const auth = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    await prisma.client.local.deleteMany({
      where: { id: localId },
    });

    await prisma.client.user.deleteMany({
      where: {
        email: {
          in: TEST_EMAILS,
        },
      },
    });

    await prisma.client.category.deleteMany({
      where: { id: categoryId },
    });

    await prisma.client.city.deleteMany({
      where: { id: cityId },
    });

    await prisma.client.city.create({
      data: {
        id: cityId,
        name: 'Cidade Category E2E',
        state: 'PR',
      },
    });

    await prisma.client.category.create({
      data: {
        id: categoryId,
        name: 'Categoria Category E2E',
        icon: 'medical-cross',
      },
    });

    const superAdmin = await prisma.client.user.create({
      data: {
        id: userId,
        name: 'Super Admin',
        email: 'category-super@test.com',
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
    await prisma.client.local.deleteMany({
      where: { id: localId },
    });

    await prisma.client.user.deleteMany({
      where: {
        email: {
          in: TEST_EMAILS,
        },
      },
    });

    await prisma.client.category.deleteMany({
      where: { id: categoryId },
    });

    await prisma.client.city.deleteMany({
      where: { id: cityId },
    });

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

    const response = await request(app.getHttpServer())
      .delete(`/categories/${categoryId}`)
      .set(auth(superAdminToken))
      .expect(409);

    const body = response.body as Record<string, any>;

    expect(body.code).toBe('category_has_locals');
  });
});
