import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C } from '../base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pooledwealth.com';

interface Props {
  name: string;
}

export default function KycApproved({ name }: Props) {
  return (
    <Base preview="Your identity has been verified — you can now invest on Pooled Wealth">
      <Text style={S.greeting}>Dear {name},</Text>

      {/* Status badge */}
      <Section style={{ margin: '0 0 24px' }}>
        <Text style={S.badgeSuccess}>✓ Identity Verified</Text>
      </Section>

      <Text style={S.paragraph}>
        Your identity verification has been reviewed and approved. You now have full
        access to invest across all available assets on the Pooled Wealth platform.
      </Text>
      <Text style={S.paragraph}>
        You may browse current opportunities, commit to investments, and manage your
        portfolio at any time.
      </Text>

      <CtaButton href={`${APP_URL}/investments`}>Browse Investment Opportunities</CtaButton>

      <Divider gold />

      <Text style={{ ...S.paragraph, fontSize: '13px', color: C.inkLight }}>
        If you have any questions about the verification process or your account,
        please contact our support team.
      </Text>
    </Base>
  );
}
