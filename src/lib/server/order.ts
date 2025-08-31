import { db } from './db';
import { order, product } from './db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export interface CreateOrderParams {
	productIds: string[];
	userId: string;
}

export interface CreateOrderResult {
	success: boolean;
	order?: typeof order.$inferSelect;
	error?: string;
}

export async function createOrder({
	productIds,
	userId
}: CreateOrderParams): Promise<CreateOrderResult> {
	try {
		// Remove duplicate productIds for existence check
		const uniqueProductIds = Array.from(new Set(productIds));

		// Verify that the product exists and belongs to the user
		const productExists = await db
			.select()
			.from(product)
			.where(and(inArray(product.id, uniqueProductIds), eq(product.owner, userId)));

		if (productExists.length !== uniqueProductIds.length) {
			return {
				success: false,
				error: 'Some products not found'
			};
		}

		// Create the new order
		const newOrder = await db
			.insert(order)
			.values({
				id: crypto.randomUUID(),
				userId,
				productIds,
				fulfilled: false
			})
			.returning();

		return {
			success: true,
			order: newOrder[0]
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred'
		};
	}
}
