import { Resend } from 'resend';
import { render } from '@react-email/render';

// Templates
import VerifyEmail from '../emails/templates/verify-email';
import ResetPassword from '../emails/templates/reset-password';
import KycApproved from '../emails/templates/kyc-approved';
import DepositApproved from '../emails/templates/deposit-approved';
import DepositRejected from '../emails/templates/deposit-rejected';
import WithdrawalApproved from '../emails/templates/withdrawal-approved';
import WithdrawalRejected from '../emails/templates/withdrawal-rejected';
import DistributionReceived from '../emails/templates/distribution-received';
import SupplementFinalised from '../emails/templates/supplement-finalised';
import InvestmentUpdate from '../emails/templates/investment-update';
import ProposalVoteOpened from '../emails/templates/proposal-vote-opened';

const FROM = process.env.EMAIL_FROM || 'Pooled Wealth <noreply@pooledwealth.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY must be configured in production — email not sent');
    }
    console.log(`\n📧 EMAIL (not sent — RESEND_API_KEY not configured)\nTo: ${to}\nSubject: ${subject}\n`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export async function sendEmailVerification(to: string, name: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  const html = await render(VerifyEmail({ name, url }));
  await send(to, 'Verify your email address', html);
}

export async function sendPasswordReset(to: string, name: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  const html = await render(ResetPassword({ name, url }));
  await send(to, 'Reset your password', html);
}

export async function sendKycApproved(to: string, name: string) {
  const html = await render(KycApproved({ name }));
  await send(to, 'Your identity has been verified ✓', html);
}

export async function sendDepositApproved(to: string, name: string, amount: string) {
  const html = await render(DepositApproved({ name, amount }));
  await send(to, `Deposit of ${amount} approved`, html);
}

export async function sendDepositRejected(to: string, name: string, amount: string) {
  const html = await render(DepositRejected({ name, amount }));
  await send(to, `Deposit of ${amount} could not be processed`, html);
}

export async function sendWithdrawalApproved(to: string, name: string, amount: string) {
  const html = await render(WithdrawalApproved({ name, amount }));
  await send(to, `Withdrawal of ${amount} approved`, html);
}

export async function sendWithdrawalRejected(to: string, name: string, amount: string) {
  const html = await render(WithdrawalRejected({ name, amount }));
  await send(to, `Withdrawal of ${amount} rejected`, html);
}

export async function sendDistributionReceived(to: string, name: string, amount: string, investmentTitle: string) {
  const html = await render(DistributionReceived({ name, amount, investmentTitle }));
  await send(to, `Distribution received: ${amount}`, html);
}

export async function sendSupplementFinalised(to: string, name: string, investmentTitle: string, investmentId: string) {
  const html = await render(SupplementFinalised({ name, investmentTitle }));
  await send(to, `Your ownership in ${investmentTitle} has been confirmed`, html);
}

export async function sendInvestmentUpdate(to: string, name: string, investmentTitle: string, updateTitle: string, investmentId: string) {
  const html = await render(InvestmentUpdate({ name, investmentTitle, updateTitle, investmentId }));
  await send(to, `Update: ${investmentTitle}`, html);
}

export async function sendProposalVoteOpened(to: string, name: string, investmentTitle: string, investmentId: string) {
  const html = await render(ProposalVoteOpened({ name, investmentTitle, investmentId }));
  await send(to, `Vote opened: ${investmentTitle}`, html);
}
