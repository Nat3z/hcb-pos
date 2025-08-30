import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export let db: ReturnType<typeof drizzle>;

export function prepareDb(env: { DATABASE_URL: string }): ReturnType<typeof drizzle> {
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	if (db) return db;

	const client = postgres(env.DATABASE_URL);

	db = drizzle(client, { schema });
	return db;
}
