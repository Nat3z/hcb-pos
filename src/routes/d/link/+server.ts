import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { hcbOrganization } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import z from 'zod';

const hcbOrganizationSchema = z.object({
	hcbOrganizationId: z.string(),
	hcbSessionToken: z.string()
});

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession(request);
	if (!session) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json();
	const parsedBody = hcbOrganizationSchema.parse(body);

	const hcbOrganizationId = parsedBody.hcbOrganizationId;
	const hcbSessionToken = parsedBody.hcbSessionToken;

	const existingHcbOrganization = await db
		.select()
		.from(hcbOrganization)
		.where(eq(hcbOrganization.id, hcbOrganizationId));
	if (existingHcbOrganization.length > 0) {
		await db
			.update(hcbOrganization)
			.set({
				sessionToken: hcbSessionToken
			})
			.where(eq(hcbOrganization.id, hcbOrganizationId));
	} else {
		await db.insert(hcbOrganization).values({
			id: hcbOrganizationId,
			userId: session.user.id,
			sessionToken: hcbSessionToken
		});
	}

	return new Response('HCB organization linked', { status: 200 });
};
