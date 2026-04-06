import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, AmountBlock, Divider, SectionHeading, InfoTable, S, C } from '../base';

interface Props { name: string; amount: string; }

export default function WithdrawalApproved({ name, amount }: Props) {
  return (
    <Base preview={`Your withdrawal of ${amount} has been approved`}>
      <Text style={S.eyebrow}>Withdrawal</Text>
      <SectionHeading title="Withdrawal approved" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeSuccess}>✓ Approved</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        Your withdrawal request has been reviewed and approved. The funds are
        being transferred to your nominated bank account.
      </Text>

      <AmountBlock label="Withdrawal Amount" amount={amount} />

      <InfoTable rows={[
        ['Status', 'Approved & Processing', C.green],
        ['Estimated Arrival', '1 – 3 business days'],
        ['Destination', 'Your nominated bank account'],
      ]} />

      <Divider />

      <Text style={S.note}>
        Transfer times may vary depending on your financial institution. If
        the funds do not arrive within 3 business days, please contact our
        support team with your withdrawal reference.
      </Text>
    </Base>
  );
}
