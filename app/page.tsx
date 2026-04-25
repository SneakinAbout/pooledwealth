import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Shield, Users, ArrowRight, Layers, Lock, Percent, Package, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const features = [
  { icon: Layers, title: 'Fractional Ownership', desc: 'Buy as little as one share in high-value collectibles previously out of reach.' },
  { icon: Shield, title: 'Fully Authenticated', desc: 'Every item is professionally graded, authenticated, and held in secure storage.' },
  { icon: TrendingUp, title: 'Track Performance', desc: 'Watch your share value grow as the market for rare collectibles continues to surge.' },
  { icon: Users, title: 'Own Alongside Others', desc: 'Join a community of collectors who each hold direct fractional ownership in the same authenticated assets.' },
];

export default async function HomePage() {
  const [featured, stats] = await Promise.all([
    prisma.investment.findMany({
      where: { featuredOnHome: true, status: 'ACTIVE' },
      include: { _count: { select: { holdings: true } } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    Promise.all([
      prisma.holding.aggregate({ _sum: { purchasePrice: true } }),
      prisma.user.count({ where: { role: 'INVESTOR' } }),
      prisma.investment.count({ where: { status: 'ACTIVE' } }),
    ]),
  ]);

  const [aumResult, investorCount, activeAssets] = stats;
  const totalAUM = Number(aumResult._sum.purchasePrice ?? 0);

  return (
    <main className="min-h-screen bg-[#F7F4EE] overflow-x-hidden">

      {/* ─── NAVIGATION ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-20 bg-[#1A2B1F]/95 backdrop-blur-md border-b border-[#2E4A35]/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="dark" size={30} showWordmark />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-[rgba(247,244,238,0.65)] hover:text-[#F7F4EE] border-[#2E4A35]/60">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-24 px-6 overflow-hidden bg-[#111C14]">

        {/* Fine grid background — CSS only */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Radial vignette glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Corner accent lines — art deco feel */}
        <div className="absolute top-20 left-8 w-16 h-16 border-l-2 border-t-2 border-[#C9A84C]/20 pointer-events-none" />
        <div className="absolute top-20 right-8 w-16 h-16 border-r-2 border-t-2 border-[#C9A84C]/20 pointer-events-none" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-[#C9A84C]/20 pointer-events-none" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-[#C9A84C]/20 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Logo mark — large, prominent */}
          <div className="flex justify-center mb-10">
            <Logo variant="dark" size={72} showWordmark={false} />
          </div>

          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 border border-[#C9A84C]/25 bg-[#C9A84C]/8 rounded-full px-4 py-1.5 mb-8">
            <Lock className="h-3 w-3 text-[#C9A84C]" />
            <span className="text-[#C9A84C]/80 text-xs font-medium tracking-widest uppercase">
              Authenticated collectibles · Fractional co-ownership
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="font-display font-bold leading-[1.0] tracking-tight mb-6"
            style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', color: '#F7F4EE' }}
          >
            Own a piece of{' '}
            <span style={{ color: '#C9A84C' }}>what&rsquo;s rare</span>
          </h1>

          {/* Subheadline */}
          <p
            className="max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: 'rgba(247,244,238,0.55)' }}
          >
            Co-own authenticated collectibles alongside other sophisticated investors.
            Rare watches, trading cards, fine art — starting from a single share.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-[#C9A84C] text-[#1A1207] hover:bg-[#E8CFA0] border-0 focus:ring-[#C9A84C]/40 px-8 py-3 text-sm font-semibold tracking-wide"
              >
                Browse Exclusive Assets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="/login"
              className="text-[rgba(247,244,238,0.5)] hover:text-[rgba(247,244,238,0.85)] text-sm transition-colors flex items-center gap-1.5"
            >
              Already a member? Sign in
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 flex flex-col items-center gap-2 text-[rgba(247,244,238,0.25)]">
            <span className="text-[10px] uppercase tracking-widest">Scroll to explore</span>
            <div className="w-px h-8 bg-gradient-to-b from-[rgba(201,168,76,0.4)] to-transparent" />
          </div>
        </div>
      </section>

      {/* ─── LIVE STATS ───────────────────────────────────────────────────── */}
      <section className="py-0 px-6 bg-[#F7F4EE]">
        <div className="max-w-4xl mx-auto -mt-0">
          <div className="grid grid-cols-3 divide-x divide-[#E8E2D6] border border-[#E8E2D6] bg-white rounded-2xl overflow-hidden shadow-sm">
            {[
              {
                value: totalAUM >= 1_000_000
                  ? `$${(totalAUM / 1_000_000).toFixed(1)}M`
                  : totalAUM >= 1_000
                  ? `$${(totalAUM / 1_000).toFixed(0)}K`
                  : formatCurrency(totalAUM),
                label: 'Assets Under Management',
              },
              {
                value: investorCount.toLocaleString(),
                label: 'Co-Owners',
              },
              {
                value: activeAssets.toString(),
                label: 'Active Assets',
              },
            ].map(({ value, label }) => (
              <div key={label} className="py-8 px-6 text-center">
                <div className="font-display text-3xl font-bold text-[#C9A84C] mb-1">{value}</div>
                <div className="text-xs text-[#8A7A60] tracking-wide uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED ASSETS ─────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-2">Curated Collection</p>
              <h2 className="font-display text-4xl font-bold text-[#1A1207]">Featured Assets</h2>
              <p className="text-[#6A5A40] mt-2 text-sm">Currently open for co-investment</p>
            </div>
            <Link href="/investments">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-[#6A5A40] hover:text-[#1A2B1F]">
                View All Assets →
              </Button>
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-20 text-[#8A7A60] text-sm border border-dashed border-[#E8E2D6] rounded-2xl bg-white">
              <div className="h-16 w-16 rounded-2xl bg-[#F7F4EE] flex items-center justify-center mx-auto mb-4">
                <Package className="h-7 w-7 text-[#C9A84C]/40" />
              </div>
              No featured assets yet. Admins can mark assets as featured from the investment management page.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((inv) => {
                const soldShares = inv.totalUnits - inv.availableUnits;
                const pct = Math.round((soldShares / inv.totalUnits) * 100);
                return (
                  <Link key={inv.id} href="/investments">
                    <div className="group bg-white border border-[#E8E2D6] rounded-2xl overflow-hidden hover:border-[#C9A84C]/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
                      <div className="relative h-48 bg-[#EDE6D6] overflow-hidden flex-shrink-0">
                        {inv.imageUrl ? (
                          <Image src={inv.imageUrl} alt={inv.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-12 w-12 text-[#C9A84C]/25" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1207]/50 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="bg-[#1A2B1F] text-[#C9A84C] text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-widest">
                            {inv.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 space-y-3 flex flex-col flex-1">
                        <h3 className="font-semibold text-[#1A1207] leading-snug text-sm line-clamp-2">{inv.title}</h3>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#C9A84C] font-bold font-mono-val">{formatCurrency(Number(inv.pricePerUnit))} / share</span>
                          <span className="text-[#6A5A40] text-xs">{pct}% sold</span>
                        </div>
                        <div className="w-full bg-[#EDE6D6] rounded-full h-1">
                          <div className="h-full rounded-full bg-[#C9A84C] transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-[#8A7A60] tracking-wide uppercase">{soldShares.toLocaleString()} of {inv.totalUnits.toLocaleString()} shares</p>
                        <div className="mt-auto pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-[#1A2B1F] font-semibold">
                          <span>View asset</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#C9A84C] group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#1A2B1F] relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]/70 mb-3">Simple process</p>
            <h2 className="font-display text-5xl font-bold text-[#F7F4EE]">How co-ownership works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-px bg-transparent md:bg-[#2E4A35]/40 rounded-2xl overflow-hidden">
            {[
              {
                step: '01',
                title: 'Deposit Funds',
                desc: 'Add money to your Pooled Wealth wallet. Funds are held in a regulated trust account, completely segregated from platform operations.',
              },
              {
                step: '02',
                title: 'Choose an Asset',
                desc: 'Browse authenticated collectibles. Each asset has a fixed number of fractional shares. Review the documentation and provenance before committing.',
              },
              {
                step: '03',
                title: 'Co-own & Govern',
                desc: 'Purchase shares to become a registered co-owner. Vote on exit timing, pricing, and storage decisions proportional to your stake.',
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className="relative bg-[#1A2B1F] md:bg-transparent p-10 flex flex-col gap-6 border border-[#2E4A35]/60 md:border-0 rounded-2xl md:rounded-none"
              >
                {/* Step number — large art-deco watermark */}
                <div
                  className="font-display font-black leading-none select-none"
                  style={{
                    fontSize: '5rem',
                    color: 'rgba(201,168,76,0.08)',
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                  }}
                >
                  {s.step}
                </div>

                {/* Gold rule */}
                <div className="h-px w-8 bg-[#C9A84C]" />

                <div>
                  <h3 className="text-lg font-semibold text-[#F7F4EE] mb-2">{s.title}</h3>
                  <p className="text-sm text-[rgba(247,244,238,0.55)] leading-relaxed">{s.desc}</p>
                </div>

                {/* Connector arrow on desktop (not last item) */}
                {i < 2 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                    <ChevronRight className="h-5 w-5 text-[#C9A84C]/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GOVERNANCE ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">Governance</p>
            <h2 className="font-display text-5xl font-bold text-[#1A1207] mb-4">You&rsquo;re in control</h2>
            <p className="text-[#6A5A40] max-w-md mx-auto">
              Co-owners vote on the decisions that matter. Your ownership share determines the weight of your vote.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Exit & Pricing',
                desc: 'Vote on exit timing and reserve price. Your ownership share determines the weight of your vote.',
              },
              {
                title: 'Storage & Insurance',
                desc: 'Have a direct say in where and how the asset is stored and insured throughout the holding period.',
              },
              {
                title: 'Dispute Resolution',
                desc: 'Any formal disputes about the asset go to a co-owner vote. Admin cannot override a passed vote.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-[#E8E2D6] rounded-xl p-7 hover:border-[#C9A84C]/40 hover:shadow-sm transition-all duration-200"
              >
                <div className="h-1 w-8 bg-[#C9A84C] rounded-full mb-5" />
                <h3 className="text-base font-semibold text-[#1A1207] mb-2">{item.title}</h3>
                <p className="text-[#6A5A40] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-[#E8E2D6] bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">Why Pooled Wealth</p>
            <h2 className="font-display text-5xl font-bold text-[#1A1207] mb-3">Built for serious collectors</h2>
            <p className="text-[#6A5A40] text-sm">Everything you need to invest in rare assets with confidence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border border-[#E8E2D6] rounded-xl p-6 hover:border-[#C9A84C]/30 hover:shadow-sm transition-all duration-200">
                  <div className="h-10 w-10 rounded-lg bg-[#1A2B1F] flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-[#C9A84C]" />
                  </div>
                  <h3 className="font-semibold text-[#1A1207] mb-2 text-sm">{f.title}</h3>
                  <p className="text-[#6A5A40] text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEE TRANSPARENCY ────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-[#E8E2D6] bg-[#1A2B1F] relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(201,168,76,0.05) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 mb-6">
            <Percent className="h-5 w-5 text-[#C9A84C]" />
          </div>
          <h2 className="font-display text-4xl font-bold text-[#F7F4EE] mb-3">Simple, transparent fees</h2>
          <p className="text-[rgba(247,244,238,0.5)] mb-10 text-sm">No hidden charges. Two fees, clearly disclosed upfront.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#2E4A35]/50 border border-[#2E4A35] rounded-xl p-7 text-left">
              <p className="text-[10px] uppercase tracking-widest text-[rgba(247,244,238,0.4)] mb-3">Management Fee</p>
              <p className="font-display text-4xl font-bold text-[#C9A84C] mb-3">~5% p.a.</p>
              <p className="text-sm text-[rgba(247,244,238,0.55)] leading-relaxed">Charged monthly on your invested balance. Covers custody, insurance, and platform operations.</p>
            </div>
            <div className="bg-[#2E4A35]/50 border border-[#2E4A35] rounded-xl p-7 text-left">
              <p className="text-[10px] uppercase tracking-widest text-[rgba(247,244,238,0.4)] mb-3">Profit Share</p>
              <p className="font-display text-4xl font-bold text-[#C9A84C] mb-3">~20%</p>
              <p className="text-sm text-[rgba(247,244,238,0.55)] leading-relaxed">Taken only on profit above your cost basis when a distribution is made. Zero fee on return of capital.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#F7F4EE]">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo mark above CTA */}
          <div className="flex justify-center mb-8">
            <Logo variant="light" size={48} showWordmark={false} />
          </div>
          <h2 className="font-display text-5xl font-bold text-[#1A1207] mb-4 tracking-tight">
            Ready to co-own something rare?
          </h2>
          <p className="text-[#6A5A40] mb-10 leading-relaxed max-w-md mx-auto">
            Create a free account and start browsing authenticated assets today. No minimum investment required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="text-sm text-[#6A5A40] hover:text-[#1A1207] transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E8E2D6] py-10 px-6 bg-[#F7F4EE]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo variant="light" size={24} showWordmark />
            <div className="flex flex-wrap justify-center gap-5 text-xs text-[#8A7A60]">
              <Link href="/legal/fsg" className="hover:text-[#1A1207] transition-colors">Financial Services Guide</Link>
              <Link href="/legal/tmd" className="hover:text-[#1A1207] transition-colors">Target Market Determination</Link>
              <Link href="/legal/terms" className="hover:text-[#1A1207] transition-colors">Terms &amp; Conditions</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-[#E8E2D6] text-center">
            <p className="text-xs text-[#8A7A60] leading-relaxed">
              &copy; 2026 Pooled Wealth Pty Ltd. All rights reserved.{' '}
              <span className="text-[#C0B8A8]">Collectible asset values can go down as well as up. Past performance is not indicative of future results.</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
