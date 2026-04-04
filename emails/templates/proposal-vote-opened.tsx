import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C } from '../base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pooledwealth.com';

interface Props {
  name: string;
  investmentTitle: string;
  investmentId: string;
}

export default function ProposalVoteOpened({ name, investmentTitle, investmentId }: Props) {
  return (
    <Base preview={`Your vote is required: a governance proposal is open for ${investmentTitle}`}>
      <Text style={S.greeting}>Dear {name},</Text>

      <Section style={{
        backgroundColor: C.navy,
        padding: '20px 28px',
        borderRadius: '2px',
        margin: '0 0 24px',
        borderLeft: `4px solid ${C.gold}`,
      }}>
        <Text style={{ ...S.amountLabel, color: C.goldLight, margin: '0 0 4px' }}>
          Action Required
        </Text>
        <Text style={{ ...S.amount, color: C.white, fontSize: '16px' }}>
          Governance Proposal — Vote Now Open
        </Text>
      </Section>

      <Text style={S.paragraph}>
        A governance proposal has been raised for one of your co-owned assets.
        As a registered co-owner, your vote carries weight in this decision.
      </Text>

      {/* Investment name */}
      <Section style={{
        backgroundColor: C.cream,
        border: `1px solid ${C.creamDark}`,
        padding: '14px 20px',
        borderRadius: '2px',
        margin: '0 0 24px',
      }}>
        <Text style={{ ...S.amountLabel, margin: '0 0 4px' }}>Investment</Text>
        <Text style={{ ...S.paragraph, margin: '0', color: C.ink, fontSize: '16px' }}>
          {investmentTitle}
        </Text>
      </Section>

      <Text style={S.paragraph}>
        Review the proposal details, consider the implications for your investment,
        and cast your vote before the closing date. Votes are binding and cannot be
        changed once submitted.
      </Text>

      <CtaButton href={`${APP_URL}/investments/${investmentId}`}>View Proposal & Vote</CtaButton>

      <Divider gold />

      <Text style={{ ...S.paragraph, fontSize: '13px', color: C.inkLight }}>
        You are receiving this notification because you hold a co-ownership position
        in <strong>{investmentTitle}</strong>. Your participation in governance decisions
        ensures fair representation of all co-owners.
      </Text>
    </Base>
  );
}
