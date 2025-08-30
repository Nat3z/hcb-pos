import { getSession } from '$lib/auth-client';
import { Command } from './base';

export class CreateCommand extends Command {
	constructor() {
		super('create', 'Create a new product');
	}

	async execute(
		add: (line: string) => void,
		clear: () => void,
		args: string[],
		prompt: (question: string) => Promise<string>
	) {
		const session = await getSession();
		if (!session.data) {
			add('You are not logged in');
			return;
		}
		const name = await prompt('Enter the name of the product');
		const description = await prompt('Enter the description of the product');
		const price = await prompt('Enter the price of the product (in cents)');
		if (isNaN(Number(price))) {
			add('Price must be a number');
			return;
		}

		const priceInCents = Number(price) * 100;
		// prevent floating point precision issues to 2 decimal places
		const priceInCentsInt = Math.round(priceInCents * 100) / 100;
		const response = await fetch('/d/products', {
			method: 'POST',
			body: JSON.stringify({ name, description, price: priceInCentsInt })
		});

		if (!response.ok) {
			add('Failed to create product');
			return;
		}
		const product = await response.json();
		add(`Product created: ${product.name}`);
	}
}
