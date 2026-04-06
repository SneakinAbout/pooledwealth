import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

const PLATFORM = 'Pooled Wealth';

// ─── Palette ────────────────────────────────────────────────────────────────
export const C = {
  navy:       '#1A2B1F',
  navyLight:  '#243527',
  gold:       '#C9A84C',
  goldLight:  '#D4B96A',
  cream:      '#F7F4EE',
  creamDark:  '#EDE8DF',
  ink:        '#1A1207',
  inkMid:     '#4A3B28',
  inkLight:   '#8A7A60',
  white:      '#FFFFFF',
  red:        '#B94040',
  green:      '#2A6B45',
};

// ─── Shared styles ───────────────────────────────────────────────────────────
export const S = {
  body: {
    backgroundColor: C.cream,
    margin: '0',
    padding: '0',
    fontFamily: '"Georgia", "Times New Roman", serif',
  } as React.CSSProperties,

  outer: {
    backgroundColor: C.cream,
    padding: '40px 0 60px',
  } as React.CSSProperties,

  container: {
    backgroundColor: C.white,
    maxWidth: '600px',
    margin: '0 auto',
    borderRadius: '2px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(26,43,31,0.10)',
    border: `1px solid ${C.creamDark}`,
  } as React.CSSProperties,

  // Header
  header: {
    backgroundColor: C.navy,
    padding: '0',
  } as React.CSSProperties,

  headerInner: {
    padding: '28px 40px',
  } as React.CSSProperties,

  logoText: {
    color: C.gold,
    fontSize: '20px',
    fontWeight: '400',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    margin: '0',
    fontFamily: '"Georgia", "Times New Roman", serif',
  } as React.CSSProperties,

  logoSub: {
    color: C.goldLight,
    fontSize: '9px',
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    margin: '3px 0 0',
    opacity: 0.7,
    fontFamily: '"Arial", sans-serif',
  } as React.CSSProperties,

  // Gold accent bar below header
  accentBar: {
    height: '3px',
    backgroundColor: C.gold,
    lineHeight: '3px',
    fontSize: '3px',
  } as React.CSSProperties,

  // Body
  body_inner: {
    padding: '40px 40px 32px',
  } as React.CSSProperties,

  greeting: {
    color: C.ink,
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 20px',
    fontFamily: '"Georgia", "Times New Roman", serif',
  } as React.CSSProperties,

  paragraph: {
    color: C.inkMid,
    fontSize: '15px',
    lineHeight: '1.75',
    margin: '0 0 20px',
    fontFamily: '"Georgia", "Times New Roman", serif',
  } as React.CSSProperties,

  // CTA Button
  btnWrap: {
    textAlign: 'center' as const,
    margin: '32px 0',
  } as React.CSSProperties,

  btn: {
    backgroundColor: C.gold,
    color: C.navy,
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
    padding: '14px 36px',
    borderRadius: '1px',
    display: 'inline-block',
    fontFamily: '"Arial", sans-serif',
  } as React.CSSProperties,

  // Highlight box (cream)
  highlight: {
    backgroundColor: C.cream,
    border: `1px solid ${C.creamDark}`,
    borderLeft: `3px solid ${C.gold}`,
    padding: '16px 20px',
    margin: '24px 0',
    borderRadius: '0 2px 2px 0',
  } as React.CSSProperties,

  highlightText: {
    color: C.ink,
    fontSize: '15px',
    margin: '0',
    fontFamily: '"Georgia", "Times New Roman", serif',
  } as React.CSSProperties,

  // Amount display
  amount: {
    color: C.navy,
    fontSize: '28px',
    fontWeight: '400',
    letterSpacing: '0.04em',
    margin: '0',
    fontFamily: '"Georgia", "Times New Roman", serif',
  } as React.CSSProperties,

  amountLabel: {
    color: C.inkLight,
    fontSize: '11px',
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    margin: '0 0 6px',
    fontFamily: '"Arial", sans-serif',
  } as React.CSSProperties,

  // Divider
  hr: {
    borderColor: C.creamDark,
    borderTopWidth: '1px',
    margin: '32px 0',
  } as React.CSSProperties,

  hrGold: {
    borderColor: C.gold,
    borderTopWidth: '1px',
    margin: '32px 0',
    opacity: 0.4,
  } as React.CSSProperties,

  // Footer
  footer: {
    backgroundColor: C.navy,
    padding: '24px 40px',
  } as React.CSSProperties,

  footerText: {
    color: C.inkLight,
    fontSize: '11px',
    lineHeight: '1.7',
    margin: '0',
    textAlign: 'center' as const,
    fontFamily: '"Arial", sans-serif',
    letterSpacing: '0.02em',
  } as React.CSSProperties,

  footerBrand: {
    color: C.gold,
    fontSize: '11px',
    textDecoration: 'none',
    opacity: 0.8,
  } as React.CSSProperties,

  // Small note
  note: {
    color: C.inkLight,
    fontSize: '12px',
    lineHeight: '1.6',
    margin: '16px 0 0',
    fontFamily: '"Arial", sans-serif',
  } as React.CSSProperties,

  // Status badge
  badgeSuccess: {
    display: 'inline-block',
    backgroundColor: '#EAF4EE',
    color: C.green,
    fontSize: '11px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    padding: '4px 12px',
    borderRadius: '2px',
    fontFamily: '"Arial", sans-serif',
    fontWeight: '700',
  } as React.CSSProperties,

  badgeError: {
    display: 'inline-block',
    backgroundColor: '#FAEAEA',
    color: C.red,
    fontSize: '11px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    padding: '4px 12px',
    borderRadius: '2px',
    fontFamily: '"Arial", sans-serif',
    fontWeight: '700',
  } as React.CSSProperties,
};

