import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C } from '../base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pooledwealth.com';

interface Props {
  name: string;
  amount: string;
}

export default function WithdrawalRejected({ name, amount }: Props) {
  return (
    <Base preview={`Your withdrawal request of ${amount} has been rejected — funds returned to wallet`}>
      <Text style={S.greeting}>Dear {name},</Text>

      <Section style={{ margin: '0 0 24px' }}>
        <Text style={S.badgeError}>Withdrawal Rejected</Text>
      </Section>

      <Text style={S.paragraph}>
        Your withdrawal request of <strong>{amount}</strong> has been reviewed and
        could not be approved at this time.
      </Text>

      <Text style={{
        ...S.paragraph,
        backgroundColor: '#FDF5E8',
        border: `1px solid ${C.creamDark}`,
        borderLeft: `3px solid ${C.gold}`,
        padding: '16px 20px',
        borderRadius: '0 2px 2px 0',
      }}>
        The full amount of <strong>{amount}</strong> has been returned to your
        Pooled Wealth wallet and is available immediately.
      </Text>

      <Text style={S.paragraph}>
        If you believe this decision was made in error, or if you would like to
        submit a new withdrawal request, please contact our support team or
        visit your account.
      </Text>

      <CtaButton href={`${APP_URL}/investor/portfolio`}>View Wallet</CtaButton>

      <Divider gold />

      <Text style={{ ...S.paragraph, fontSize: '13px', color: C.inkLight }}>
        No funds have been debited from your account. Please allow a moment for
        your wallet balance to reflect the returned amount.
      </Text>
    </Base>
  );
}
