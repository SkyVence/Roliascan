import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@/schemas/index';

const { Client } = pg;

// Create an explicit client instance
export const client = new Client({
  connectionString: process.env.DATABASE_URL!,
});

// Connect the client (important for migrations)
// We might want to handle connection errors here in a real app
await client.connect(); 

// Pass the connected client and schema to Drizzle
export const db = drizzle(client, { schema });

// Note: No longer a default export