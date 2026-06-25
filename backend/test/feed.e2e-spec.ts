import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/config/prisma.service';
import { TABLE_PREFIX } from '../src/common/types/ulid.types';

import { buildTestApp } from './helpers/test-app';

const FEED_BASE = '01HZX3Y4Q9F8TAB1C2DFEED';
const FEED_CITY_ID = `${TABLE_PREFIX.CITY}${FEED_BASE}CTY`;
const FEED_USER_ID = `${TABLE_PREFIX.USER}${FEED_BASE}ADM`;
const FEED_EVENT_PRIORITY_ID = `${TABLE_PREFIX.EVENT}${FEED_BASE}PR1`;
const FEED_EVENT_WINDOW_ID = `${TABLE_PREFIX.EVENT}${FEED_BASE}WND`;
const CACHE_KEY = `feed:v1:${FEED_CITY_ID}`;

const DAY_MS = 24 * 60 * 60 * 1000;

interface FeedEventItem {
  id: string;
}
interface FeedResponseBody {
  events: FeedEventItem[];
}

describe('Feed (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cacheManager: Cache;

  async function cleanupFeedFixtures(): Promise<void> {
    await prisma.client.event.deleteMany({
      where: { id: { in: [FEED_EVENT_PRIORITY_ID, FEED_EVENT_WINDOW_ID] } },
    });
    await prisma.client.user.deleteMany({
      where: { id: FEED_USER_ID },
    });
    await prisma.client.city.deleteMany({
      where: { id: FEED_CITY_ID },
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await buildTestApp(moduleFixture);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    cacheManager = moduleFixture.get<Cache>(CACHE_MANAGER);

    await cleanupFeedFixtures();
    await cacheManager.del(CACHE_KEY);

    await prisma.client.city.create({
      data: { id: FEED_CITY_ID, name: 'Feed E2E', state: 'PR' },
    });

    await prisma.client.user.create({
      data: {
        id: FEED_USER_ID,
        name: 'Feed Admin',
        email: 'feed-admin@e2e.test',
        password: 'hash',
        role: 'ADMIN',
        cityId: FEED_CITY_ID,
      },
    });

    const now = Date.now();
    await prisma.client.event.createMany({
      data: [
        {
          id: FEED_EVENT_PRIORITY_ID,
          title: 'Evento Prioritário',
          description: 'Salta para o topo do feed',
          type: 'cultural',
          isActive: true,
          priority: true,
          // Fora da janela [-1d, +7d] para provar que priority salta independente de eventDate.
          eventDate: new Date(now + 30 * DAY_MS),
          cityId: FEED_CITY_ID,
          userId: FEED_USER_ID,
        },
        {
          id: FEED_EVENT_WINDOW_ID,
          title: 'Evento da Janela',
          description: 'Dentro de [-1d, +7d]',
          type: 'cultural',
          isActive: true,
          priority: false,
          eventDate: new Date(now + 2 * DAY_MS),
          cityId: FEED_CITY_ID,
          userId: FEED_USER_ID,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanupFeedFixtures();
    await cacheManager.del(CACHE_KEY);
    await app.close();
  });

  it('ordena events com priority no topo (fora da janela) e o da janela em seguida, via SQL real', async () => {
    const response = await request(app.getHttpServer())
      .get(`/feed?cityId=${FEED_CITY_ID}`)
      .expect(200);

    const body = response.body as FeedResponseBody;

    expect(body.events.map((e) => e.id)).toEqual([
      FEED_EVENT_PRIORITY_ID,
      FEED_EVENT_WINDOW_ID,
    ]);
  });
});
