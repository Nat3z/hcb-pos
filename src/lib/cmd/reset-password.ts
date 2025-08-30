import { Command } from './base';
import { resetPassword } from '$lib/auth-client';

export class ResetPasswordCommand extends Command {
	constructor() {
		super('reset-password', 'Complete password reset with token');
	}

	async execute(
		add: (line: string) => void,
		clear: () => void,
		args: string[],
		prompt?: (question: string) => Promise<string>
	) {
		const token = args[0];
		if (!token) {
			add('Reset token is required');
			return;
		}

		let attempts = 0;
		const maxAttempts = 3;

		while (attempts < maxAttempts) {
			attempts++;

			const attemptText = attempts > 1 ? ` (Attempt ${attempts}/${maxAttempts})` : '';
			const newPassword = await prompt?.(`Enter your new password${attemptText}:`);
			const confirmPassword = await prompt?.(`Confirm your new password${attemptText}:`);

			if (!newPassword || !confirmPassword) {
				add('Password reset cancelled');
				return;
			}

			if (newPassword !== confirmPassword) {
				add('Passwords do not match');
				if (attempts < maxAttempts) {
					add('Please try again...');
					add('');
					continue;
				} else {
					add('Maximum attempts reached. Please request a new reset link.');
					return;
				}
			}

			if (newPassword.length < 8) {
				add('Password must be at least 8 characters long');
				if (attempts < maxAttempts) {
					add('Please try again...');
					add('');
					continue;
				} else {
					add('Maximum attempts reached. Please request a new reset link.');
					return;
				}
			}

			add('Resetting password...');

			const result = await resetPassword({
				newPassword,
				token
			});

			if (result.error) {
				add(`Password reset failed: ${result.error.message}`);
				if (attempts < maxAttempts) {
					add('Please try again...');
					add('');
					continue;
				} else {
					add(
						'Maximum attempts reached. Please request a new reset link using the "reset" command.'
					);
					return;
				}
			}

			add('Password reset successful! You can now login with your new password.');
			return;
		}
	}
}
