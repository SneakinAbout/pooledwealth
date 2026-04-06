import { Section, Text, Link } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, SectionHeading, S, C } from '../base';

interface Props { name: string; url: string; }

export default function VerifyEmail({ name, url }: Props) {
  return (
    <Base preview="Verify your email to activate your Pooled Wealth account">
      <Text style={S.eyebrow}>Account Setup</Text>
      <SectionHeading title="Verify your email address" />

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        Thank you for registering with Pooled Wealth. To complete your account
        setup and gain access to the platform, please verify your email address
        by clicking the button below.
      </Text>

      <Section style={{
        backgroundColor: C.cream,
        borderLeft: `3px solid ${C.gold}`,
        padding: '14px 20px',
        margin: '0 0 28px',
      }}>
        <Text style={{ ...S.note, color: C.inkMid }}>
          This link expires in <strong>24 hours</strong>.
        </Text>
      </Section>

      <CtaButton href={url}>Verify Email Address</CtaButton>

      <Divider gold />

      <Text style={S.note}>
        If the button above doesn't work, copy and paste this link into your browser:
      </Text>
      <Text style={{ ...S.note, color: C.gold, wordBreak: 'break-all', marginTop: '6px' }}>
        {url}
      </Text>

      <Divider />

      <Text style={S.note}>
        If you did not create a Pooled Wealth account, please disregard this email.
        No action is required and your information will not be retained.
      </Text>
    </Base>
  );
}
