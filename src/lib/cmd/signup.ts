import { Command } from './base';
import { signUp } from '$lib/auth-client';

export class SignupCommand extends Command {
	constructor() {
		super('signup', 'Sign up for a new account');
	}

	async execute(
		add: (line: string) => void,
		clear: () => void,
		args: string[],
		prompt?: (question: string) => Promise<string>
	) {
		const email = await prompt?.('Enter your email:');
		const password = await prompt?.('Enter your password:');
		const name = await prompt?.('Enter your name:');

		if (!email || !password || !name) {
			add('Signup failed');
			return;
		}

		const result = await signUp.email({ email, password, name });
		if (result.error) {
			add(`Signup failed: ${result.error.message}`);
			return;
		}

		add(`Signup successful. You are now signed up as ${result.data.user.email}.`);
		add(
			`Run 'link' to link your account to an HCB organization. Without this, you cannot sell products.`
		);
	}
}
