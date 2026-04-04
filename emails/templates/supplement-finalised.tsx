import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C } from '../base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pooledwealth.com';

interface Props {
  name: string;
  investmentTitle: string;
}

export default function SupplementFinalised({ name, investmentTitle }: Props) {
  return (
    <Base preview={`Your Co-Ownership Supplement for ${investmentTitle} has been finalised`}>
      <Text style={S.greeting}>Dear {name},</Text>

      <Section style={{ margin: '0 0 24px' }}>
        <Text style={S.badgeSuccess}>✓ Ownership Confirmed</Text>
      </Section>

      <Text style={S.paragraph}>
        Your co-ownership position in the following asset has been formally confirmed.
        Your Co-Ownership Supplement has been finalised and is now available in
        your account documents.
      </Text>

      <Section style={{
        backgroundColor: C.navy,
        padding: '24px 32px',
        borderRadius: '2px',
        margin: '24px 0',
      }}>
        <Text style={{ ...S.amountLabel, color: C.goldLight, margin: '0 0 6px' }}>
          Confirmed Investment
        </Text>
        <Text style={{ ...S.amount, color: C.white, fontSize: '18px' }}>
          {investmentTitle}
        </Text>
      </Section>

      <Text style={S.paragraph}>
        Your supplement includes the confirmed ownership register and all relevant
        details pertaining to your co-ownership stake. You may download your
        finalised document from <strong>My Documents</strong> in your account settings.
      </Text>

      <CtaButton href={`${APP_URL}/investor/settings`}>Download My Documents</CtaButton>

      <Divider gold />

      <Text style={{ ...S.paragraph, fontSize: '13px', color: C.inkLight }}>
        Please retain your Co-Ownership Supplement for your records. This document
        serves as formal confirmation of your ownership interest in the asset.
      </Text>
    </Base>
  );
}
