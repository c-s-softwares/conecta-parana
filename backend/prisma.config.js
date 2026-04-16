import { defineConfig } from '@prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  },
});