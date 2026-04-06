import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, SectionHeading, InfoTable, S, C, APP_URL } from '../base';

interface Props { name: string; investmentTitle: string; }

export default function SupplementFinalised({ name, investmentTitle }: Props) {
  return (
    <Base preview={`Your Co-Ownership Supplement for ${investmentTitle} has been finalised`}>
      <Text style={S.eyebrow}>Ownership Documents</Text>
      <SectionHeading title="Your ownership has been confirmed" />

      <Section style={{ marginBottom: '24px' }}>
        <Text style={S.badgeSuccess}>✓ Finalised</Text>
      </Section>

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        Your co-ownership position in the following asset has been formally confirmed.
        Your Co-Ownership Supplement has been finalised and is now available to
        download from your account documents.
      </Text>

      <InfoTable rows={[
        ['Asset', investmentTitle],
        ['Document', 'Co-Ownership Supplement'],
        ['Status', 'Finalised', C.green],
      ]} />

      <Text style={S.body_text}>
        Your supplement includes the confirmed ownership register and all details
        pertaining to your co-ownership stake. This document serves as formal
        confirmation of your ownership interest and should be retained for your records.
      </Text>

      <CtaButton href={`${APP_URL}/investor/settings`}>Download My Documents</CtaButton>

      <Divider />

      <Text style={S.note}>
        Navigate to <strong>Account Settings → My Documents</strong> to access
        and download your Co-Ownership Supplement.
      </Text>
    </Base>
  );
}
