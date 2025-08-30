import { Command } from './base';
import { requestPasswordReset } from '$lib/auth-client';

export class ResetCommand extends Command {
	constructor() {
		super('reset', 'Reset your password');
	}

	async execute(
		add: (line: string) => void,
		clear: () => void,
		args: string[],
		prompt?: (question: string) => Promise<string>
	) {
		// If email is provided as argument, use it; otherwise prompt for it
		let email = args[0];
		if (!email) {
			email = (await prompt?.('Enter your email:')) ?? '';
			if (!email) {
				add('Email is required');
				return;
			}
		}

		add('Sending password reset email...');

		const result = await requestPasswordReset({
			email,
			redirectTo: `${window.location.origin}`
		});

		if (result.error) {
			add(`Reset password failed: ${result.error.message}`);
			return;
		}

		add(`Password reset email sent to ${email}`);
		add('Check your email for a reset link.');
	}
}
