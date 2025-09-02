import { createOrder } from '$lib/server/order';
import type { RequestHandler } from './$types';
import { api } from '../lib';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { order as orderTable } from '$lib/server/db/schema';

const schema = z.object({
	productIds: z.array(z.string())
});
export const POST: RequestHandler = async ({ request }) => {
	const json = await request.json();
	const { productIds } = schema.parse(json);
	const userId = await api.headers(request);
	if (!userId) {
		return new Response('Unauthorized', { status: 401 });
	}
	const result = await createOrder({
		productIds,
		userId
	});

	if (!result.success) {
		return new Response(result.error, { status: 500 });
	}
	return new Response(JSON.stringify(result.order));
};

export const GET: RequestHandler = async ({ url, request }) => {
	const orderId = url.searchParams.get('orderId');
	if (!orderId) {
		return new Response('Missing orderId', { status: 400 });
	}
	const userId = await api.headers(request);
	if (!userId) {
		return new Response('Unauthorized', { status: 401 });
	}
	const order = await db
		.select()
		.from(orderTable)
		.where(and(eq(orderTable.userId, userId), eq(orderTable.id, orderId)));

	if (order.length === 0) {
		return new Response('Order not found', { status: 404 });
	}

	return new Response(JSON.stringify(order[0]));
};
