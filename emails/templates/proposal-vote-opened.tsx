import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, SectionHeading, InfoTable, S, C, APP_URL } from '../base';

interface Props {
  name: string;
  investmentTitle: string;
  investmentId: string;
}

export default function ProposalVoteOpened({ name, investmentTitle, investmentId }: Props) {
  return (
    <Base preview={`Action required: A governance vote is open for ${investmentTitle}`}>
      <Text style={S.eyebrow}>Governance · Action Required</Text>
      <SectionHeading title="Your vote is now open" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeWarning}>Vote Open</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        A governance proposal has been raised for one of your co-owned assets.
        As a registered co-owner, you are entitled — and encouraged — to cast
        your vote before the closing date.
      </Text>

      <InfoTable rows={[
        ['Investment', investmentTitle],
        ['Vote Status', 'Open — awaiting your response', C.amber],
        ['Your Role', 'Co-owner (voting rights apply)'],
      ]} />

      <Section style={{
        backgroundColor: C.navy,
        borderRadius: '2px',
        padding: '20px 24px',
        margin: '0 0 28px',
      }}>
        <Text style={{ ...S.note, color: C.goldLight, margin: '0 0 6px' }}>
          Important
        </Text>
        <Text style={{ ...S.note, color: C.creamDark, margin: '0', lineHeight: '1.7' }}>
          Votes are binding and cannot be changed once submitted. Please review
          the full proposal before casting your vote.
        </Text>
      </Section>

      <Text style={S.body_text}>
        Review the proposal details, consider the implications for your investment,
        and cast your vote directly from the investment page.
      </Text>

      <CtaButton href={`${APP_URL}/investments/${investmentId}`}>
        View Proposal &amp; Vote
      </CtaButton>

      <Divider />

      <Text style={S.note}>
        You are receiving this notification because you hold a co-ownership position
        in <strong>{investmentTitle}</strong>. Your participation ensures fair
        representation of all co-owners.
      </Text>
    </Base>
  );
}
