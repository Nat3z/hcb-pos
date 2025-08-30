import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { product } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import z from 'zod';

const productSchema = z
	.object({
		name: z.string(),
		description: z.string(),
		price: z.number()
	})
	.strict();

export const GET: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	const products = await db.select().from(product).where(eq(product.owner, session.user.id));
	return new Response(JSON.stringify(products));
};

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json();
	const parsedBody = productSchema.parse(body);
	const newProduct = await db
		.insert(product)
		.values({
			id: crypto.randomUUID(),
			name: parsedBody.name,
			description: parsedBody.description,
			price: parsedBody.price,
			owner: session.user.id
		})
		.returning();
	const productCreated = newProduct[0];

	return new Response(JSON.stringify(productCreated));
};

export const DELETE: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json();
	const id = body.id;
	if (!id) {
		return new Response('Bad Request', { status: 400 });
	}

	const deleted = await db
		.delete(product)
		.where(and(eq(product.id, id), eq(product.owner, session.user.id)))
		.returning();

	return new Response(JSON.stringify(deleted));
};
