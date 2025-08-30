import { getSession } from '$lib/auth-client';
import { Command } from './base';

export class LsCommand extends Command {
	constructor() {
		super('ls', 'List all products');
	}

	async execute(add: (line: string) => void) {
		const session = await getSession();
		if (!session.data) {
			add('You are not logged in');
			return;
		}

		const products = await fetch('/d/products');
		const productsJson = await products.json();

		if (productsJson.length === 0) {
			add('No products found');
			return;
		}

		const productsTable = productsJson.map(
			(product: { id: string; name: string; description: string; price: number }) => {
				return {
					id: product.id,
					name: product.name,
					description: product.description || '',
					price: product.price
				};
			}
		);

		// Calculate column widths for alignment
		const headers = ['ID', 'Name', 'Description', 'Price'];
		const columnWidths = [
			Math.max(headers[0].length, ...productsTable.map((p: { id: string }) => p.id.length)),
			Math.max(headers[1].length, ...productsTable.map((p: { name: string }) => p.name.length)),
			Math.max(
				headers[2].length,
				...productsTable.map((p: { description: string }) => p.description.length)
			),
			Math.max(
				headers[3].length,
				...productsTable.map((p: { price: number }) => `$${(p.price / 100).toFixed(2)}`.length)
			)
		];

		// Create header row
		const headerRow = `| ${headers[0].padEnd(columnWidths[0])} | ${headers[1].padEnd(columnWidths[1])} | ${headers[2].padEnd(columnWidths[2])} | ${headers[3].padEnd(columnWidths[3])} |`;

		// Create separator row
		const separatorRow = `| ${'-'.repeat(columnWidths[0])} | ${'-'.repeat(columnWidths[1])} | ${'-'.repeat(columnWidths[2])} | ${'-'.repeat(columnWidths[3])} |`;

		// Create data rows
		const dataRows = productsTable.map(
			(product: { id: string; name: string; description: string; price: number }) => {
				const formattedPrice = `$${(product.price / 100).toFixed(2)}`;
				return `| ${product.id.padEnd(columnWidths[0])} | ${product.name.padEnd(columnWidths[1])} | ${product.description.padEnd(columnWidths[2])} | ${formattedPrice.padEnd(columnWidths[3])} |`;
			}
		);

		// Combine all rows
		const table = [headerRow, separatorRow, ...dataRows];
		for (const row of table) {
			add(row);
		}
	}
}
