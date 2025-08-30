import { sendVerificationEmail } from '$lib/auth-client';
import { Command } from './base';

export class ResendVerificationCommand extends Command {
	constructor() {
		super('resend-verification', 'Resend verification email');
	}

	async execute(add: (line: string) => void, clear: () => void, args: string[]) {
		const email = args[0];
		if (!email) {
			add('Email is required');
			return;
		}

		const result = await sendVerificationEmail({ email });
		if (result.error) {
			add(`Resend verification email failed: ${result.error.message}`);
		}

		add(`Verification email sent to ${email}`);
	}
}
