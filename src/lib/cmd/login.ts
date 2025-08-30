import { Command } from './base';
import { signIn } from '$lib/auth-client';

export class LoginCommand extends Command {
	constructor() {
		super('login', 'Login to the system');
	}

	async execute(
		add: (line: string) => void,
		clear: () => void,
		args: string[],
		prompt?: (question: string) => Promise<string>
	) {
		const email = await prompt?.('Enter your email:');
		const password = await prompt?.('Enter your password:');

		if (!email || !password) {
			add('Login failed');
			return;
		}

		const result = await signIn.email({ email, password });
		if (result.error) {
			add(`Login failed: ${result.error.message}`);
			return;
		}

		add(`Login successful. You are now logged in as ${result.data.user.email}`);
	}
}
