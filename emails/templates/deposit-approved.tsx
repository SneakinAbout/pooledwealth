import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, AmountBlock, CtaButton, Divider, SectionHeading, S, C, APP_URL } from '../base';

interface Props { name: string; amount: string; }

export default function DepositApproved({ name, amount }: Props) {
  return (
    <Base preview={`Your deposit of ${amount} has been approved and credited to your wallet`}>
      <Text style={S.eyebrow}>Wallet</Text>
      <SectionHeading title="Deposit approved" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeSuccess}>✓ Approved</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        Your bank transfer deposit has been reviewed and approved. The funds have
        been credited to your Pooled Wealth wallet and are immediately available for investment.
      </Text>

      <AmountBlock label="Amount Credited" amount={amount} />

      <Text style={S.body_text}>
        You may now deploy these funds across any available investment opportunities
        on the platform.
      </Text>

      <CtaButton href={`${APP_URL}/investments`}>Browse Investments</CtaButton>

      <Divider />

      <Text style={S.note}>
        This transaction will appear in your wallet history. If you believe there
        is a discrepancy with the credited amount, please contact our support team.
      </Text>
    </Base>
  );
}
