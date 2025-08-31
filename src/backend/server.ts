import { db, prepareDb } from '../lib/server/db/index.js';
import {
	order as orderTable,
	hcbOrganization as hcbOrganizationTable,
	product as productTable,
	orderHook
} from '../lib/server/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import HCB from 'innerhcb';
import { env } from 'bun';

prepareDb({ DATABASE_URL: env.DATABASE_URL! });

class OrderFulfillmentChecker {
	private intervalId: NodeJS.Timeout | null = null;
	private isRunning = false;
	private isChecking = false;

	constructor(private intervalMs: number = 10000) {
		console.log(`Initializing order fulfillment checker with ${intervalMs}ms interval`);
	}

	start() {
		if (this.isRunning) {
			console.log('Order fulfillment checker is already running');
			return;
		}

		this.isRunning = true;
		console.log('Starting order fulfillment checker...');

		// Run immediately on start
		this.checkOrders();

		// Then run every 10 seconds with consistent timing
		this.intervalId = setInterval(async () => {
			// Skip if previous check is still running to maintain consistent timing
			if (this.isChecking) {
				console.log('Previous check still running, skipping this interval...');
				return;
			}
			await this.checkOrders();
		}, this.intervalMs);
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.isRunning = false;
		console.log('Order fulfillment checker stopped');
	}

	private async checkOrders() {
		if (this.isChecking) {
			return;
		}

		this.isChecking = true;
		const startTime = Date.now();

		try {
			console.log(`[${new Date().toISOString()}] Checking for unfulfilled orders...`);

			// Get all unfulfilled orders with their associated HCB organization info
			const unfulfilledOrders = await db
				.select()
				.from(orderTable)
				.innerJoin(hcbOrganizationTable, eq(orderTable.userId, hcbOrganizationTable.userId))
				.where(eq(orderTable.fulfilled, false));

			if (unfulfilledOrders.length === 0) {
				console.log('No unfulfilled orders found');
				return;
			}

			const unfulfilledRaw: Array<{
				orderId: string;
				userId: string;
				productIds: string[];
				hcbOrgId: string;
				sessionToken: string;
				productPrice: number;
			}> = [];

			for (const row of unfulfilledOrders) {
				const order = row.order;
				const hcbOrg = row.hcb_organization;
				const productIds: string[] = order.productIds;

				// Fetch all products for this order
				const products = await db
					.select()
					.from(productTable)
					.where(inArray(productTable.id, productIds));

				// Ensure all productIds have a match
				const foundProductIds = products.map((p) => p.id);
				const missingProductIds = productIds.filter((pid) => !foundProductIds.includes(pid));
				if (missingProductIds.length > 0) {
					console.log(
						`Order ${order.id} skipped: not all productIds have a matching product. Missing: ${missingProductIds.join(',')}`
					);
					continue;
				}

				// Count occurrences of each productId in the order
				const productIdCounts: Record<string, number> = {};
				for (const pid of productIds) {
					productIdCounts[pid] = (productIdCounts[pid] || 0) + 1;
				}

				// Calculate total price, multiplying each product's price by its count in the order
				const productPrice = products.reduce((sum, p) => {
					const count = productIdCounts[p.id] || 0;
					return sum + (p.price ?? 0) * count;
				}, 0);

				unfulfilledRaw.push({
					orderId: order.id,
					userId: order.userId,
					productIds,
					hcbOrgId: hcbOrg.id,
					sessionToken: hcbOrg.sessionToken,
					productPrice
				});
			}

			if (unfulfilledRaw.length === 0) {
				console.log('No unfulfilled orders found');
				return;
			}

			const unfulfilled = unfulfilledRaw
				.map((order) => ({
					...order,
					productPrice: Number(order.productPrice)
				}))
				.filter((order) => !isNaN(order.productPrice));

			console.log(`Found ${unfulfilled.length} unfulfilled orders`);

			// Group orders by organization to minimize API calls
			const ordersByOrg = new Map<string, typeof unfulfilled>();
			for (const order of unfulfilled) {
				const orgId = order.hcbOrgId;
				if (!ordersByOrg.has(orgId)) {
					ordersByOrg.set(orgId, []);
				}
				ordersByOrg.get(orgId)!.push(order);
			}

			console.log(`Processing ${ordersByOrg.size} organizations`);

			// Process each organization's orders together
			for (const [orgId, orders] of ordersByOrg) {
				await this.checkOrdersForOrganization(orgId, orders);
			}

			const duration = Date.now() - startTime;
			console.log(`Order check completed in ${duration}ms`);
		} catch (error) {
			console.error('Error checking orders:', error);
		} finally {
			this.isChecking = false;
		}
	}

