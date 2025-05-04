import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@/lib/db/schema/schema';

let pool;

try {
  // Try to create a pool using the DATABASE_URL environment variable
  if (process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Make sure the password is parsed correctly by pg
      ssl: process.env.DB_SSL === 'true' ? true : false,
    });
  } else {
    // Fallback to using individual connection parameters
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? true : false,
    });
  }

  // Test the connection
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
} catch (error) {
  console.error('Failed to create database pool:', error);
  throw error;
}

// Create drizzle instance using the pool
const db = drizzle(pool, { schema, logger: true });

export default db;
