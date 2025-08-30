import { getSession } from '$lib/auth-client';
import { Command } from './base';

export class WhoamiCommand extends Command {
	constructor() {
		super('whoami', 'Show the current user');
	}

	async execute(add: (line: string) => void) {
		const session = await getSession();
		const user = session?.data?.user;
		if (!user) {
			add('You are not logged in');
			return;
		}

		add(`You are logged in as ${user.email}`);
	}
}
