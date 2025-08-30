import { db } from '$lib/server/db';
import { apiKey } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const api = {
	verify: async (key: string): Promise<string | null> => {
		const foundApi = await db.select().from(apiKey).where(eq(apiKey.apiKey, key));
		if (foundApi.length === 0) {
			return null;
		}
		return foundApi[0].userId;
	},
	headers: async (request: Request) => {
		const key = request.headers.get('Authorization')?.split(' ')[1];
		if (!key) {
			return null;
		}
		return await api.verify(key);
	}
};
