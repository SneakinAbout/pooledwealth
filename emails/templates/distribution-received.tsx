import { Row, Column, Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, AmountBlock, CtaButton, Divider, S, C } from '../base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pooledwealth.com';

interface Props {
  name: string;
  amount: string;
  investmentTitle: string;
}

export default function DistributionReceived({ name, amount, investmentTitle }: Props) {
  return (
    <Base preview={`You've received a distribution of ${amount} from ${investmentTitle}`}>
      <Text style={S.greeting}>Dear {name},</Text>

      <Section style={{ margin: '0 0 24px' }}>
        <Text style={S.badgeSuccess}>✓ Distribution Received</Text>
      </Section>

      <Text style={S.paragraph}>
        A distribution has been processed and the funds have been credited to
        your Pooled Wealth wallet.
      </Text>

      <AmountBlock label="Distribution Amount" amount={amount} />

      <Section style={{
        backgroundColor: C.cream,
        border: `1px solid ${C.creamDark}`,
        padding: '16px 20px',
        borderRadius: '2px',
        margin: '0 0 24px',
      }}>
        <Text style={{ ...S.amountLabel, margin: '0 0 4px' }}>Investment</Text>
        <Text style={{ ...S.paragraph, margin: '0', color: C.ink, fontSize: '16px' }}>
          {investmentTitle}
        </Text>
      </Section>

      <Text style={S.paragraph}>
        These funds are now available in your wallet. You may reinvest them
        across available opportunities or submit a withdrawal request at any time.
      </Text>

      <CtaButton href={`${APP_URL}/investor/portfolio`}>View Portfolio</CtaButton>

      <Divider gold />

      <Text style={{ ...S.paragraph, fontSize: '13px', color: C.inkLight }}>
        This distribution will appear in your transaction history and returns report.
        Please retain this confirmation for tax purposes.
      </Text>
    </Base>
  );
}
