import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';
import { apiKey as apiKeyTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	// generate an api key
	const apiKey = crypto.randomUUID();

	// save the api key to the database, or if it already exists, update it
	if (
		(await db.select().from(apiKeyTable).where(eq(apiKeyTable.userId, session.user.id))).length > 0
	) {
		await db
			.update(apiKeyTable)
			.set({
				apiKey
			})
			.where(eq(apiKeyTable.userId, session.user.id));
	} else {
		await db.insert(apiKeyTable).values({
			id: crypto.randomUUID(),
			userId: session.user.id,
			apiKey
		});
	}

	return new Response(JSON.stringify({ apiKey }), { status: 200 });
};
