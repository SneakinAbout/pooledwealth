import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, AmountBlock, Divider, S, C } from '../base';

interface Props {
  name: string;
  amount: string;
}

export default function WithdrawalApproved({ name, amount }: Props) {
  return (
    <Base preview={`Your withdrawal of ${amount} has been approved`}>
      <Text style={S.greeting}>Dear {name},</Text>

      <Section style={{ margin: '0 0 24px' }}>
        <Text style={S.badgeSuccess}>✓ Withdrawal Approved</Text>
      </Section>

      <Text style={S.paragraph}>
        Your withdrawal request has been approved and is being processed. The funds
        will be transferred to your nominated bank account shortly.
      </Text>

      <AmountBlock label="Withdrawal Amount" amount={amount} />

      <Section style={{
        backgroundColor: C.cream,
        border: `1px solid ${C.creamDark}`,
        padding: '16px 20px',
        borderRadius: '2px',
        margin: '0 0 24px',
      }}>
        <Text style={{ ...S.amountLabel, margin: '0 0 4px' }}>Estimated Transfer Time</Text>
        <Text style={{ ...S.paragraph, margin: '0', color: C.ink }}>1 – 3 business days</Text>
      </Section>

      <Text style={{ ...S.paragraph, fontSize: '13px', color: C.inkLight }}>
        Transfer times may vary depending on your financial institution. If you do not
        receive your funds within 3 business days, please contact our support team.
      </Text>

      <Divider gold />

      <Text style={{ ...S.paragraph, fontSize: '13px', color: C.inkLight }}>
        This withdrawal will appear in your transaction history. Please retain this
        confirmation for your records.
      </Text>
    </Base>
  );
}
