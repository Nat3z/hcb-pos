import { auth } from '$lib/auth';
import { createOrder } from '$lib/server/order';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json();
	const productId = body.productId;
	if (!productId) {
		return new Response('Bad Request', { status: 400 });
	}

	const result = await createOrder({
		productId,
		userId: session.user.id
	});

	if (!result.success) {
		const status = result.error === 'Product not found' ? 404 : 500;
		return new Response(result.error, { status });
	}

	return new Response(JSON.stringify(result.order));
};
