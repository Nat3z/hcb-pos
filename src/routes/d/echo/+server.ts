import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const json = await request.json();
	console.log('Received echo from webhook: ', json, request.headers);
	return new Response(
		JSON.stringify({
			request: json,
			headers: {
				'x-hook-secret': Object.fromEntries(request.headers)['x-hook-secret'],
				info: 'there are other headers, but for security purposes, we only show the x-hook-secret'
			}
		})
	);
};