// ─── Base wrapper component ──────────────────────────────────────────────────
interface BaseProps {
  preview: string;
  children: React.ReactNode;
}

export function Base({ preview, children }: BaseProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Georgia"
          fallbackFontFamily="serif"
          webFont={undefined}
        />
        <style>{`
          @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .email-body { padding: 20px 20px 24px !important; }
            .email-header { padding: 20px !important; }
            .stat-cell { display: block !important; width: 100% !important; padding: 6px 0 !important; }
            .stat-row { display: block !important; width: 100% !important; }
            .btn-full { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
            .card-body { padding: 16px !important; }
            .amount-block { padding: 16px !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={S.body}>
        <Section style={S.outer}>
          <Container style={S.container}>

            {/* Header */}
            <Section style={S.header}>
              <Row>
                <Section style={S.headerInner}>
                  <Text style={S.logoText}>{PLATFORM}</Text>
                  <Text style={S.logoSub}>Private Investment Platform</Text>
                </Section>
              </Row>
            </Section>

            {/* Gold accent bar */}
            <Section style={S.accentBar}>
              <Text style={{ margin: 0, lineHeight: '3px', fontSize: '3px' }}>&nbsp;</Text>
            </Section>

            {/* Email body */}
            <Section style={S.body_inner} className="email-body">
              {children}
            </Section>

            {/* Footer */}
            <Section style={S.footer}>
              <Text style={S.footerText}>
                © {new Date().getFullYear()}{' '}
                <Link href="https://pooledwealth.com" style={S.footerBrand}>
                  Pooled Wealth
                </Link>
                {' '}· All rights reserved
              </Text>
              <Text style={{ ...S.footerText, marginTop: '6px', opacity: 0.6 }}>
                You are receiving this email because you have an account with Pooled Wealth.
                Please do not reply to this email.
              </Text>
            </Section>

          </Container>
        </Section>
      </Body>
    </Html>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={S.btnWrap}>
      <Link href={href} style={S.btn}>
        {children}
      </Link>
    </Section>
  );
}

export function AmountBlock({ label, amount }: { label: string; amount: string }) {
  return (
    <Section style={{
      backgroundColor: C.navy,
      padding: '24px 32px',
      borderRadius: '2px',
      margin: '24px 0',
      textAlign: 'center',
    }}>
      <Text style={{ ...S.amountLabel, color: C.goldLight }}>{label}</Text>
      <Text style={{ ...S.amount, color: C.gold }}>{amount}</Text>
    </Section>
  );
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <Section style={S.highlight}>
      <Text style={S.highlightText}>{children}</Text>
    </Section>
  );
}

export function Divider({ gold }: { gold?: boolean }) {
  return <Hr style={gold ? S.hrGold : S.hr} />;
}

export { PLATFORM };
