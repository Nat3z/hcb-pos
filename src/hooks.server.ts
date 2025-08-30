import { auth, prepareAuth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { prepareDb } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

export const handler = (h: () => void): Handle => {
	return ({ event, resolve }) => {
		h();
		return resolve(event);
	};
};
export const handle = sequence(
	handler(() =>
		prepareDb({
			DATABASE_URL: env.DATABASE_URL!
		})
	),
	handler(() => prepareAuth()),

	({ event, resolve }) => svelteKitHandler({ event, resolve, auth, building })
);
