import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, AmountBlock, CtaButton, Divider, SectionHeading, S, APP_URL } from '../base';

interface Props {
  name: string;
  amount: number;
  frequency: string;
  nextExpectedDate: Date;
}

export default function RecurringDepositReminder({ name, amount, frequency, nextExpectedDate }: Props) {
  const formatted = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  const freqLabel = frequency === 'WEEKLY' ? 'weekly' : frequency === 'FORTNIGHTLY' ? 'fortnightly' : 'monthly';
  const nextDate = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }).format(nextExpectedDate);

  return (
    <Base preview={`Missed ${freqLabel} deposit reminder — ${formatted} expected`}>
      <Text style={S.eyebrow}>Recurring Deposit</Text>
      <SectionHeading title="Deposit not received" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeWarning}>⚠ Missed deposit</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        We didn&apos;t receive your {freqLabel} bank transfer this period. This is your first missed deposit —
        if a second consecutive deposit is missed, your recurring schedule will be automatically cancelled.
      </Text>

      <AmountBlock label="Expected Amount" amount={formatted} />

      <Text style={S.body_text}>
        Your next expected transfer is due by <strong>{nextDate}</strong>. Please use your unique deposit
        reference code when making the transfer so we can match it to your account.
      </Text>

      <CtaButton href={`${APP_URL}/investor/portfolio`}>View My Wallet</CtaButton>

      <Divider />

      <Text style={S.note}>
        If you&apos;ve already made the transfer, please ensure your deposit reference code is included in the
        payment description. If you&apos;d like to cancel your recurring schedule, you can do so from your wallet.
      </Text>
    </Base>
  );
}
