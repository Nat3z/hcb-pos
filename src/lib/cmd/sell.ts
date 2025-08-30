import { getSession } from '$lib/auth-client';
import { Command } from './base';

export class SellCommand extends Command {
	constructor() {
		super('sell', 'Generate a sell order for a product');
	}

	async execute(add: (line: string) => void, clear: () => void, args: string[]) {
		const session = await getSession();
		if (!session.data) {
			add('You are not logged in');
			return;
		}

		const productId = args[0];
		if (!productId) {
			add('Product ID is required');
			return;
		}

		const response = await fetch('/d/orders', {
			method: 'POST',
			body: JSON.stringify({ productId })
		});

		if (!response.ok) {
			add('Failed to create order');
			return;
		}

		const order = await response.json();
		const link = window.location.origin + '/checkout/' + order.id;
		add(`Order created: ${link}`);
	}
}
