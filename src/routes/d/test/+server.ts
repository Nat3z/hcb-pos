import z from 'zod';
import type { RequestHandler } from './$types';
import { orderHook, order as orderTable } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { auth } from '$lib/server/auth';

const schema = z.object({
	orderId: z.string()
});
export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}
	const userId = session.user.id;
	const json = await request.json();
	const { orderId } = schema.parse(json);
	const orders = await db
		.select()
		.from(orderTable)
		.where(and(eq(orderTable.id, orderId), eq(orderTable.userId, userId)));
	if (orders.length === 0) {
		return new Response('Order not found', { status: 404 });
	}
	const order = orders[0];
	order.fulfilled = true;
	await db.update(orderTable).set({ fulfilled: true }).where(eq(orderTable.id, orderId));

	// then send it through the webhook
	// find the associated hook for the order
	const hooks = await db.select().from(orderHook).where(eq(orderHook.productId, order.productId));

	if (!hooks || hooks.length === 0) {
		console.error(`No hook found for product ${order.productId}`);
		return new Response('No hook found', { status: 404 });
	}

	const hookResponses: { hookUrl: string; response: Response }[] = [];

	for (const hook of hooks) {
		try {
			// send a POST request to the hook with the order id
			console.log(`Sending hook request to ${hook.hookUrl}`);
			const response = await fetch(hook.hookUrl, {
				method: 'POST',
				body: JSON.stringify({ orderId: order.id, productId: order.productId }),
				headers: {
					'Content-Type': 'application/json',
					'X-Hook-Secret': hook.hookSecret
				}
			});

			if (!response.ok) {
				console.error(`Failed to send hook request: ${response.statusText}`);
			}
			const responseJson = await response.json();
			hookResponses.push({ hookUrl: hook.hookUrl, response: responseJson });
		} catch (error) {
			console.error(`Failed to send hook request: ${error}`);
		}
	}
	console.log(`✅ Order ${order.id} has been fulfilled!`);
	return new Response(JSON.stringify({ hookResponses }));
};
