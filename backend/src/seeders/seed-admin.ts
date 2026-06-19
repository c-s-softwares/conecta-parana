import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { generateId } from '../common/utils/ulid.util';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME;

  if (!email || !password || !name) {
    console.error(
      '[seed-admin] ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD e ADMIN_SEED_NAME são obrigatórios',
    );
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, password: hashed, name },
    create: {
      id: generateId('usr_'),
      email,
      name,
      password: hashed,
      role: Role.ADMIN,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log('[seed-admin] upserted:', user);
  console.log(`[seed-admin] email: ${email}`);
  console.log(`[seed-admin] password: ${password}`);
}

main()
  .catch((err) => {
    console.error('[seed-admin] failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
