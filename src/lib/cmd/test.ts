import { Command } from './base';

export class TestCommand extends Command {
	constructor() {
		super('test', 'Test the webhook for an order');
	}

	async execute(add: (line: string) => void, clear: () => void, args: string[]) {
		if (args.length === 0) {
			add('Usage: test <orderId>');
			return;
		}
		const response = await fetch('/d/test', {
			method: 'POST',
			body: JSON.stringify({ orderId: args[0] })
		});
		if (!response.ok) {
			add(`Failed to test webhook: ${await response.text()}`);
			return;
		}
		const data = await response.json();
		add(JSON.stringify(data, null, 2));
	}
}
