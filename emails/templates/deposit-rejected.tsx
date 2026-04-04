import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, Divider, S, C } from '../base';

interface Props {
  name: string;
  amount: string;
}

export default function DepositRejected({ name, amount }: Props) {
  return (
    <Base preview={`Your deposit of ${amount} could not be processed`}>
      <Text style={S.greeting}>Dear {name},</Text>

      <Section style={{ margin: '0 0 24px' }}>
        <Text style={S.badgeError}>Deposit Unsuccessful</Text>
      </Section>

      <Text style={S.paragraph}>
        Unfortunately, we were unable to approve your recent bank transfer deposit
        of <strong>{amount}</strong>.
      </Text>

      <Text style={{
        ...S.paragraph,
        backgroundColor: '#FDF0F0',
        border: '1px solid #E8C8C8',
        borderLeft: `3px solid ${C.red}`,
        padding: '16px 20px',
        borderRadius: '0 2px 2px 0',
      }}>
        Your deposit of <strong>{amount}</strong> could not be processed at this time.
        Please ensure your transfer details match our bank account information exactly.
      </Text>

      <Text style={S.paragraph}>
        Common reasons for an unsuccessful deposit include:
      </Text>

      <Text style={{ ...S.paragraph, margin: '0 0 8px', paddingLeft: '16px' }}>· Incorrect reference number on the transfer</Text>
      <Text style={{ ...S.paragraph, margin: '0 0 8px', paddingLeft: '16px' }}>· Transfer details do not match your account</Text>
      <Text style={{ ...S.paragraph, margin: '0 0 24px', paddingLeft: '16px' }}>· Amount does not match a pending deposit request</Text>

      <Divider gold />

      <Text style={S.paragraph}>
        Please contact our support team if you believe this is an error or require
        assistance resubmitting your deposit.
      </Text>
    </Base>
  );
}
