import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api } from '../lib';
import { db } from '$lib/server/db';
import { hcbOrganization } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import HCBAccount from 'innerhcb';

export const GET: RequestHandler = async ({ request }) => {
	const userId = await api.headers(request);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const organization = await db
		.select()
		.from(hcbOrganization)
		.where(eq(hcbOrganization.userId, userId));

	if (organization.length === 0) {
		return json({ error: 'No organization linked' }, { status: 400 });
	}

	const account = new HCBAccount(organization[0].sessionToken);
	await account.pre();
	const canAuthorize = await account.isAuthorized(organization[0].id);

	if (!canAuthorize) {
		return json({ error: 'Unauthorized Session Token' }, { status: 401 });
	}

	return json({
		linked: canAuthorize,
		hasSessionToken: !!organization[0].sessionToken
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const { sessionToken } = await request.json();
	if (!sessionToken || typeof sessionToken !== 'string') {
		return json({ error: 'Session token is required' }, { status: 400 });
	}
	const userId = await api.headers(request);
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const organization = await db
		.select()
		.from(hcbOrganization)
		.where(eq(hcbOrganization.userId, userId));

	if (organization.length === 0) {
		return json({ error: 'No organization linked' }, { status: 400 });
	}

	// check if the new session token is valid
	const account = new HCBAccount(sessionToken);
	await account.pre();
	const canAuthorize = await account.isAuthorized(organization[0].id);

	if (!canAuthorize) {
		return json({ error: 'Unauthorized Session Token' }, { status: 401 });
	}
	await db
		.update(hcbOrganization)
		.set({
			sessionToken
		})
		.where(eq(hcbOrganization.userId, userId));

	console.log('Updated hcb organization link successfully');
	return json({ message: 'Updated hcb organization link successfully' });
};
