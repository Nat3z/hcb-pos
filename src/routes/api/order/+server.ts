import { createOrder } from '$lib/server/order';
import type { RequestHandler } from './$types';
import { api } from '../lib';
import { z } from 'zod';

const schema = z.object({
	productId: z.string()
});
export const POST: RequestHandler = async ({ request }) => {
	const json = await request.json();
	const { productId } = schema.parse(json);
	const userId = await api.headers(request);
	if (!userId) {
		return new Response('Unauthorized', { status: 401 });
	}
	const result = await createOrder({
		productId,
		userId
	});

	if (!result.success) {
		return new Response(result.error, { status: 500 });
	}
	return new Response(JSON.stringify(result.order));
};
