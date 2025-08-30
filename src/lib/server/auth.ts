import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const resend = new Resend(env.RESEND_API_KEY);

export let auth: ReturnType<typeof betterAuth>;

export function prepareAuth() {
	if (auth) return;
	auth = betterAuth({
		database: drizzleAdapter(db, {
			provider: 'pg'
		}),
		emailVerification: {
			async sendVerificationEmail(data) {
				if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
					return Promise.reject(new Error('Instance not configured to send emails.'));
				}
				await resend.emails.send({
					from: env.RESEND_FROM,
					to: data.user.email,
					subject: 'Verify your email | HCB PoS',
					html: `
						<div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px 0;">
							<div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 32px;">
								<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
									<span style="font-size: 1.5rem; font-weight: bold; color: #10b981;">HCB PoS</span>
								</div>
								<h2 style="color: #111827; margin-bottom: 16px;">Verify your email</h2>
								<p style="color: #374151; margin-bottom: 24px;">
									Hello, <strong>${data.user.email}</strong>!
								</p>
								<p style="color: #374151; margin-bottom: 24px;">
									We received a request to verify your email for your HCB Point of Sale account.
								</p>
								<p style="color: #374151; margin-bottom: 24px;">
									<b>Instance:</b>
									<a href="${env.ORIGIN ?? '#'}" style="color: #10b981; text-decoration: underline;">
										${env.ORIGIN ?? 'Unknown'}
									</a>
								</p>
								<a href="${data.url}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: #fff; border-radius: 4px; text-decoration: none; font-weight: bold; margin-bottom: 24px;">
									Verify Email
								</a>
								<p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
									If you did not request an email verification, you can safely ignore this email.
								</p>
								<p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
									Or copy and paste this link into your browser:<br>
									<a href="${data.url}" style="color: #10b981;">${data.url}</a>
								</p>
								<hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
								<p style="color: #9ca3af; font-size: 12px; text-align: center;">
									&copy; ${new Date().getFullYear()} HCB Point of Sale
								</p>
							</div>
						</div>
					`
				});
			}
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: env.RESEND_API_KEY !== undefined,
			async sendResetPassword(data) {
				if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
					return Promise.reject(new Error('Instance not configured to send emails.'));
				}
				await resend.emails.send({
					from: env.RESEND_FROM,
					to: data.user.email,
					subject: 'Reset your password | HCB PoS',
					html: `
						<div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px 0;">
							<div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 32px;">
								<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
									<!-- <img src="${env.ORIGIN ?? '#'}/favicon.ico" alt="HCB PoS Logo" style="width: 40px; height: 40px; border-radius: 8px;"> -->
									<span style="font-size: 1.5rem; font-weight: bold; color: #10b981;">HCB PoS</span>
								</div>
								<h2 style="color: #111827; margin-bottom: 16px;">Reset your password</h2>
								<p style="color: #374151; margin-bottom: 24px;">
									Hello, <strong>${data.user.email}</strong>!
								</p>
								<p style="color: #374151; margin-bottom: 24px;">
									We received a request to reset your password for your HCB Point of Sale account.
								</p>
								<p style="color: #374151; margin-bottom: 24px;">
									<b>Instance:</b>
									<a href="${env.ORIGIN ?? '#'}" style="color: #10b981; text-decoration: underline;">
										${env.ORIGIN ?? 'Unknown'}
									</a>
								</p>
								<a href="${data.url}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: #fff; border-radius: 4px; text-decoration: none; font-weight: bold; margin-bottom: 24px;">
									Reset Password
								</a>
								<p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
									If you did not request a password reset, you can safely ignore this email.
								</p>
								<p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
									Or copy and paste this link into your browser:<br>
									<a href="${data.url}" style="color: #10b981;">${data.url}</a>
								</p>
								<hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
								<p style="color: #9ca3af; font-size: 12px; text-align: center;">
									&copy; ${new Date().getFullYear()} HCB Point of Sale
								</p>
							</div>
						</div>
					`
				});
			}
		}
	});
}
