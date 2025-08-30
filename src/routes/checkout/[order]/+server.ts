import { db } from '$lib/server/db';
import {
	hcbOrganization as hcbOrganizationTable,
	order as orderTable,
	product as productTable,
	user as userTable
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const orderId = params.order;

	const allOrders = await db
		.select({
			orderId: orderTable.id,
			productName: productTable.name,
			productDescription: productTable.description,
			hcbOrganizationId: hcbOrganizationTable.id,
			productPrice: productTable.price
		})
		.from(orderTable)
		.innerJoin(productTable, eq(orderTable.productId, productTable.id))
		.innerJoin(userTable, eq(orderTable.userId, userTable.id))
		.innerJoin(hcbOrganizationTable, eq(userTable.id, hcbOrganizationTable.userId))
		.where(eq(orderTable.id, orderId))
		.limit(1);
	if (allOrders.length === 0) {
		return new Response('Order not found', { status: 404 });
	}

	const order = allOrders[0];

	let url = 'https://hcb.hackclub.com/donations/start/' + order.hcbOrganizationId + '?';
	url += 'amount=' + order.productPrice;
	url +=
		'&message=' +
		encodeURIComponent(
			"---\nDO NOT EDIT ANY PART OF THIS ORDER OTHER THAN YOUR NAME AND EMAIL. YOUR ORDER WILL NOT BE FULFILLED IF YOU TRY TO EDIT THIS MESSAGE, CHANGE THE DONATION AMOUNT, ETC.\n\n[!] FEELING GENEROUS? COVER ALL OUR FEES SO WE DON'T LOSE ANY MONEY ON THIS ORDER. [!] \n---\nORDER-ID|" +
				orderId +
				'|'
		);
	url += '&goods=true';

	return new Response(url, { status: 302, headers: { Location: url } });
};
