import { Resend } from 'resend';

const FROM = process.env.EMAIL_FROM || 'Pooled Wealth <noreply@pooledwealth.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const PLATFORM = 'Pooled Wealth';

/** Escape user-supplied strings before embedding in HTML email templates */
function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY must be configured in production — email not sent');
    }
    // No API key — log to console in dev
    console.log(`\n📧 EMAIL (not sent — RESEND_API_KEY not configured)\nTo: ${to}\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, '')}\n`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

function base(body: string) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1207">
    <h2 style="color:#1A2B1F;margin-bottom:4px">${PLATFORM}</h2>
    <hr style="border:none;border-top:1px solid #E8E2D6;margin:16px 0"/>
    ${body}
    <hr style="border:none;border-top:1px solid #E8E2D6;margin:24px 0"/>
    <p style="color:#8A7A60;font-size:12px">You're receiving this because you have an account at ${PLATFORM}. Please do not reply to this email.</p>
  </div>`;
}

export async function sendKycApproved(to: string, name: string) {
  await send(to, 'Your identity has been verified ✓', base(`
    <p>Hi ${esc(name)},</p>
    <p>Great news — your identity has been verified. You can now invest on the platform.</p>
    <a href="${APP_URL}/investments" style="display:inline-block;background:#1A2B1F;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Browse Assets</a>
  `));
}

export async function sendDepositApproved(to: string, name: string, amount: string) {
  await send(to, `Deposit of ${amount} approved`, base(`
    <p>Hi ${esc(name)},</p>
    <p>Your bank transfer deposit of <strong>${esc(amount)}</strong> has been approved and credited to your wallet.</p>
    <a href="${APP_URL}/investor/portfolio" style="display:inline-block;background:#1A2B1F;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">View Portfolio</a>
  `));
}

export async function sendDepositRejected(to: string, name: string, amount: string) {
  await send(to, `Deposit of ${amount} could not be processed`, base(`
    <p>Hi ${esc(name)},</p>
    <p>Unfortunately your bank transfer deposit of <strong>${esc(amount)}</strong> could not be approved. Please contact support if you believe this is an error.</p>
  `));
}

export async function sendWithdrawalApproved(to: string, name: string, amount: string) {
  await send(to, `Withdrawal of ${amount} approved`, base(`
    <p>Hi ${esc(name)},</p>
    <p>Your withdrawal request of <strong>${esc(amount)}</strong> has been approved and will be transferred to your bank account within 1–3 business days.</p>
  `));
}

export async function sendWithdrawalRejected(to: string, name: string, amount: string) {
  await send(to, `Withdrawal of ${amount} rejected`, base(`
    <p>Hi ${esc(name)},</p>
    <p>Your withdrawal request of <strong>${esc(amount)}</strong> has been rejected and the funds have been returned to your wallet. Please contact support if you have questions.</p>
    <a href="${APP_URL}/investor/portfolio" style="display:inline-block;background:#1A2B1F;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">View Wallet</a>
  `));
}

export async function sendDistributionReceived(to: string, name: string, amount: string, investmentTitle: string) {
  await send(to, `Distribution received: ${amount}`, base(`
    <p>Hi ${esc(name)},</p>
    <p>You've received a distribution of <strong>${esc(amount)}</strong> from <strong>${esc(investmentTitle)}</strong>. The funds have been credited to your wallet.</p>
    <a href="${APP_URL}/investor/portfolio" style="display:inline-block;background:#1A2B1F;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">View Portfolio</a>
  `));
}

export async function sendProposalVoteOpened(to: string, name: string, investmentTitle: string, investmentId: string) {
  await send(to, `Vote opened: ${investmentTitle}`, base(`
    <p>Hi ${esc(name)},</p>
    <p>A governance proposal for <strong>${esc(investmentTitle)}</strong> is now open for voting. As a co-owner, your vote counts.</p>
    <a href="${APP_URL}/investments/${investmentId}" style="display:inline-block;background:#1A2B1F;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">View & Vote</a>
  `));
}

export async function sendPasswordReset(to: string, name: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await send(to, 'Reset your password', base(`
    <p>Hi ${esc(name)},</p>
    <p>We received a request to reset your password. Click the button below — this link expires in 1 hour.</p>
    <a href="${url}" style="display:inline-block;background:#1A2B1F;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Reset Password</a>
    <p style="color:#8A7A60;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
  `));
}

export async function sendEmailVerification(to: string, name: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  await send(to, 'Verify your email address', base(`
    <p>Hi ${esc(name)},</p>
    <p>Please verify your email address to complete your registration.</p>
    <a href="${url}" style="display:inline-block;background:#1A2B1F;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email</a>
    <p style="color:#8A7A60;font-size:12px">This link expires in 24 hours.</p>
  `));
}

export async function sendSupplementFinalised(to: string, name: string, investmentTitle: string, investmentId: string) {
  await send(to, `Your ownership in ${investmentTitle} has been confirmed`, base(`
    <p>Hi ${esc(name)},</p>
    <p>Your ownership in <strong>${esc(investmentTitle)}</strong> has been confirmed. Your Co-Ownership Supplement has been finalised and is now available in My Documents.</p>
    <p>You can download your finalised supplement, which includes the confirmed ownership register, from your account settings.</p>
    <a href="${APP_URL}/investor/settings" style="display:inline-block;background:#1A2B1F;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">View My Documents</a>
  `));
}

export async function sendInvestmentUpdate(to: string, name: string, investmentTitle: string, updateTitle: string, investmentId: string) {
  await send(to, `Update: ${investmentTitle}`, base(`
    <p>Hi ${esc(name)},</p>
    <p>There's a new update on <strong>${esc(investmentTitle)}</strong>:</p>
    <p style="background:#F7F4EE;padding:16px;border-radius:8px;border-left:3px solid #C9A84C"><strong>${esc(updateTitle)}</strong></p>
    <a href="${APP_URL}/investments/${investmentId}" style="display:inline-block;background:#1A2B1F;color:#C9A84C;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">View Update</a>
  `));
}
