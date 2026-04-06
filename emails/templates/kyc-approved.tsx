import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, SectionHeading, InfoTable, S, C, APP_URL } from '../base';

interface Props { name: string; }

export default function KycApproved({ name }: Props) {
  return (
    <Base preview="Your identity has been verified — you can now invest on Pooled Wealth">
      <Text style={S.eyebrow}>Identity Verification</Text>
      <SectionHeading title="Your identity has been verified" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeSuccess}>✓ Verified</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        Your identity documents have been reviewed and approved. You now have full
        access to invest across all available asset opportunities on the Pooled Wealth platform.
      </Text>

      <InfoTable rows={[
        ['Status', 'Approved', C.green],
        ['Access Level', 'Full Investor Access'],
        ['Next Step', 'Browse & invest in available opportunities'],
      ]} />

      <Text style={S.body_text}>
        You may now browse current opportunities, commit capital, and track your
        portfolio at any time from your investor dashboard.
      </Text>

      <CtaButton href={`${APP_URL}/investments`}>Browse Investment Opportunities</CtaButton>

      <Divider />

      <Text style={S.note}>
        If you have any questions about your account or the verification process,
        please don't hesitate to contact our support team.
      </Text>
    </Base>
  );
}
