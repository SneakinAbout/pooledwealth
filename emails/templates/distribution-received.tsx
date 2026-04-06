import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, AmountBlock, CtaButton, Divider, SectionHeading, InfoTable, S, C, APP_URL } from '../base';

interface Props { name: string; amount: string; investmentTitle: string; }

export default function DistributionReceived({ name, amount, investmentTitle }: Props) {
  return (
    <Base preview={`Distribution of ${amount} received from ${investmentTitle}`}>
      <Text style={S.eyebrow}>Distribution</Text>
      <SectionHeading title="You've received a distribution" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeSuccess}>✓ Credited to Wallet</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        A distribution has been processed for one of your investments.
        The net amount has been credited directly to your Pooled Wealth wallet.
      </Text>

      <AmountBlock label="Distribution Amount" amount={amount} />

      <InfoTable rows={[
        ['Investment', investmentTitle],
        ['Status', 'Credited to Wallet', C.green],
        ['Availability', 'Immediately available'],
      ]} />

      <Text style={S.body_text}>
        These funds are now available in your wallet. You may reinvest across
        available opportunities or submit a withdrawal request at any time.
      </Text>

      <CtaButton href={`${APP_URL}/investor/portfolio`}>View Portfolio</CtaButton>

      <Divider />

      <Text style={S.note}>
        This distribution will appear in your transaction history and returns report.
        Please retain this confirmation for your tax records.
      </Text>
    </Base>
  );
}
