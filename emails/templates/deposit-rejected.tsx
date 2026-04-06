import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, Divider, SectionHeading, S, C } from '../base';

interface Props { name: string; amount: string; }

export default function DepositRejected({ name, amount }: Props) {
  return (
    <Base preview={`Your deposit of ${amount} could not be processed`}>
      <Text style={S.eyebrow}>Wallet</Text>
      <SectionHeading title="Deposit unsuccessful" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeError}>Unable to Process</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        Unfortunately, we were unable to approve your recent bank transfer deposit
        of <strong>{amount}</strong>. No funds have been credited to your wallet.
      </Text>

      <Section style={{
        backgroundColor: C.redBg,
        border: `1px solid rgba(155,44,44,0.15)`,
        borderLeft: `3px solid ${C.red}`,
        padding: '18px 20px',
        margin: '0 0 24px',
        borderRadius: '0 2px 2px 0',
      }}>
        <Text style={{ ...S.calloutText, color: C.red, margin: '0 0 10px', fontWeight: '600' }}>
          Deposit of {amount} — Not Approved
        </Text>
        <Text style={{ ...S.note, color: C.red, margin: '0' }}>
          Please review the details below and resubmit if required.
        </Text>
      </Section>

      <Text style={{ ...S.body_text, margin: '0 0 10px' }}>
        Common reasons for an unsuccessful deposit:
      </Text>
      <Text style={{ ...S.note, color: C.inkMid, margin: '0 0 6px', paddingLeft: '16px' }}>
        · Incorrect or missing payment reference
      </Text>
      <Text style={{ ...S.note, color: C.inkMid, margin: '0 0 6px', paddingLeft: '16px' }}>
        · Transfer sent from an unrecognised account
      </Text>
      <Text style={{ ...S.note, color: C.inkMid, margin: '0 0 28px', paddingLeft: '16px' }}>
        · Amount does not match a pending deposit request
      </Text>

      <Divider />

      <Text style={S.note}>
        Please contact our support team if you believe this is an error or if
        you require assistance resubmitting your deposit.
      </Text>
    </Base>
  );
}
