import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, client } from './db'; // Assuming db.ts exports 'db' and potentially 'client'

async function runMigrations() {
  console.log('⏳ Running migrations...');

  const start = Date.now();

  try {
    await migrate(db, { migrationsFolder: 'src/schemas/migrations' });
    console.log('✅ Migrations completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Use the imported client to end the connection
    await client.end();
    const end = Date.now();
    console.log(`⏱️ Migration finished in ${end - start}ms`);
  }
}

runMigrations(); 