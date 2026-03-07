import { defineConfig } from '@prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  },
});
