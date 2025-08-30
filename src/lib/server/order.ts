import { db } from './db';
import { order, product } from './db/schema';
import { and, eq } from 'drizzle-orm';

export interface CreateOrderParams {
	productId: string;
	userId: string;
}

export interface CreateOrderResult {
	success: boolean;
	order?: typeof order.$inferSelect;
	error?: string;
}

export async function createOrder({
	productId,
	userId
}: CreateOrderParams): Promise<CreateOrderResult> {
	try {
		// Verify that the product exists and belongs to the user
		const productExists = await db
			.select()
			.from(product)
			.where(and(eq(product.id, productId), eq(product.owner, userId)));

		if (productExists.length === 0) {
			return {
				success: false,
				error: 'Product not found'
			};
		}

		// Create the new order
		const newOrder = await db
			.insert(order)
			.values({
				id: crypto.randomUUID(),
				userId,
				productId,
				fulfilled: false
			})
			.returning();

		return {
			success: true,
			order: newOrder[0]
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}
