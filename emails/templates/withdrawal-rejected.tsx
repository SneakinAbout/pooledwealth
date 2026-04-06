import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, SectionHeading, S, C, APP_URL } from '../base';

interface Props { name: string; amount: string; }

export default function WithdrawalRejected({ name, amount }: Props) {
  return (
    <Base preview={`Your withdrawal request of ${amount} has been rejected — funds returned to your wallet`}>
      <Text style={S.eyebrow}>Withdrawal</Text>
      <SectionHeading title="Withdrawal request rejected" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeError}>Rejected</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        Your withdrawal request of <strong>{amount}</strong> could not be approved
        at this time.
      </Text>

      <Section style={{
        backgroundColor: C.amberBg,
        border: `1px solid rgba(146,96,10,0.15)`,
        borderLeft: `3px solid ${C.gold}`,
        padding: '18px 20px',
        margin: '0 0 28px',
        borderRadius: '0 2px 2px 0',
      }}>
        <Text style={{ ...S.calloutText, color: C.amber, margin: '0 0 4px', fontWeight: '600' }}>
          Funds Returned to Wallet
        </Text>
        <Text style={{ ...S.note, color: C.inkMid, margin: '0' }}>
          The full amount of <strong>{amount}</strong> has been returned to your
          Pooled Wealth wallet and is available immediately.
        </Text>
      </Section>

      <Text style={S.body_text}>
        If you believe this decision was made in error, or if you would like to
        submit a new withdrawal request, please contact our support team or
        visit your account dashboard.
      </Text>

      <CtaButton href={`${APP_URL}/investor/portfolio`}>View Wallet</CtaButton>

      <Divider />

      <Text style={S.note}>
        No funds have been debited from your account. Please allow a moment for
        your wallet balance to update.
      </Text>
    </Base>
  );
}
