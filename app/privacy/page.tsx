import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '12 April 2026';

const sections = [
  {
    title: 'Who We Are',
    content: `Pooled Wealth ("we", "us", "our") operates the Pooled Wealth investment platform at www.pooledwealth.com. We are committed to protecting the privacy of all individuals who interact with our platform in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).

This Privacy Policy explains how we collect, use, store, and disclose your personal information.`,
  },
  {
    title: 'Information We Collect',
    content: `We collect the following categories of personal information:

Identity Information — Full legal name, date of birth, and a copy of your government-issued identification documents (e.g. passport, driver's licence).

Contact Information — Email address, phone number, and residential address.

Financial Information — Bank account name, BSB, and account number (for processing withdrawals). Tax File Number (TFN), stored securely and displayed in masked form.

Investment Activity — Records of investments made, units purchased, distributions received, and transaction history.

KYC Documents — Identity documents you upload as part of our Know Your Customer verification process. These are stored securely and used solely for identity verification purposes.

Technical Data — IP address, browser type, and access logs collected automatically when you use the platform.

We only collect information that is reasonably necessary for our functions and activities.`,
  },
  {
    title: 'How We Use Your Information',
    content: `We use your personal information for the following purposes:

Identity Verification — To verify your identity and comply with our Anti-Money Laundering and Counter-Terrorism Financing obligations.

Account Management — To create and manage your investor account, process transactions, and provide platform services.

Investment Processing — To record and administer your investment holdings, process distributions, and maintain accurate ownership records.

Tax Reporting — Your TFN and investment income information may be used for tax withholding and reporting obligations to the Australian Taxation Office (ATO) as required by law.

Communications — To send you transaction confirmations, account notifications, investment updates, and (where you have opted in) our daily investment digest.

Legal Compliance — To comply with our legal obligations under Australian law.

Platform Improvement — To analyse platform usage and improve our services. This is done using aggregated, de-identified data where possible.`,
  },
  {
    title: 'Disclosure of Your Information',
    content: `We do not sell, rent, or trade your personal information to third parties for marketing purposes.

We may disclose your information to:

Service Providers — Trusted third-party providers who assist us in operating the platform, including our cloud hosting provider (Supabase/AWS), payment processor (Stripe), and email delivery service (Resend). These providers are contractually bound to protect your information.

Regulatory Authorities — Where required by law, we may disclose information to the Australian Taxation Office, AUSTRAC, law enforcement agencies, or other government bodies.

Legal Proceedings — Where required by a court order or other legal process.

We require all third parties to respect the security of your personal information and to treat it in accordance with the law.`,
  },
  {
    title: 'Tax File Number',
    content: `Your Tax File Number (TFN) is collected voluntarily to avoid the application of withholding tax on your investment distributions at the top marginal rate (currently 47%), as required under Australian taxation law.

Your TFN is stored in encrypted form and is never disclosed to any third party except the Australian Taxation Office where legally required. It is displayed in masked form on the platform (e.g. ••• ••• 789).

You are not legally required to provide your TFN, however, failure to do so will result in withholding tax being applied to your distributions.`,
  },
  {
    title: 'Data Security',
    content: `We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, disclosure, alteration, or destruction. These measures include:

— Encrypted database storage (AES-256)
— TLS/HTTPS encryption for all data in transit
— Row-level security on our database
— Secure authentication with hashed passwords
— Access controls limiting staff access to personal data on a need-to-know basis

While we take reasonable steps to protect your information, no internet transmission is completely secure. We cannot guarantee the security of information transmitted to or from our platform.

In the event of a data breach that is likely to result in serious harm, we will notify affected individuals and the Office of the Australian Information Commissioner (OAIC) in accordance with the Notifiable Data Breaches scheme.`,
  },
  {
    title: 'Access and Correction',
    content: `You have the right to access the personal information we hold about you and to request corrections if it is inaccurate, incomplete, or out of date.

You can update most of your personal information directly from your Account Settings page. For requests relating to information you cannot update yourself, or to request access to your full data, please contact us at support@pooledwealth.com.

We will respond to access and correction requests within 30 days. In some circumstances, we may decline a request where permitted under the Privacy Act 1988 (Cth), in which case we will explain our reasons.`,
  },
  {
    title: 'Data Retention',
    content: `We retain your personal information for as long as your account is active and for a period of 7 years after account closure, in accordance with our legal and regulatory obligations under Australian taxation and financial records legislation.

KYC documents are retained for a minimum of 7 years after the end of the customer relationship, as required by the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth).

After the applicable retention period, personal information is securely deleted or de-identified.`,
  },
  {
    title: 'Cookies and Tracking',
    content: `Our platform uses session cookies to maintain your authenticated session. These are strictly necessary for the platform to function and cannot be disabled while using the service.

We do not use advertising cookies, tracking pixels, or third-party analytics tools that track you across other websites.`,
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations. Where changes are material, we will notify registered users by email before the changes take effect.

The current version of this Privacy Policy is always available at www.pooledwealth.com/privacy.`,
  },
  {
    title: 'Complaints',
    content: `If you believe we have not handled your personal information in accordance with the Australian Privacy Principles, you may lodge a complaint with us at support@pooledwealth.com. We will respond within 30 days.

If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.`,
  },
  {
    title: 'Contact Us',
    content: `For all privacy-related enquiries, access requests, or complaints:

Email: support@pooledwealth.com
Platform: www.pooledwealth.com

We are committed to resolving any privacy concerns promptly and transparently.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      {/* Header */}
      <div className="bg-[#1A2B1F] border-b border-[#2E4A35]">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            href="/login"
            className="flex items-center gap-2 text-[#C9A84C] hover:text-[#D4B96A] transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span
            className="text-[#C9A84C] text-lg tracking-widest uppercase"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Pooled Wealth
          </span>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14">

        {/* Title block */}
        <div className="mb-12">
          <p className="text-xs tracking-[0.25em] uppercase text-[#8A7A60] mb-3 font-medium">Legal</p>
          <h1
            className="text-4xl sm:text-5xl text-[#1A1207] leading-tight mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            Privacy Policy
          </h1>
          <div className="w-16 h-0.5 bg-[#C9A84C] mb-5" />
          <p className="text-sm text-[#8A7A60]">
            Last updated: <span className="text-[#6A5A40] font-medium">{LAST_UPDATED}</span>
          </p>
        </div>

        {/* Intro */}
        <div className="bg-white border border-[#E8E2D6] rounded-xl p-6 mb-10">
          <p className="text-[#4A3B28] leading-relaxed text-[15px]">
            This Privacy Policy describes how Pooled Wealth collects, uses, and protects your
            personal information in accordance with the{' '}
            <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
            By using the platform, you consent to the collection and use of your information
            as described in this Policy.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-0">
          {sections.map((section, i) => (
            <div
              key={section.title}
              className="border-b border-[#E8E2D6] py-8"
            >
              <div className="flex gap-5">
                <div className="flex-shrink-0 w-8 pt-0.5">
                  <span
                    className="text-[#C9A84C] text-xl leading-none"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                  >
                    {i + 1}.
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-xl text-[#1A1207] mb-3 leading-snug"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                  >
                    {section.title}
                  </h2>
                  <div className="text-[#4A3B28] text-[15px] leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#E8E2D6]">
          <p className="text-sm text-[#8A7A60] text-center">
            This Privacy Policy is governed by the laws of New South Wales, Australia,
            and complies with the <em>Privacy Act 1988</em> (Cth).
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <Link href="/terms" className="text-sm text-[#C9A84C] hover:text-[#1A2B1F] transition-colors font-medium">
              Terms &amp; Conditions
            </Link>
            <Link href="/login" className="text-sm text-[#8A7A60] hover:text-[#1A2B1F] transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="text-sm text-[#8A7A60] hover:text-[#1A2B1F] transition-colors">
              Create Account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
