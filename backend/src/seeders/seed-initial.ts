import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { generateId } from '../common/utils/ulid.util';
import { TABLE_PREFIX } from '../common/types/ulid.types';
import {
  CITIES,
  CATEGORIES,
  LOCALS,
  EVENTS,
  COMMUNICATES,
  NEWS,
  buildAdmins,
} from './data/initial';

type TransactionClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export async function runSeed(
  prisma: PrismaClient,
  { force }: { force: boolean },
): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed_disallowed_in_production');
  }

  const cityCount = await prisma.city.count();
  const userCount = await prisma.user.count();
  const hasData = cityCount > 0 || userCount > 0;

  if (hasData && !force) {
    throw new Error('seed_data_present');
  }

  const superAdminEmail =
    process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@conecta.local';
  const superAdminPassword =
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'super123';
  const superAdminId = generateId(TABLE_PREFIX.USER);

  const { superAdmin, admins } = await buildAdmins(
    superAdminId,
    superAdminEmail,
    superAdminPassword,
  );

  await prisma.$transaction(
    async (tx: TransactionClient) => {
      if (hasData && force) {
        await tx.photo.deleteMany();
        await tx.like.deleteMany();
        await tx.save.deleteMany();
        await tx.notification.deleteMany();
        await tx.event.deleteMany();
        await tx.communicate.deleteMany();
        await tx.news.deleteMany();
        await tx.local.deleteMany();
        await tx.category.deleteMany();
        await tx.user.deleteMany();
        await tx.city.deleteMany();
      }

      await tx.city.createMany({ data: CITIES });
      await tx.category.createMany({ data: CATEGORIES });
      await tx.user.createMany({ data: [superAdmin, ...admins] });

      for (const local of LOCALS) {
        const { lat, lng, ...localData } = local;
        await tx.local.create({ data: localData });
        await tx.$executeRaw`
          UPDATE locals
          SET coordinates = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
          WHERE id = ${localData.id}
        `;
      }

      await tx.event.createMany({ data: EVENTS });
      await tx.communicate.createMany({ data: COMMUNICATES });
      await tx.news.createMany({ data: NEWS });
    },
    { timeout: 30_000 },
  );

  console.log('[seed-initial] done');
  console.log(`  cities: ${CITIES.length}`);
  console.log(`  categories: ${CATEGORIES.length}`);
  console.log(`  users (admins): ${admins.length + 1}`);
  console.log(`  locals: ${LOCALS.length}`);
  console.log(`  events: ${EVENTS.length}`);
  console.log(`  communicates: ${COMMUNICATES.length}`);
  console.log(`  news: ${NEWS.length}`);

  if (
    superAdminPassword === 'super123' ||
    superAdminEmail === 'superadmin@conecta.local'
  ) {
    console.warn(
      '[seed-initial] AVISO: credenciais de super admin estao em valores padrao - TROCAR EM STAGING antes de qualquer uso real',
    );
  }
  if (force) {
    console.warn(
      '[seed-initial] AVISO: banco foi limpo e repopulado com --force',
    );
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const force = process.argv.includes('--force');

  try {
    await runSeed(prisma, { force });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'seed_data_present') {
      console.log(
        '[seed-initial] seed_data_present - banco ja tem dados. Use --force para reseeder.',
      );
      process.exit(1);
    }
    if (message === 'seed_disallowed_in_production') {
      console.error(
        '[seed-initial] seed_disallowed_in_production - seed nao pode rodar em producao.',
      );
      process.exit(1);
    }
    console.error('[seed-initial] seed_failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
