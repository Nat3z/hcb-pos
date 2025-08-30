import { signOut } from '$lib/auth-client';
import { Command } from './base';

export class LogoutCommand extends Command {
	constructor() {
		super('logout', 'Logout from the system');
	}

	async execute(add: (line: string) => void) {
		const result = await signOut();
		if (result.error) {
			add(`Logout failed: ${result.error.message}`);
			return;
		}

		add('Logged out successfully');
	}
}
