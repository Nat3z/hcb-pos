import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	const returnTo = request.headers
		.get('Cookie')
		?.split('; ')
		.find((cookie) => cookie.startsWith('returnTo=') && cookie.includes('|'));
	if (!returnTo) {
		return new Response('No returnTo cookie found', { status: 400 });
	}
	console.log('returnTo', returnTo);
	const [orderId, returnToUrl] = returnTo.split('returnTo=')[1].split('|');
	const url = new URL(decodeURIComponent(returnToUrl));
	url.searchParams.set('orderId', orderId);
	url.searchParams.delete('returnTo');
	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString(),
			'Set-Cookie': `returnTo=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
		}
	});
};
