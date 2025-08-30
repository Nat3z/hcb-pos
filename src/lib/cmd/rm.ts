import { getSession } from '$lib/auth-client';
import { Command } from './base';

export class RmCommand extends Command {
	constructor() {
		super('rm', 'Remove a product');
	}

	async execute(add: (line: string) => void, clear: () => void, args: string[]) {
		const session = await getSession();
		if (!session.data) {
			add('You are not logged in');
			return;
		}

		const id = args[0];
		if (!id) {
			add('Product ID is required');
			return;
		}

		const response = await fetch('/d/products', {
			method: 'DELETE',
			body: JSON.stringify({ id })
		});

		if (!response.ok) {
			add('Failed to remove product');
			return;
		}

		const deleted = await response.json();
		add(`Product removed: ${deleted[0].name}`);
	}
}
