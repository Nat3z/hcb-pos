import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';

export let auth: ReturnType<typeof betterAuth>;

export function prepareAuth() {
	if (auth) return;
	auth = betterAuth({
		database: drizzleAdapter(db, {
			provider: 'pg'
		}),
		emailAndPassword: {
			enabled: true
		}
	});
}
