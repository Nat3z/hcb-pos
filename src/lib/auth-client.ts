import { createAuthClient } from 'better-auth/svelte';
export const {
	signIn,
	signUp,
	signOut,
	useSession,
	getSession,
	requestPasswordReset,
	resetPassword,
	sendVerificationEmail
} = createAuthClient();
