import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Shield, Users, ArrowRight, Layers, Lock, Percent, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
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
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-10 bg-[#1A2B1F] border-b border-[#2E4A35]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image src="/logo.png" alt="Pooled Wealth" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-[#F7F4EE] text-lg tracking-tight">Pooled Wealth</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-[rgba(247,244,238,0.7)] hover:text-[#F7F4EE]">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#1A2B1F]/8 border border-[#1A2B1F]/15 rounded-full px-4 py-1.5 mb-8">
            <Lock className="h-3.5 w-3.5 text-[#C9A84C]" />
            <span className="text-[#6A5A40] text-sm font-medium">Authenticated collectibles, fractional ownership</span>
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-bold text-[#1A1207] leading-[1.0] tracking-tight mb-6">
            Own a piece of{' '}
            <span className="text-[#C9A84C]">what&apos;s rare</span>
          </h1>
          <p className="text-lg text-[#6A5A40] max-w-2xl mx-auto mb-10 leading-relaxed">
            Own your share directly. Buy fractional ownership in authenticated
            collectibles alongside other collectors — Pokémon boxes, graded sports
            cards, deadstock sneakers, rare comics, and more.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-5 justify-center">
            <Link href="/register">
              <Button size="lg">
                Browse Assets
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="text-[#6A5A40] hover:text-[#1A1207] text-sm font-medium transition-colors hover:underline underline-offset-4">
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[#E8E2D6] bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold font-mono-val text-[#C9A84C] mb-1">
              {totalAUM >= 1_000_000
                ? `$${(totalAUM / 1_000_000).toFixed(1)}M`
                : totalAUM >= 1_000
                ? `$${(totalAUM / 1_000).toFixed(0)}K`
                : formatCurrency(totalAUM)}
            </div>
            <div className="text-sm text-[#6A5A40]">Assets Under Management</div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono-val text-[#C9A84C] mb-1">
              {investorCount.toLocaleString()}
            </div>
            <div className="text-sm text-[#6A5A40]">Co-Owners</div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono-val text-[#C9A84C] mb-1">
              {activeAssets}
            </div>
            <div className="text-sm text-[#6A5A40]">Active Assets</div>
          </div>
        </div>
      </section>

      {/* Featured Assets */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl font-bold text-[#1A1207]">Featured Assets</h2>
              <p className="text-[#6A5A40] mt-1">Currently open for investment</p>
            </div>
            <Link href="/investments">
              <Button variant="secondary" size="sm">View All →</Button>
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="text-center py-16 text-[#8A7A60] text-sm border border-dashed border-[#E8E2D6] rounded-2xl">
              No featured assets yet — admins can mark assets as featured from the investment management page.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((inv) => {
                const soldShares = inv.totalUnits - inv.availableUnits;
                const pct = Math.round((soldShares / inv.totalUnits) * 100);
                return (
                  <Link key={inv.id} href="/investments">
                    <div className="bg-white border border-[#E8E2D6] rounded-2xl overflow-hidden hover:border-[#C9A84C]/50 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
                      <div className="relative h-44 bg-[#EDE6D6] overflow-hidden flex-shrink-0">
                        {inv.imageUrl ? (
                          <Image src={inv.imageUrl} alt={inv.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-12 w-12 text-[#C9A84C]/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B1F]/40 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="bg-[#1A2B1F] text-[#C9A84C] text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide">
                            {inv.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 space-y-3 flex flex-col flex-1">
                        <h3 className="font-semibold text-[#1A1207] leading-tight text-sm line-clamp-2">{inv.title}</h3>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#C9A84C] font-bold font-mono-val">{formatCurrency(Number(inv.pricePerUnit))} / share</span>
                          <span className="text-[#6A5A40]">{pct}% sold</span>
                        </div>
                        <div className="w-full bg-[#EDE6D6] rounded-full h-1.5">
                          <div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-[#8A7A60]">{soldShares.toLocaleString()} / {inv.totalUnits.toLocaleString()} shares sold</p>
                        <div className="mt-auto pt-2 border-t border-[#E8E2D6] flex items-center justify-between text-xs text-[#1A2B1F] font-medium">
                          <span>View details</span>
                          <ArrowRight className="h-3.5 w-3.5" />
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

      {/* How it works */}
      <section className="py-20 px-6 border-t border-[#E8E2D6] bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-[#1A1207] mb-3">How it works</h2>
            <p className="text-[#6A5A40]">Own rare assets in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Deposit Funds', desc: 'Add money to your Pooled Wealth wallet instantly via bank transfer or deposit.' },
              { step: '02', title: 'Pick an Asset', desc: 'Browse authenticated collectibles. Each asset has a fixed number of shares available.' },
              { step: '03', title: 'Buy Shares', desc: 'Purchase as many shares as you want. You own that percentage of the asset outright.' },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="font-display text-7xl font-black text-[#E8E2D6] mb-3 leading-none">{s.step}</div>
                <h3 className="text-lg font-semibold text-[#1A1207] mb-2">{s.title}</h3>
                <p className="text-[#6A5A40] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance */}
      <section className="py-20 px-6 border-t border-[#E8E2D6]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-[#1A1207] mb-3">You&apos;re in control</h2>
            <p className="text-[#6A5A40]">Co-owners vote on the decisions that matter</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'Exit &amp; Pricing', desc: 'Vote on exit timing and reserve price. Your ownership share determines the weight of your vote.' },
              { title: 'Storage &amp; Insurance', desc: 'Have a direct say in where and how the asset is stored and insured throughout the holding period.' },
              { title: 'Dispute Resolution', desc: 'Any formal disputes about the asset go to a co-owner vote. Admin cannot override a passed vote.' },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-[#E8E2D6] rounded-xl p-6">
                <div className="h-1 w-8 bg-[#C9A84C] rounded-full mb-4" />
                <h3 className="text-lg font-semibold text-[#1A1207] mb-2" dangerouslySetInnerHTML={{ __html: item.title }} />
                <p className="text-[#6A5A40] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-[#E8E2D6]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-[#1A1207] mb-3">Built for serious collectors</h2>
            <p className="text-[#6A5A40]">Everything you need to invest in rare assets with confidence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border border-[#E8E2D6] rounded-xl p-6 hover:border-[#C9A84C]/40 transition-colors">
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

      {/* Fee transparency */}
      <section className="py-16 px-6 border-t border-[#E8E2D6] bg-[#1A2B1F]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="h-10 w-10 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center mx-auto mb-5">
            <Percent className="h-5 w-5 text-[#C9A84C]" />
          </div>
          <h2 className="font-display text-3xl font-bold text-[#F7F4EE] mb-3">Simple, transparent fees</h2>
          <p className="text-[rgba(247,244,238,0.6)] mb-8">No hidden charges. Two fees, clearly disclosed.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#2E4A35]/60 border border-[#2E4A35] rounded-xl p-6 text-left">
              <p className="text-xs uppercase tracking-widest text-[rgba(247,244,238,0.5)] mb-2">Management Fee</p>
              <p className="text-3xl font-bold font-mono-val text-[#C9A84C]">~5% p.a.</p>
              <p className="text-sm text-[rgba(247,244,238,0.6)] mt-2">Charged monthly on your invested balance. Covers custody, insurance, and platform operations.</p>
            </div>
            <div className="bg-[#2E4A35]/60 border border-[#2E4A35] rounded-xl p-6 text-left">
              <p className="text-xs uppercase tracking-widest text-[rgba(247,244,238,0.5)] mb-2">Profit Share</p>
              <p className="text-3xl font-bold font-mono-val text-[#C9A84C]">~20%</p>
              <p className="text-sm text-[rgba(247,244,238,0.6)] mt-2">Taken only on profit above your cost basis when a distribution is made. Zero fee on return of capital.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center bg-white border border-[#E8E2D6] rounded-3xl p-12">
          <div className="text-5xl mb-5">🎴</div>
          <h2 className="font-display text-4xl font-bold text-[#1A1207] mb-4 tracking-tight">Ready to own a piece?</h2>
          <p className="text-[#6A5A40] mb-8 leading-relaxed">Create a free account and start browsing authenticated assets today.</p>
          <Link href="/register">
            <Button size="lg">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#E8E2D6] py-8 px-6 bg-[#F7F4EE]">
        <div className="max-w-6xl mx-auto text-center space-y-3">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#8A7A60]">
            <Link href="/legal/fsg" className="hover:text-[#1A1207] transition-colors">Financial Services Guide</Link>
            <Link href="/legal/tmd" className="hover:text-[#1A1207] transition-colors">Target Market Determination</Link>
            <Link href="/legal/terms" className="hover:text-[#1A1207] transition-colors">Terms &amp; Conditions</Link>
          </div>
          <p className="text-xs text-[#8A7A60]">
            © 2026 Pooled Wealth. All rights reserved. Collectible asset values can go down as well as up. Past performance is not indicative of future results.
          </p>
        </div>
      </footer>
    </main>
  );
}
