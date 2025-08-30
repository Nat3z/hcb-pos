import { Command } from './base';

export class HookCommand extends Command {
	constructor() {
		super('hook', 'Manage webhooks for a product');
	}

	async execute(add: (line: string) => void, clear: () => void, args: string[]) {
		const command = args[0];
		if (command === 'add') {
			const productId = args[1];
			const hookUrl = args[2];
			if (!productId || !hookUrl) {
				add('Usage: hook add <productId> <hookUrl>');
				return;
			}

			const response = await fetch(`/d/hook`, {
				method: 'POST',
				body: JSON.stringify({ productId, hookUrl })
			});
			if (!response.ok) {
				add(`Failed to create hook: ${await response.text()}`);
				return;
			}
			const data = await response.json();
			add(
				`Hook created. Store this secret in your project, it will be used to verify requests with the webhook. ${data.hookSecret}`
			);
			add(
				`When you receive an order, check the X-Hook-Secret header to verify the request, using this secret as the value.`
			);
		} else if (command === 'remove') {
			const productId = args[1];
			if (!productId) {
				add('Usage: hook remove <productId>');
				return;
			}
			const response = await fetch(`/d/hook`, {
				method: 'DELETE',
				body: JSON.stringify({ productId })
			});
			if (!response.ok) {
				add(`Failed to remove hook: ${await response.text()}`);
				return;
			}
			add(`Hook removed`);
		} else {
			add('Usage: hook <add|remove> <productId> <hookUrl>');
		}
	}
}
