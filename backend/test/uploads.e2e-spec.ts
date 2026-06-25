import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import sharp from 'sharp';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';
import { StorageService } from '../src/modules/storage/storage.service';
import { buildTestApp } from './helpers/test-app';

// --------------------- IDs / constantes da fixture ---------------------
const CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYU01`;
const OTHER_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYU02`;
const ADMIN_ID = `${TABLE_PREFIX.USER}e2euploadsadm`;
const CIDADAO_ID = `${TABLE_PREFIX.USER}e2euploadscit`;
const EVENT_ID = `${TABLE_PREFIX.EVENT}01HZX3Y4Q9F8TAB1C2UPLD001`;
const TICKET_ID = 'tkt_01HZX3Y4Q9F8TAB1C2UPLDTKT01';

const TEST_EMAILS = ['admin@uploads.e2e', 'cidadao@uploads.e2e'];

const FAKE_BUCKET_BASE = 'https://fake-bucket.example.com';
const fakeUrl = (key: string) => `${FAKE_BUCKET_BASE}/o/${key}`;

// JPEG mínimo válido gerado em runtime pelo sharp (4x4 px branco). Evita
// buffer literal gigante no spec e ainda exercita o pipeline real do sharp
// no service. Promovido a constante via beforeAll para reuso entre testes.
let tinyJpeg: Buffer;

describe('Uploads (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let storageMock: {
    upload: jest.Mock;
    delete: jest.Mock;
    getSignedUrl: jest.Mock;
  };

  let adminToken: string;
  let cidadaoToken: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  /**
   * Helper para fazer upload sem repetir o boilerplate de field/attach em
   * cada teste. Token e payload variam; arquivo é sempre o tinyJpeg.
   */
  const uploadPhoto = (
    token: string,
    entityType: string,
    entityId?: string,
  ) => {
    const req = request(app.getHttpServer())
      .post('/uploads/photos')
      .field('entityType', entityType)
      .attach('file', tinyJpeg, {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      });
    if (token) {
      req.set(auth(token));
    }
    if (entityId !== undefined) {
      req.field('entityId', entityId);
    }
    return req;
  };

  const cleanupDb = async () => {
    await prisma.client.photo.deleteMany({
      where: {
        OR: [
          { eventId: EVENT_ID },
          { ticketId: TICKET_ID },
          { userId: { in: [ADMIN_ID, CIDADAO_ID] } },
        ],
      },
    });
    await prisma.client.ticket.deleteMany({ where: { id: TICKET_ID } });
    await prisma.client.event.deleteMany({ where: { id: EVENT_ID } });
    await prisma.client.user.deleteMany({
      where: { email: { in: TEST_EMAILS } },
    });
    await prisma.client.city.deleteMany({
      where: { id: { in: [CITY_ID, OTHER_CITY_ID] } },
    });
  };

  beforeAll(async () => {
    tinyJpeg = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    storageMock = {
      upload: jest.fn((key: string) => Promise.resolve(fakeUrl(key))),
      delete: jest.fn(() => Promise.resolve()),
      getSignedUrl: jest.fn((key: string) => Promise.resolve(fakeUrl(key))),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue(storageMock)
      .compile();

    app = await buildTestApp(moduleFixture);

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await cleanupDb();

    await prisma.client.city.createMany({
      data: [
        { id: CITY_ID, name: 'Uploads E2E', state: 'PR' },
        { id: OTHER_CITY_ID, name: 'Uploads E2E Outra', state: 'PR' },
      ],
    });

    const admin = await prisma.client.user.create({
      data: {
        id: ADMIN_ID,
        name: 'Admin Uploads',
        email: 'admin@uploads.e2e',
        password: 'hash',
        role: 'ADMIN',
        cityId: CITY_ID,
      },
    });

    const cidadao = await prisma.client.user.create({
      data: {
        id: CIDADAO_ID,
        name: 'Cidadão Uploads',
        email: 'cidadao@uploads.e2e',
        password: 'hash',
        role: 'CIDADAO',
        cityId: CITY_ID,
      },
    });

    await prisma.client.event.create({
      data: {
        id: EVENT_ID,
        title: 'Evento Uploads E2E',
        description: 'Descrição',
        type: 'cultural',
        isActive: true,
        eventDate: new Date('2026-12-01T00:00:00Z'),
        cityId: CITY_ID,
        userId: admin.id,
      },
    });

    await prisma.client.ticket.create({
      data: {
        id: TICKET_ID,
        title: 'Ticket Uploads E2E',
        description: 'Descrição',
        type: 'iluminação',
        status: 'aberto',
        cityId: CITY_ID,
        userId: cidadao.id,
      },
    });

    adminToken = jwtService.sign({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      cityId: admin.cityId,
    });
    cidadaoToken = jwtService.sign({
      sub: cidadao.id,
      email: cidadao.email,
      role: cidadao.role,
      cityId: cidadao.cityId,
    });
  });

  beforeEach(() => {
    storageMock.upload.mockClear();
    storageMock.delete.mockClear();
  });

  afterAll(async () => {
    await cleanupDb();
    await app.close();
  });

  describe('POST /uploads/photos', () => {
    it('happy path: ADMIN faz upload em event - 201 + persistência + 2 uploads no storage', async () => {
      const response = await uploadPhoto(adminToken, 'event', EVENT_ID).expect(
        201,
      );

      const body = response.body as {
        id: string;
        url: string;
        thumbUrl: string;
        entityType: string;
        entityId: string;
      };

      expect(body.entityType).toBe('event');
      expect(body.entityId).toBe(EVENT_ID);
      expect(body.id).toMatch(new RegExp(`^${TABLE_PREFIX.PHOTO}`));
      expect(body.url).toContain(FAKE_BUCKET_BASE);
      expect(body.thumbUrl).toContain('-thumb.webp');
      expect(storageMock.upload).toHaveBeenCalledTimes(2);

      const persisted = await prisma.client.photo.findUnique({
        where: { id: body.id },
      });
      expect(persisted).not.toBeNull();
      expect(persisted!.eventId).toBe(EVENT_ID);
      expect(persisted!.localId).toBeNull();
      expect(persisted!.ticketId).toBeNull();
      expect(persisted!.userId).toBe(ADMIN_ID);
    });

    it('ticket: CIDADAO faz upload com entityId arbitrário e Photo é persistida com ticketId (modelo virá em CPR-215)', async () => {
      const response = await uploadPhoto(
        cidadaoToken,
        'ticket',
        TICKET_ID,
      ).expect(201);

      const body = response.body as {
        id: string;
        entityType: string;
        entityId: string;
      };
      expect(body.entityType).toBe('ticket');
      expect(body.entityId).toBe(TICKET_ID);

      const persisted = await prisma.client.photo.findUnique({
        where: { id: body.id },
      });
      expect(persisted).not.toBeNull();
      expect(persisted!.ticketId).toBe(TICKET_ID);
      expect(persisted!.eventId).toBeNull();
      expect(persisted!.localId).toBeNull();
      expect(persisted!.userId).toBe(CIDADAO_ID);
    });

    it('401 sem token', async () => {
      await uploadPhoto('', 'event', EVENT_ID).expect(401);
    });
  });
});
