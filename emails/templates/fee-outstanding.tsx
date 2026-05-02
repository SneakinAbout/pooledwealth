import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, AmountBlock, CtaButton, Divider, SectionHeading, S, APP_URL } from '../base';

interface Props { name: string; amount: string; }

export default function FeeOutstanding({ name, amount }: Props) {
  return (
    <Base preview={`Action required: management fee of ${amount} could not be collected`}>
      <Text style={S.eyebrow}>Account</Text>
      <SectionHeading title="Management fee unpaid" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeWarning}>⚠ Action required</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        Your monthly management fee was due but could not be collected because your
        wallet had insufficient funds. The amount has been added to your outstanding
        balance and will be automatically deducted on your next deposit.
      </Text>

      <AmountBlock label="Outstanding Fee" amount={amount} />

      <Text style={S.body_text}>
        To clear this balance, simply make a deposit to your Pooled Wealth wallet.
        The fee will be collected automatically before your available balance is updated.
      </Text>

      <CtaButton href={`${APP_URL}/wallet`}>Top Up Wallet</CtaButton>

      <Divider />

      <Text style={S.note}>
        If you believe this fee has been charged in error, or have questions about
        your fee rate, please contact our support team.
      </Text>
    </Base>
  );
}