	private async checkOrdersForOrganization(
		orgId: string,
		orders: Array<{
			orderId: string;
			userId: string;
			productIds: string[];
			hcbOrgId: string;
			sessionToken: string;
			productPrice: number;
		}>
	) {
		try {
			console.log(`Fetching donations for organization ${orgId} (${orders.length} orders)...`);

			// Use the session token from the first order (they should all be the same for the same org)
			const sessionToken = orders[0].sessionToken;

			// Initialize HCB client with the organization's session token
			const hcb = new HCB(sessionToken);
			await hcb.pre();

			// Get donations once for this organization
			const donations = await hcb.getDonations(orgId);

			if (!donations) {
				console.log(`No donations found for organization ${orgId}`);
				return;
			}

			console.log(`Found ${donations.length} donations for organization ${orgId}`);

			// Check each order against the cached donations
			for (const order of orders) {
				await this.checkSingleOrderWithDonations(order, donations, hcb);
			}
		} catch (error) {
			console.error(`Error checking orders for organization ${orgId}:`, error);
		}
	}

	private async checkSingleOrderWithDonations(
		order: {
			orderId: string;
			userId: string;
			productIds: string[];
			hcbOrgId: string;
			sessionToken: string;
			productPrice: number;
		},
		donations: Array<{
			donor_name: string;
			private_donor: boolean;
			donation_amount: number;
			details_url?: string | null | undefined;
		}>,
		hcb: HCB
	) {
		try {
			const amountTolerance = order.productPrice * 0.1; // 10% tolerance
			const minAmount = order.productPrice;
			const maxAmount = order.productPrice + amountTolerance;
			console.log(
				`Checking order ${order.orderId} (amount: $${(order.productPrice / 100).toFixed(2)}+${(maxAmount / 100).toFixed(2)} against cached donations...`
			);

			let checkedDonations = 0;
			let skippedDonations = 0;

			// Check each donation to see if it matches our order
			for (const donation of donations) {
				checkedDonations++;

				// Skip donations that don't match the expected amount range
				if (donation.donation_amount < minAmount || donation.donation_amount > maxAmount) {
					skippedDonations++;
					continue; // Skip this donation as amount doesn't match
				}

				if (donation.details_url) {
					try {
						console.log(donation.details_url);
						const details = await hcb.getDonationDetails(donation.details_url);
						if (details && this.isDonationForOrder(details, order.orderId)) {
							console.log(
								`Found matching donation for order ${order.orderId}! (amount: $${details.amount / 100})`
							);
							await this.fulfillOrder({
								id: order.orderId,
								userId: order.userId,
								productIds: order.productIds,
								fulfilled: true
							});
							return;
						}
					} catch (detailsError) {
						console.error(`Error fetching donation details:`, detailsError);
					}
				}
			}

			console.log(
				`No matching donation found for order ${order.orderId} (checked ${checkedDonations} donations, skipped ${skippedDonations} by amount)`
			);
		} catch (error) {
			console.error(`Error checking order ${order.orderId}:`, error);
		}
	}

	private isDonationForOrder(
		donationDetails: {
			amount: number;
			donor_email: string;
			donation_time?: string | null | undefined;
			transaction_memo?: string | null | undefined;
			transaction_message?: string | null | undefined;
		},
		orderId: string
	): boolean {
		// Check if the donation message contains our order ID
		const message = donationDetails.transaction_message || '';
		const memo = donationDetails.transaction_memo || '';

		// Look for the order ID pattern in the message (ORDER-ID|{orderId}|)
		const orderPattern = `ORDER-ID|${orderId}|`;

		return message.includes(orderPattern) || memo.includes(orderPattern);
	}

	private async fulfillOrder(order: typeof orderTable.$inferSelect) {
		try {
			await db.update(orderTable).set({ fulfilled: true }).where(eq(orderTable.id, order.id));

			// find the associated hook for the order
			const unqiueProductIds = Array.from(new Set(order.productIds));
			const hooks = await db
				.select()
				.from(orderHook)
				.where(inArray(orderHook.productId, unqiueProductIds));

			if (hooks.length !== unqiueProductIds.length) {
				console.error(`No hook found for product ${order.productIds}`);
				return;
			}

			// remove any duplicate hooks
			const uniqueHooks = hooks.filter(
				(hook, index, self) => index === self.findIndex((t) => t.hookUrl === hook.hookUrl)
			);

			for (const hook of uniqueHooks) {
				// send a POST request to the hook with the order id
				const response = await fetch(hook.hookUrl, {
					method: 'POST',
					body: JSON.stringify({ orderId: order.id, productIds: order.productIds }),
					headers: {
						'Content-Type': 'application/json',
						'X-Hook-Secret': hook.hookSecret
					}
				});

				if (!response.ok) {
					console.error(`Failed to send hook request: ${response.statusText}`);
					continue;
				}
			}
			console.log(`✅ Order ${order.id} has been fulfilled!`);
		} catch (error) {
			console.error(`Error fulfilling order ${order.id}:`, error);
		}
	}
}

// Configuration
const CHECK_INTERVAL_MS = parseInt(process.env.ORDER_CHECK_INTERVAL || '25000'); // Default 10 seconds

// Initialize and start the order fulfillment checker
const checker = new OrderFulfillmentChecker(CHECK_INTERVAL_MS);

await new Promise((resolve) => setTimeout(resolve, 10000));
checker.start();

// Graceful shutdown
process.on('SIGINT', () => {
	console.log('Received SIGINT, shutting down gracefully...');
	checker.stop();
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.log('Received SIGTERM, shutting down gracefully...');
	checker.stop();
	process.exit(0);
});

console.log('HCB Point-of-Service backend started');
