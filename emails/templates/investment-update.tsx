import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C } from '../base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pooledwealth.com';

interface Props {
  name: string;
  investmentTitle: string;
  updateTitle: string;
  investmentId: string;
}

export default function InvestmentUpdate({ name, investmentTitle, updateTitle, investmentId }: Props) {
  return (
    <Base preview={`New update on ${investmentTitle}: ${updateTitle}`}>
      <Text style={S.greeting}>Dear {name},</Text>

      <Text style={S.paragraph}>
        A new update has been posted for one of your investments.
      </Text>

      {/* Investment name */}
      <Section style={{
        backgroundColor: C.cream,
        border: `1px solid ${C.creamDark}`,
        padding: '14px 20px',
        borderRadius: '2px',
        margin: '0 0 16px',
      }}>
        <Text style={{ ...S.amountLabel, margin: '0 0 4px' }}>Investment</Text>
        <Text style={{ ...S.paragraph, margin: '0', color: C.inkMid }}>
          {investmentTitle}
        </Text>
      </Section>

      {/* Update title */}
      <Section style={{
        backgroundColor: C.white,
        border: `1px solid ${C.creamDark}`,
        borderLeft: `4px solid ${C.gold}`,
        padding: '18px 20px',
        borderRadius: '0 2px 2px 0',
        margin: '0 0 24px',
      }}>
        <Text style={{ ...S.amountLabel, margin: '0 0 6px' }}>Latest Update</Text>
        <Text style={{ ...S.greeting, margin: '0', fontSize: '17px' }}>
          {updateTitle}
        </Text>
      </Section>

      <Text style={S.paragraph}>
        Log in to your account to read the full update and view any attachments
        or additional information provided by the management team.
      </Text>

      <CtaButton href={`${APP_URL}/investments/${investmentId}`}>View Update</CtaButton>

      <Divider gold />

      <Text style={{ ...S.paragraph, fontSize: '13px', color: C.inkLight }}>
        You are receiving this notification because you hold a position in{' '}
        <strong>{investmentTitle}</strong>. To manage your notification preferences,
        visit your account settings.
      </Text>
    </Base>
  );
}
