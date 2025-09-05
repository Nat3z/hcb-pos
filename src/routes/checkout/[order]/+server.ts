import { db } from '$lib/server/db';
import {
	hcbOrganization as hcbOrganizationTable,
	order as orderTable,
	product as productTable,
	user
} from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url: rawUrl }) => {
	const orderId = params.order;
	// get the query param "returnTo"
	const returnTo = rawUrl.searchParams.get('returnTo') ?? '';

	// Fetch the order and all associated products
	const orderRows = await db
		.select({
			orderId: orderTable.id,
			hcbOrganizationId: hcbOrganizationTable.id,
			productId: productTable.id,
			productPrice: productTable.price,
			productIds: orderTable.productIds
		})
		.from(orderTable)
		.innerJoin(productTable, sql`${productTable.id} = ANY(${orderTable.productIds})`)
		.innerJoin(user, eq(user.id, orderTable.userId))
		.innerJoin(hcbOrganizationTable, eq(hcbOrganizationTable.userId, user.id))
		.where(eq(orderTable.id, orderId));

	if (orderRows.length === 0) {
		return new Response('Order not found', { status: 404 });
	}

	// Ensure all productIds in the order have a matching product
	const orderProductIds = orderRows[0].productIds as string[];
	const foundProductIds = orderRows.map((row) => row.productId);
	const missingProductIds = orderProductIds.filter((pid) => !foundProductIds.includes(pid));
	if (missingProductIds.length > 0) {
		return new Response('Some products in the order do not exist: ' + missingProductIds.join(','), {
			status: 400
		});
	}

	// Count occurrences of each productId in the order
	const productIdCounts: Record<string, number> = {};
	for (const pid of orderProductIds) {
		productIdCounts[pid] = (productIdCounts[pid] || 0) + 1;
	}

	// Calculate total price, multiplying each product's price by its count in the order
	const totalPrice = orderRows.reduce((sum, row) => {
		const count = productIdCounts[row.productId] || 0;
		return sum + (row.productPrice ?? 0) * count;
	}, 0);

	const order = orderRows[0];

	let url = 'https://hcb.hackclub.com/donations/start/' + order.hcbOrganizationId + '?';
	url += 'amount=' + parseInt(String(totalPrice));
	url +=
		'&message=' +
		encodeURIComponent(
			"---\nDO NOT EDIT ANY PART OF THIS ORDER OTHER THAN YOUR NAME AND EMAIL. YOUR ORDER WILL NOT BE FULFILLED IF YOU TRY TO EDIT THIS MESSAGE, CHANGE THE DONATION AMOUNT, ETC.\n\n[!] FEELING GENEROUS? COVER ALL OUR FEES SO WE DON'T LOSE ANY MONEY ON THIS ORDER. [!] \n---\nORDER-ID|" +
				orderId +
				'|'
		);
	url += '&goods=true';

	const response = new Response(url, { status: 302, headers: { Location: url } });
	if (returnTo) {
		response.headers.append(
			'Set-Cookie',
			`returnTo=${orderId}|${encodeURIComponent(returnTo)}; Path=/; HttpOnly; SameSite=Lax`
		);
	}

	return response;
};
