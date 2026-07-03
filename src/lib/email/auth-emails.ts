import 'server-only'
import { sendTransactionalEmail, type SendEmailResult } from './send'

const BRAND = '#1a3a5c'

function layout(title: string, bodyHtml: string): string {
  return `
  <div style="background:#f4f6f8;padding:24px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:${BRAND};padding:20px 28px">
        <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:.5px">PEAK MEDICAL WHOLESALE</span>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 16px;font-size:20px;color:#111827">${title}</h1>
        ${bodyHtml}
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
      <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
        Peak Medical Wholesale · info@peakmedicalwholesale.com · +1-888-222-0373
      </div>
    </div>
  </div>`
}

function button(href: string, label: string): string {
  return `
    <p style="margin:20px 0">
      <a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 28px;border-radius:6px">${label}</a>
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#6b7280;word-break:break-all">
      Or copy this link into your browser:<br>${href}
    </p>`
}

/** Account-verification email sent after registration (replaces Supabase's built-in mailer). */
export async function sendVerifyEmail(to: string, confirmUrl: string): Promise<SendEmailResult> {
  return sendTransactionalEmail({
    to,
    subject: 'Verify your email — Peak Medical Wholesale',
    html: layout(
      'Confirm your email address',
      `<p style="margin:0;font-size:14px;color:#374151;line-height:1.6">
         Thanks for creating an account with Peak Medical Wholesale. Click the button
         below to verify your email address and activate your account.
       </p>
       ${button(confirmUrl, 'Verify Email')}`,
    ),
    text: `Verify your Peak Medical Wholesale account:\n${confirmUrl}\n\nIf you did not create an account, ignore this email.`,
  })
}

/** Password-reset email (replaces Supabase's built-in mailer). */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendEmailResult> {
  return sendTransactionalEmail({
    to,
    subject: 'Reset your password — Peak Medical Wholesale',
    html: layout(
      'Reset your password',
      `<p style="margin:0;font-size:14px;color:#374151;line-height:1.6">
         We received a request to reset the password for your account. Click the
         button below to choose a new password.
       </p>
       ${button(resetUrl, 'Reset Password')}`,
    ),
    text: `Reset your Peak Medical Wholesale password:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
  })
}
