import { Link, Text } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C } from '../base';

interface Props {
  name: string;
  url: string;
}

export default function VerifyEmail({ name, url }: Props) {
  return (
    <Base preview="Verify your email address to activate your Pooled Wealth account">
      <Text style={S.greeting}>Dear {name},</Text>
      <Text style={S.paragraph}>
        Thank you for creating your Pooled Wealth account. To complete your registration
        and gain access to the platform, please verify your email address.
      </Text>
      <Text style={S.paragraph}>
        This verification link will expire in <strong>24 hours</strong>.
      </Text>

      <CtaButton href={url}>Verify Email Address</CtaButton>

      <Divider gold />

      <Text style={S.note}>
        If you're having trouble clicking the button, copy and paste this link into your browser:
      </Text>
      <Text style={{ ...S.note, color: C.gold, wordBreak: 'break-all' }}>
        {url}
      </Text>

      <Divider />

      <Text style={S.note}>
        If you did not create a Pooled Wealth account, you can safely disregard this email.
        No action is required.
      </Text>
    </Base>
  );
}
