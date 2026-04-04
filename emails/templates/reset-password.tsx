import { Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C } from '../base';

interface Props {
  name: string;
  url: string;
}

export default function ResetPassword({ name, url }: Props) {
  return (
    <Base preview="Reset your Pooled Wealth password — link expires in 1 hour">
      <Text style={S.greeting}>Dear {name},</Text>
      <Text style={S.paragraph}>
        We received a request to reset the password associated with your Pooled Wealth account.
        Click the button below to choose a new password.
      </Text>
      <Text style={{
        ...S.paragraph,
        backgroundColor: '#FFF8EC',
        border: '1px solid #E8D9B0',
        borderLeft: `3px solid ${C.gold}`,
        padding: '12px 16px',
        borderRadius: '0 2px 2px 0',
        fontSize: '13px',
      }}>
        ⏱ This link expires in <strong>1 hour</strong> for your security.
      </Text>

      <CtaButton href={url}>Reset Password</CtaButton>

      <Divider gold />

      <Text style={S.note}>
        If you're having trouble clicking the button, copy and paste this link into your browser:
      </Text>
      <Text style={{ ...S.note, color: C.gold, wordBreak: 'break-all' }}>
        {url}
      </Text>

      <Divider />

      <Text style={S.note}>
        If you did not request a password reset, please ignore this email — your password
        will remain unchanged. If you're concerned about your account security, please
        contact our support team.
      </Text>
    </Base>
  );
}
