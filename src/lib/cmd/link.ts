import { getSession } from '$lib/auth-client';
import { Command } from './base';

export class LinkCommand extends Command {
	constructor() {
		super('link', 'Link your account to a HCB organization');
	}

	async execute(
		add: (line: string) => void,
		clear: () => void,
		args: string[],
		prompt: (question: string) => Promise<string>
	) {
		const session = await getSession();
		if (!session.data) {
			add('You are not logged in');
			return;
		}

		// ask for the hcb organization id
		const hcbOrganizationId = await prompt('Enter the HCB organization ID');
		if (!hcbOrganizationId) {
			add('HCB organization ID is required');
			return;
		}

		// ask for the hcb session token
		const hcbSessionToken = await prompt('Enter the HCB session token');
		if (!hcbSessionToken) {
			add('HCB session token is required');
			return;
		}

		const response = await fetch('/d/link', {
			method: 'POST',
			body: JSON.stringify({ hcbOrganizationId, hcbSessionToken })
		});

		if (!response.ok) {
			add('Failed to link account to HCB organization');
			return;
		}

		add('Account linked to HCB organization');
	}
}
