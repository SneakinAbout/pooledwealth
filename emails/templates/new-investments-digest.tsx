import { Section, Text, Link, Row, Column } from '@react-email/components';
import * as React from 'react';
import { Base, CtaButton, Divider, S, C } from '../base';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pooledwealth.com';

export interface DigestInvestment {
  id: string;
  title: string;
  category: string;
  pricePerUnit: string;   // formatted, e.g. "$500.00"
  totalUnits: number;
  availableUnits: number;
  targetReturn: string;   // formatted, e.g. "12.50"
  endDate: string;        // formatted, e.g. "30 Jun 2026"
  imageUrl?: string | null;
}

interface Props {
  name: string;
  investments: DigestInvestment[];
  date: string; // e.g. "Saturday, 5 April 2026"
}

export default function NewInvestmentsDigest({ name, investments, date }: Props) {
  const count = investments.length;

  return (
    <Base preview={`${count} new investment${count !== 1 ? 's' : ''} available on Pooled Wealth — ${date}`}>
      <Text style={S.greeting}>Dear {name},</Text>
      <Text style={S.paragraph}>
        {count === 1
          ? 'A new investment opportunity has been listed on the platform today.'
          : `${count} new investment opportunities have been listed on the platform today.`}
        {' '}Below is a summary for your review.
      </Text>

      <Divider gold />

      {/* Investment cards */}
      {investments.map((inv, i) => (
        <Section key={inv.id} style={{
          backgroundColor: i % 2 === 0 ? C.cream : C.white,
          border: `1px solid ${C.creamDark}`,
          borderRadius: '2px',
          marginBottom: '12px',
          overflow: 'hidden',
        }}>
          {/* Category bar */}
          <Section style={{
            backgroundColor: C.navy,
            padding: '8px 20px',
          }}>
            <Text style={{
              ...S.amountLabel,
              color: C.goldLight,
              margin: '0',
              fontSize: '10px',
            }}>
              {inv.category.toUpperCase()}
            </Text>
          </Section>

          {/* Card body */}
          <Section style={{ padding: '16px 20px' }}>
            <Text style={{
              ...S.greeting,
              fontSize: '17px',
              margin: '0 0 12px',
            }}>
              {inv.title}
            </Text>

            {/* Stats row */}
            <Row>
              <Column style={{ width: '33%', paddingRight: '8px' }}>
                <Text style={{ ...S.amountLabel, margin: '0 0 3px' }}>Price / Unit</Text>
                <Text style={{ ...S.paragraph, margin: '0', color: C.ink, fontWeight: '600' }}>
                  {inv.pricePerUnit}
                </Text>
              </Column>
              <Column style={{ width: '33%', paddingRight: '8px' }}>
                <Text style={{ ...S.amountLabel, margin: '0 0 3px' }}>Target Return</Text>
                <Text style={{ ...S.paragraph, margin: '0', color: C.green, fontWeight: '600' }}>
                  {inv.targetReturn}% p.a.
                </Text>
              </Column>
              <Column style={{ width: '33%' }}>
                <Text style={{ ...S.amountLabel, margin: '0 0 3px' }}>Units Available</Text>
                <Text style={{ ...S.paragraph, margin: '0', color: C.ink }}>
                  {inv.availableUnits} of {inv.totalUnits}
                </Text>
              </Column>
            </Row>

            {/* Closing date + CTA */}
            <Section style={{ marginTop: '16px' }}>
              <Text style={{ ...S.note, margin: '0 0 12px', display: 'inline-block' }}>
                Closes: <strong style={{ color: C.inkMid }}>{inv.endDate}</strong>
              </Text>
              <Section style={{ textAlign: 'left' }}>
                <Link
                  href={`${APP_URL}/investments/${inv.id}`}
                  style={{
                    ...S.btn,
                    fontSize: '11px',
                    padding: '10px 24px',
                  }}
                >
                  View Opportunity →
                </Link>
              </Section>
            </Section>
          </Section>
        </Section>
      ))}

      <Divider gold />

      <CtaButton href={`${APP_URL}/investments`}>Browse All Investments</CtaButton>

      <Divider />

      <Text style={S.note}>
        You are receiving this daily digest because you have enabled new investment notifications
        in your account settings. To unsubscribe,{' '}
        <Link href={`${APP_URL}/investor/settings`} style={{ color: C.gold }}>
          update your notification preferences
        </Link>.
      </Text>
    </Base>
  );
}
