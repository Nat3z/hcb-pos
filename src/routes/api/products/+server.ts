import { db } from '$lib/server/db';
import { product } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { api } from '../lib';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	const userId = await api.headers(request);
	if (!userId) {
		return new Response('Unauthorized', { status: 401 });
	}

	const products = await db.select().from(product).where(eq(product.owner, userId));
	return new Response(JSON.stringify(products));
};
