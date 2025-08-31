import { auth } from '$lib/server/auth';
import { createOrder } from '$lib/server/order';
import type { RequestHandler } from './$types';
import z from 'zod';

const schema = z.object({
	productIds: z.array(z.string())
});

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json();
	const resultSchema = schema.safeParse(body);
	if (!resultSchema.success) {
		return new Response(resultSchema.error.message, { status: 400 });
	}
	const productIds = resultSchema.data.productIds;
	if (!productIds) {
		return new Response('Bad Request', { status: 400 });
	}

	const result = await createOrder({
		productIds,
		userId: session.user.id
	});

	if (!result.success) {
		const status = result.error === 'Product not found' ? 404 : 500;
		return new Response(result.error, { status });
	}

	return new Response(JSON.stringify(result.order));
};
