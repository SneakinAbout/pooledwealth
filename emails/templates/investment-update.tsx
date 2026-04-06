import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, SectionHeading, S, C, APP_URL } from '../base';

interface Props {
  name: string;
  investmentTitle: string;
  updateTitle: string;
  investmentId: string;
}

export default function InvestmentUpdate({ name, investmentTitle, updateTitle, investmentId }: Props) {
  return (
    <Base preview={`New update on ${investmentTitle}: ${updateTitle}`}>
      <Text style={S.eyebrow}>Investment Update</Text>
      <SectionHeading title="A new update has been posted" />

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        The management team has posted a new update for one of your investments.
      </Text>

      {/* Investment name */}
      <Section style={{
        backgroundColor: C.cream,
        border: `1px solid ${C.creamDark}`,
        padding: '14px 20px',
        margin: '0 0 12px',
        borderRadius: '2px',
      }}>
        <Text style={{ ...S.note, margin: '0 0 4px', color: C.inkLight }}>Investment</Text>
        <Text style={{ ...S.body_text, margin: '0', color: C.inkMid, fontSize: '14px' }}>
          {investmentTitle}
        </Text>
      </Section>

      {/* Update title — the hero callout */}
      <Section style={{
        backgroundColor: C.navy,
        borderRadius: '2px',
        padding: '24px 24px',
        margin: '0 0 28px',
      }}>
        <Text style={{ ...S.note, color: C.goldLight, margin: '0 0 8px', letterSpacing: '0.18em' }}>
          Latest Update
        </Text>
        <Text style={{
          color: C.white,
          fontSize: '18px',
          fontFamily: '"Georgia", "Times New Roman", serif',
          lineHeight: '1.4',
          margin: '0',
          fontWeight: '400',
        }}>
          {updateTitle}
        </Text>
      </Section>

      <Text style={S.body_text}>
        Log in to your account to read the full update, view any attached
        documents, and stay informed about your investment.
      </Text>

      <CtaButton href={`${APP_URL}/investments/${investmentId}`}>Read Full Update</CtaButton>

      <Divider />

      <Text style={S.note}>
        You are receiving this notification because you hold a position in{' '}
        <strong>{investmentTitle}</strong>. To manage your notification preferences,
        visit your account settings.
      </Text>
    </Base>
  );
}
