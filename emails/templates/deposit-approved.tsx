import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, AmountBlock, CtaButton, Divider, S, C } from '../base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pooledwealth.com';

interface Props {
  name: string;
  amount: string;
}

export default function DepositApproved({ name, amount }: Props) {
  return (
    <Base preview={`Your deposit of ${amount} has been approved and credited to your wallet`}>
      <Text style={S.greeting}>Dear {name},</Text>

      <Section style={{ margin: '0 0 24px' }}>
        <Text style={S.badgeSuccess}>✓ Deposit Approved</Text>
      </Section>

      <Text style={S.paragraph}>
        Your bank transfer deposit has been reviewed and approved. The funds have been
        credited to your Pooled Wealth wallet and are available for investment.
      </Text>

      <AmountBlock label="Amount Credited" amount={amount} />

      <Text style={S.paragraph}>
        You may now deploy these funds across available investment opportunities on the platform.
      </Text>

      <CtaButton href={`${APP_URL}/investments`}>Browse Investments</CtaButton>

      <Divider gold />

      <Text style={{ ...S.paragraph, fontSize: '13px', color: C.inkLight }}>
        This deposit will appear in your transaction history. If you believe there
        is a discrepancy, please contact our support team.
      </Text>
    </Base>
  );
}
