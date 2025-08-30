import { auth } from '$lib/server/auth';
import z from 'zod';
import type { RequestHandler } from './$types';
import { orderHook, product } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

const schema = z.object({
	productId: z.string(),
	hookUrl: z.url()
});
export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}
	const json = await request.json();
	const result = schema.safeParse(json);
	if (!result.success) {
		return new Response(result.error.message, { status: 400 });
	}
	const { productId, hookUrl } = result.data;

	// generate a hook secret
	const hookSecret = crypto.randomUUID();

	// store the hook secret in the database
	await db.insert(orderHook).values({
		id: crypto.randomUUID(),
		productId,
		hookSecret,
		hookUrl
	});

	return new Response(JSON.stringify({ hookSecret }));
};

export const DELETE: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}
	const json = await request.json();
	const result = z.object({ productId: z.string() }).safeParse(json);
	if (!result.success) {
		return new Response(result.error.message, { status: 400 });
	}
	const { productId } = result.data;

	// check if the product exists
	const hooks = await db.select().from(orderHook).where(eq(orderHook.productId, productId));
	if (hooks.length === 0) {
		return new Response('Hook not found', { status: 404 });
	}
	const hook = hooks[0];
	// check if the hook is associated with the user
	const products = await db.select().from(product).where(eq(product.id, hook.productId));
	if (products.length === 0) {
		return new Response('Product not found', { status: 404 });
	}
	if (products[0].owner !== session.user.id) {
		return new Response('Unauthorized', { status: 401 });
	}

	// delete the hook
	await db.delete(orderHook).where(eq(orderHook.productId, productId));
	return new Response(JSON.stringify({ message: 'Hook deleted' }));
};
