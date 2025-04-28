import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { config } from './src/config/index'

export default defineConfig({
  out: './src/modules/database/migrations',
  schema: './src/modules/database/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.db.url,
  },
});
