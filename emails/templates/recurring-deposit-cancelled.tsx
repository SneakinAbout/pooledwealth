import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, SectionHeading, S, APP_URL } from '../base';

interface Props {
  name: string;
  frequency: string;
}

export default function RecurringDepositCancelled({ name, frequency }: Props) {
  const freqLabel = frequency === 'WEEKLY' ? 'weekly' : frequency === 'FORTNIGHTLY' ? 'fortnightly' : 'monthly';

  return (
    <Base preview={`Your ${freqLabel} recurring deposit schedule has been cancelled`}>
      <Text style={S.eyebrow}>Recurring Deposit</Text>
      <SectionHeading title="Recurring schedule cancelled" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeError}>✕ Auto-cancelled</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        Your {freqLabel} recurring deposit schedule has been automatically cancelled after two consecutive
        missed deposits. No further reminders will be sent.
      </Text>

      <Text style={S.body_text}>
        You can set up a new recurring schedule at any time from your wallet. If you believe this was
        cancelled in error, please contact our support team.
      </Text>

      <CtaButton href={`${APP_URL}/investor/portfolio`}>Set Up New Schedule</CtaButton>

      <Divider />

      <Text style={S.note}>
        Your existing wallet balance and investments are unaffected. Only the recurring deposit
        reminder schedule has been cancelled.
      </Text>
    </Base>
  );
}
