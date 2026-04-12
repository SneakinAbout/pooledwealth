import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '12 April 2026';

const sections = [
  {
    title: 'Nature of the Platform',
    content: `Pooled Wealth operates an online platform that facilitates fractional co-ownership of alternative assets, including but not limited to authenticated trading cards, sports memorabilia, luxury watches, sneakers, and other collectibles (collectively, "Assets").

By participating, you acquire fractional units representing a proportional ownership interest in an Asset held by the platform. You do not acquire legal title to the underlying Asset directly. Your ownership interest is recorded on the platform and governed by these Terms and any Co-Ownership Supplement issued to you upon finalisation of a round.`,
  },
  {
    title: 'No Financial Advice',
    content: `Nothing on this platform constitutes financial product advice, investment advice, or a recommendation to invest in any Asset. All information provided is general in nature and does not take into account your personal financial situation, objectives, or needs.

Before making any investment decision, you should consider obtaining independent financial, legal, and taxation advice from a qualified professional. Pooled Wealth does not hold an Australian Financial Services Licence (AFSL) and does not provide licensed financial services.`,
  },
  {
    title: 'Eligibility',
    content: `To register and participate on this platform, you must:

(a) be at least 18 years of age;
(b) be an Australian resident for tax purposes;
(c) have the legal capacity to enter into binding agreements;
(d) not be prohibited by any applicable law from participating in investments of this nature; and
(e) successfully complete our identity verification (KYC) process.

By registering, you represent and warrant that you meet all of the above eligibility requirements. We reserve the right to suspend or terminate accounts that do not meet these requirements.`,
  },
  {
    title: 'Investment Risks',
    content: `Investing in alternative assets carries significant risk. You should only invest amounts you can afford to lose entirely. Key risks include:

Illiquidity — There is no guaranteed secondary market for your units. You may not be able to sell or transfer your interest before the Asset is sold.

Capital Loss — The value of Assets may decline. You may receive less than your original investment, or nothing at all.

Speculative Nature — Alternative assets such as collectibles are speculative investments with valuations that can be highly subjective and volatile.

Concentration Risk — Investing in a single Asset concentrates your risk in that item.

Platform Risk — Pooled Wealth is an early-stage platform. There is a risk that the platform may cease operations.

Past performance of any Asset or asset class is not indicative of future performance.`,
  },
  {
    title: 'KYC and AML Compliance',
    content: `Pooled Wealth is committed to compliance with the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth) and related regulations. All investors are required to complete identity verification before investing.

You must provide accurate, complete, and up-to-date identification documents. We may suspend access to your account if we are unable to verify your identity or if we have reasonable grounds to suspect fraudulent or unlawful activity.

We reserve the right to report suspicious activity to relevant authorities as required by law.`,
  },
  {
    title: 'Fees',
    content: `The following fees apply to your investment:

Management Fee — An annual management fee (charged monthly) applies to the value of your holdings in Active and Closed investments. The current rate is displayed in the platform's fee settings and may be updated from time to time with notice.

Profit Share — Upon distribution of sale proceeds, a profit share is deducted from the profit component of your distribution (being proceeds in excess of your cost basis). The applicable rate is displayed on each investment and at the time of distribution.

No entry or exit fees apply. All fees are disclosed before you invest. We reserve the right to amend our fee structure with at least 30 days' notice to registered investors.`,
  },
  {
    title: 'Distributions and Returns',
    content: `Distributions represent your proportional share of proceeds received from the sale of an Asset, net of applicable fees. Distributions are not guaranteed and are entirely dependent on the performance and eventual sale of the underlying Asset.

Target returns displayed on the platform are estimates only, based on historical market data and management assumptions. They are not a promise, guarantee, or forecast of actual returns.

We do not guarantee that any Asset will be sold, that any distribution will be made, or that you will recover your capital.`,
  },
  {
    title: 'Dispute Resolution',
    content: `If you have a complaint or dispute, please contact us in the first instance at support@pooledwealth.com. We will endeavour to respond within 10 business days.

If we are unable to resolve your complaint to your satisfaction, you may seek independent legal advice or pursue resolution through the Australian courts.

Disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of New South Wales, Australia.`,
  },
  {
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law, Pooled Wealth, its directors, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the platform or your investment in any Asset.

Our total liability to you for any claim arising under these Terms shall not exceed the amount you have deposited on the platform in the 12 months prior to the claim.

Nothing in these Terms excludes or limits liability that cannot be excluded under Australian Consumer Law or other applicable legislation.`,
  },
  {
    title: 'Amendments',
    content: `We may update these Terms from time to time. Where changes are material, we will notify registered users by email at least 14 days before the changes take effect. Continued use of the platform after that date constitutes acceptance of the updated Terms.

The current version of these Terms is always available at www.pooledwealth.com/terms.`,
  },
  {
    title: 'Governing Law',
    content: `These Terms and Conditions are governed by the laws of New South Wales, Australia. Any disputes arising in connection with these Terms are subject to the non-exclusive jurisdiction of the courts of New South Wales.`,
  },
  {
    title: 'Contact',
    content: `For any queries relating to these Terms and Conditions, please contact us at:

Email: support@pooledwealth.com
Platform: www.pooledwealth.com`,
  },
];

export default function TermsPage() {
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
            className="font-display text-[#C9A84C] text-lg tracking-widest uppercase"
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
            Terms &amp; Conditions
          </h1>
          {/* Gold rule */}
          <div className="w-16 h-0.5 bg-[#C9A84C] mb-5" />
          <p className="text-sm text-[#8A7A60]">
            Last updated: <span className="text-[#6A5A40] font-medium">{LAST_UPDATED}</span>
          </p>
        </div>

        {/* Intro */}
        <div className="bg-white border border-[#E8E2D6] rounded-xl p-6 mb-10">
          <p className="text-[#4A3B28] leading-relaxed text-[15px]">
            Please read these Terms and Conditions carefully before using the Pooled Wealth platform.
            By registering an account or investing through the platform, you agree to be bound by
            these Terms. If you do not agree, do not use the platform.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-0">
          {sections.map((section, i) => (
            <div
              key={section.title}
              className="border-b border-[#E8E2D6] py-8 first:pt-0"
            >
              <div className="flex gap-5">
                {/* Number */}
                <div className="flex-shrink-0 w-8 pt-0.5">
                  <span
                    className="text-[#C9A84C] text-xl leading-none"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                  >
                    {i + 1}.
                  </span>
                </div>
                {/* Content */}
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

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-[#E8E2D6]">
          <p className="text-sm text-[#8A7A60] text-center">
            By using Pooled Wealth, you acknowledge that you have read, understood, and agree to
            these Terms and Conditions.
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <Link href="/privacy" className="text-sm text-[#C9A84C] hover:text-[#1A2B1F] transition-colors font-medium">
              Privacy Policy
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
