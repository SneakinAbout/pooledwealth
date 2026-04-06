import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export const PLATFORM = 'Pooled Wealth';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pooledwealth.com';

// ─── Brand Palette ───────────────────────────────────────────────────────────
export const C = {
  navy:      '#1A2B1F',
  navyDeep:  '#111D14',
  gold:      '#C9A84C',
  goldLight: '#D9BC76',
  goldPale:  '#F0E6C8',
  cream:     '#F7F4EE',
  creamDark: '#EDE8DF',
  white:     '#FFFFFF',
  ink:       '#1A1207',
  inkMid:    '#3D2E18',
  inkLight:  '#8A7A60',
  inkFaint:  '#B5A88A',
  green:     '#1E5E38',
  greenBg:   '#E8F5EE',
  red:       '#9B2C2C',
  redBg:     '#FDF0F0',
  amber:     '#92600A',
  amberBg:   '#FEF9EC',
};

// ─── Typography ──────────────────────────────────────────────────────────────
const serif = '"Georgia", "Times New Roman", serif';
const sans  = '"Helvetica Neue", "Arial", sans-serif';

// ─── Shared Style Tokens ─────────────────────────────────────────────────────
export const S = {
  // Layout
  body: {
    backgroundColor: C.cream,
    margin: '0',
    padding: '0',
  } as React.CSSProperties,

  outer: {
    backgroundColor: C.cream,
    padding: '48px 16px 64px',
  } as React.CSSProperties,

  container: {
    backgroundColor: C.white,
    maxWidth: '580px',
    margin: '0 auto',
    borderRadius: '3px',
    overflow: 'hidden',
    boxShadow: '0 2px 16px rgba(26,43,31,0.08), 0 0 0 1px rgba(26,43,31,0.06)',
  } as React.CSSProperties,

  // Header
  header: {
    backgroundColor: C.navy,
    padding: '32px 40px 28px',
  } as React.CSSProperties,

  logoMark: {
    color: C.goldLight,
    fontSize: '10px',
    letterSpacing: '0.35em',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px',
    fontFamily: sans,
    fontWeight: '400',
  } as React.CSSProperties,

  logoText: {
    color: C.gold,
    fontSize: '22px',
    fontWeight: '400',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    margin: '0',
    fontFamily: serif,
    lineHeight: '1',
  } as React.CSSProperties,

  // Gold rule
  goldRule: {
    height: '2px',
    backgroundColor: C.gold,
    border: 'none',
    margin: '0',
    lineHeight: '2px',
    fontSize: '2px',
  } as React.CSSProperties,

  // Body content area
  content: {
    padding: '44px 40px 36px',
  } as React.CSSProperties,

  // Typography
  eyebrow: {
    color: C.inkLight,
    fontSize: '10px',
    letterSpacing: '0.24em',
    textTransform: 'uppercase' as const,
    margin: '0 0 12px',
    fontFamily: sans,
    fontWeight: '500',
  } as React.CSSProperties,

  h1: {
    color: C.ink,
    fontSize: '24px',
    fontWeight: '400',
    lineHeight: '1.35',
    margin: '0 0 24px',
    fontFamily: serif,
  } as React.CSSProperties,

  body_text: {
    color: C.inkMid,
    fontSize: '15px',
    lineHeight: '1.8',
    margin: '0 0 20px',
    fontFamily: serif,
  } as React.CSSProperties,

  note: {
    color: C.inkLight,
    fontSize: '12px',
    lineHeight: '1.7',
    margin: '0',
    fontFamily: sans,
  } as React.CSSProperties,

  // Dividers
  divider: {
    borderTop: `1px solid ${C.creamDark}`,
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    margin: '32px 0',
  } as React.CSSProperties,

  dividerGold: {
    borderTop: `1px solid ${C.gold}`,
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    margin: '32px 0',
    opacity: 0.35,
  } as React.CSSProperties,

  // CTA Button — full width, gold
  btn: {
    backgroundColor: C.gold,
    color: C.navy,
    display: 'block',
    fontFamily: sans,
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.2em',
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '16px 32px',
    borderRadius: '2px',
    margin: '0',
    lineHeight: '1',
  } as React.CSSProperties,

  btnWrap: {
    margin: '32px 0',
  } as React.CSSProperties,

  // Amount block (navy, gold amount)
  amountBlock: {
    backgroundColor: C.navy,
    borderRadius: '3px',
    padding: '28px 32px',
    textAlign: 'center' as const,
    margin: '28px 0',
  } as React.CSSProperties,

  amountLabel: {
    color: C.goldLight,
    fontSize: '10px',
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    margin: '0 0 10px',
    fontFamily: sans,
  } as React.CSSProperties,

  amountValue: {
    color: C.gold,
    fontSize: '36px',
    fontWeight: '400',
    letterSpacing: '0.02em',
    margin: '0',
    fontFamily: serif,
    lineHeight: '1',
  } as React.CSSProperties,

  // Info rows (label / value pairs)
  infoTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    margin: '24px 0',
    border: `1px solid ${C.creamDark}`,
    borderRadius: '3px',
    overflow: 'hidden',
  } as React.CSSProperties,

  infoLabel: {
    color: C.inkLight,
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    fontFamily: sans,
    fontWeight: '500',
    padding: '13px 18px',
    backgroundColor: C.cream,
    borderBottom: `1px solid ${C.creamDark}`,
    width: '40%',
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  infoValue: {
    color: C.ink,
    fontSize: '14px',
    fontFamily: serif,
    padding: '13px 18px',
    borderBottom: `1px solid ${C.creamDark}`,
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  infoValueLast: {
    color: C.ink,
    fontSize: '14px',
    fontFamily: serif,
    padding: '13px 18px',
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  infoLabelLast: {
    color: C.inkLight,
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    fontFamily: sans,
    fontWeight: '500',
    padding: '13px 18px',
    backgroundColor: C.cream,
    width: '40%',
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  // Status badge
  badgeSuccess: {
    display: 'inline-block',
    backgroundColor: C.greenBg,
    color: C.green,
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    padding: '5px 14px',
    fontFamily: sans,
    fontWeight: '700',
    borderRadius: '2px',
    border: `1px solid rgba(30,94,56,0.15)`,
  } as React.CSSProperties,

  badgeError: {
    display: 'inline-block',
    backgroundColor: C.redBg,
    color: C.red,
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    padding: '5px 14px',
    fontFamily: sans,
    fontWeight: '700',
    borderRadius: '2px',
    border: `1px solid rgba(155,44,44,0.15)`,
  } as React.CSSProperties,

  badgeWarning: {
    display: 'inline-block',
    backgroundColor: C.amberBg,
    color: C.amber,
    fontSize: '10px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    padding: '5px 14px',
    fontFamily: sans,
    fontWeight: '700',
    borderRadius: '2px',
    border: `1px solid rgba(146,96,10,0.15)`,
  } as React.CSSProperties,

  // Callout box
  callout: {
    backgroundColor: C.cream,
    borderLeft: `3px solid ${C.gold}`,
    padding: '16px 20px',
    margin: '24px 0',
  } as React.CSSProperties,

  calloutText: {
    color: C.inkMid,
    fontSize: '14px',
    lineHeight: '1.7',
    margin: '0',
    fontFamily: serif,
  } as React.CSSProperties,

  // Footer
  footer: {
    backgroundColor: C.navyDeep,
    padding: '28px 40px',
  } as React.CSSProperties,

  footerText: {
    color: C.inkFaint,
    fontSize: '11px',
    lineHeight: '1.8',
    margin: '0',
    textAlign: 'center' as const,
    fontFamily: sans,
  } as React.CSSProperties,

  footerLink: {
    color: C.gold,
    textDecoration: 'none',
    opacity: 0.85,
    fontSize: '11px',
    fontFamily: sans,
  } as React.CSSProperties,
};

// ─── Base Layout ─────────────────────────────────────────────────────────────
interface BaseProps {
  preview: string;
  children: React.ReactNode;
}

export function Base({ preview, children }: BaseProps) {
  return (
    <Html lang="en">
      <Head>
        <Font fontFamily="Georgia" fallbackFontFamily="serif" webFont={undefined} />
        <style>{`
          @media only screen and (max-width: 620px) {
            .pw-outer { padding: 0 !important; }
            .pw-container { border-radius: 0 !important; box-shadow: none !important; }
            .pw-header { padding: 24px !important; }
            .pw-content { padding: 28px 24px 24px !important; }
            .pw-footer { padding: 24px !important; }
            .pw-btn { font-size: 12px !important; padding: 16px 20px !important; }
            .pw-amount { font-size: 28px !important; }
            .pw-h1 { font-size: 20px !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={S.body}>
        <Section style={S.outer} className="pw-outer">
          <Container style={S.container} className="pw-container">

            {/* ── Header ── */}
            <Section style={S.header} className="pw-header">
              <Text style={S.logoMark}>Private Investment Platform</Text>
              <Text style={S.logoText}>{PLATFORM}</Text>
            </Section>

            {/* ── Gold rule ── */}
            <Section style={{ padding: '0', margin: '0', lineHeight: '0' }}>
              <Hr style={S.goldRule} />
            </Section>

            {/* ── Content ── */}
            <Section style={S.content} className="pw-content">
              {children}
            </Section>

            {/* ── Footer ── */}
            <Section style={S.footer} className="pw-footer">
              <Text style={S.footerText}>
                {'© '}{new Date().getFullYear()}{' '}
                <Link href={APP_URL} style={S.footerLink}>Pooled Wealth</Link>
                {' · All rights reserved'}
              </Text>
              <Text style={{ ...S.footerText, marginTop: '6px', opacity: 0.55 }}>
                {'You are receiving this because you have an account with Pooled Wealth.'}
                <br />{'Please do not reply to this email.'}
              </Text>
            </Section>

          </Container>
        </Section>
      </Body>
    </Html>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

/** Full-width gold CTA button */
export function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={S.btnWrap}>
      <Link href={href} style={S.btn} className="pw-btn">
        {children}
      </Link>
    </Section>
  );
}

/** Navy block with large gold amount */
export function AmountBlock({ label, amount }: { label: string; amount: string }) {
  return (
    <Section style={S.amountBlock}>
      <Text style={S.amountLabel}>{label}</Text>
      <Text style={S.amountValue} className="pw-amount">{amount}</Text>
    </Section>
  );
}

/** Gold-left-bordered callout box */
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <Section style={S.callout}>
      <Text style={S.calloutText}>{children}</Text>
    </Section>
  );
}

/** Horizontal rule */
export function Divider({ gold }: { gold?: boolean }) {
  return <Hr style={gold ? S.dividerGold : S.divider} />;
}

/** Key/value info table — each row is [label, value] */
export function InfoTable({ rows }: { rows: [string, string | React.ReactNode, string?][] }) {
  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={S.infoTable}
    >
      <tbody>
        {rows.map(([label, value, color], i) => {
          const isLast = i === rows.length - 1;
          return (
            <tr key={label}>
              <td style={isLast ? S.infoLabelLast : S.infoLabel}>{label}</td>
              <td style={{
                ...(isLast ? S.infoValueLast : S.infoValue),
                ...(color ? { color } : {}),
                fontWeight: color ? '600' : 'normal',
              }}>
                {value}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Section heading with optional eyebrow label */
export function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <>
      {eyebrow && <Text style={S.eyebrow}>{eyebrow}</Text>}
      <Text style={S.h1} className="pw-h1">{title}</Text>
    </>
  );
}
