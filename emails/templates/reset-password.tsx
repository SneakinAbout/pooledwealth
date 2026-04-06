import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, SectionHeading, S, C } from '../base';

interface Props { name: string; url: string; }

export default function ResetPassword({ name, url }: Props) {
  return (
    <Base preview="Reset your Pooled Wealth password — link expires in 1 hour">
      <Text style={S.eyebrow}>Security</Text>
      <SectionHeading title="Reset your password" />

      <Text style={S.body_text}>Dear {name},</Text>
      <Text style={S.body_text}>
        We received a request to reset the password for your Pooled Wealth account.
        Click the button below to set a new password.
      </Text>

      <Section style={{
        backgroundColor: C.amberBg,
        border: `1px solid rgba(146,96,10,0.2)`,
        borderLeft: `3px solid ${C.amber}`,
        padding: '14px 20px',
        margin: '0 0 28px',
        borderRadius: '0 2px 2px 0',
      }}>
        <Text style={{ ...S.note, color: C.amber, fontWeight: '600' }}>
          ⏱ This link expires in 1 hour.
        </Text>
      </Section>

      <CtaButton href={url}>Reset Password</CtaButton>

      <Divider gold />

      <Text style={S.note}>
        If the button above doesn't work, copy and paste this link into your browser:
      </Text>
      <Text style={{ ...S.note, color: C.gold, wordBreak: 'break-all', marginTop: '6px' }}>
        {url}
      </Text>

      <Divider />

      <Text style={S.note}>
        If you did not request a password reset, please ignore this email — your
        current password will remain unchanged. If you're concerned about your
        account security, please contact our support team immediately.
      </Text>
    </Base>
  );
}
