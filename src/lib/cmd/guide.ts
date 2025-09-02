import { Command } from './base';

export class GuideCommand extends Command {
	constructor() {
		super('guide', 'Guide setting up HCB PoS for your organization');
	}

	async execute(add: (line: string) => void, clear: () => void, args: string[]) {
		if (args.length > 0 && args[0] === 'webhooks') {
			clear();
			add(`How to manage webhooks for your producst.`);
			add(`To add a webhook, run the following command:`);
			add(`$ hook add <productId> <webhookUrl>`);
			add(`To test your webhook, run the following command:`);
			add(`$ test <orderId>`);
			add(`To remove a webhook, run the following command:`);
			add(`$ hook remove <productId>`);
			add(``);
			add(
				`When the server sends a POST request to your webhook, it will contain the orderId and productIds.`
			);
			add(
				`The X-Hook-Secret header is the secret key you will receive when adding the webhook. You cannot see this key after it is generated.`
			);
			add(`Example of a webhook request:`);
			add(`{`);
			add(`  "orderId": "123",`);
			add(`  "productIds": ["123", "456"]`);
			add(`}`);
			return;
		} else if (args.length === 0 || args[0] === 'general') {
			clear();
			add(
				'Welcome to HCB Point-of-Sale, the tool that provides a stripe-like interface for validating and fulfilling orders on your HCB organization.'
			);
			add('\n');
			add(
				'First, you need to link your HCB organization to PoS. This requires getting your HCB session token.\nTo get your session token, go to the following link and run the command in your inspect element:'
			);
			add(`https://github.com/Nat3z/innerhcb?tab=readme-ov-file#im-too-lazy-to-do-all-of-that`);
			add('\n');
			add(
				'Once you have your session token, run the following command to link your organization to PoS:'
			);
			add('$ link');
			add('\n');
			add('--------------------------------');
			add('\n');
			add('To create a product, run the following command:');
			add('$ create');
			add('\n');
			add(
				'Once you have a product, you can view it and all other products with the following command:'
			);
			add('$ ls');
			add('\n');
			add('--------------------------------');
			add('\n');
			add('To remove a product, run the following command:');
			add('$ rm <productId>');
			add('\n');
			add('--------------------------------');
			add('\n');

			add('To sell a product, run the following command:');
			add('$ sell <productId>');

			add('\n');
			add(
				'The output will be a link to the checkout of the product. The <orderId> is the last part of that link (/checkout/...)'
			);

			add('\n');
			add('--------------------------------');
			add('\n');

			add(
				`Webhooks are a vital part for fulfilling orders.
      When fulfilling an order, our server will send a POST request to the webhook url you provided.
      The request will contain the orderId and productId, along with a X-HOOK-SECRET header.
      The X-HOOK-SECRET header is the secret key you will receive when adding the webhook. You cannot see this key after it is generated.
      `
			);
			add('To add a webhook, run the following command:');
			add('$ hook add <productId> <webhookUrl>');
			add('\n');
			add(
				"To test your webhook, generate an order id using the 'sell' command and then run the following command:"
			);
			add('$ test <orderId>');
			add('\n');
			add('Need more guidance? Run the following command:');
			add('$ guide webhooks');
			add('\n');
		} else {
			add('Usage: guide [general|webhooks]');
		}
	}
}
