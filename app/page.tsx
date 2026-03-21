import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Shield, Users, ArrowRight, Layers, Lock, Percent, Trophy, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';

const features = [
  {
    icon: Layers,
    title: 'Fractional Ownership',
    desc: 'Buy as little as one share in high-value collectibles previously out of reach.',
  },
  {
    icon: Shield,
    title: 'Fully Authenticated',
    desc: 'Every item is professionally graded, authenticated, and held in secure storage.',
  },
  {
    icon: TrendingUp,
    title: 'Track Performance',
    desc: 'Watch your share value grow as the market for rare collectibles continues to surge.',
  },
  {
    icon: Users,
    title: 'Pool With Others',
    desc: 'Join a community of collectors and investors owning pieces of the same rare assets.',
  },
];

const drops = [
  {
    name: 'Pokémon Base Set Booster Box',
    tag: '1st Edition · Sealed',
    category: 'Pokemon TCG',
    price: '$50 / share',
    shares: '342 / 500 shares sold',
    pct: 68,
    Icon: Layers,
    iconBg: '#1A2B1F',
    iconColor: '#C9A84C',
  },
  {
    name: 'Michael Jordan 1986 Fleer RC PSA 10',
    tag: 'BGS 9.5 · Gem Mint',
    category: 'Sports Cards',
    price: '$100 / share',
    shares: '178 / 200 shares sold',
    pct: 89,
    Icon: Trophy,
    iconBg: '#3D2B00',
    iconColor: '#C9A84C',
  },
  {
    name: 'Air Jordan 1 Chicago 1985 DS',
    tag: 'Size 10 · Deadstock',
    category: 'Sneakers',
    price: '$25 / share',
    shares: '610 / 1000 shares sold',
    pct: 61,
    Icon: Zap,
    iconBg: '#1A2B1F',
    iconColor: '#F7F4EE',
  },
];

export default function HomePage() {
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
          <div className="animate-fade-up inline-flex items-center gap-2 bg-[#1A2B1F]/8 border border-[#1A2B1F]/15 rounded-full px-4 py-1.5 mb-8" style={{ animationDelay: '0ms' }}>
            <Lock className="h-3.5 w-3.5 text-[#C9A84C]" />
            <span className="text-[#6A5A40] text-sm font-medium">Authenticated collectibles, fractional ownership</span>
          </div>
          <h1 className="animate-fade-up font-display text-6xl md:text-8xl font-bold text-[#1A1207] leading-[1.0] tracking-tight mb-6" style={{ animationDelay: '100ms' }}>
            Own a piece of{' '}
            <span className="text-[#C9A84C]">what&apos;s rare</span>
          </h1>
          <p className="animate-fade-up text-lg text-[#6A5A40] max-w-2xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: '250ms' }}>
            Pool your money with other collectors and own fractional shares in
            authenticated Pokémon boxes, graded sports cards, deadstock sneakers,
            rare comics, and more.
          </p>
          <div className="animate-fade-up flex flex-col sm:flex-row items-center gap-5 justify-center" style={{ animationDelay: '400ms' }}>
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
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '$4.2M+', label: 'Assets Under Management' },
            { value: '3,800+', label: 'Active Shareholders' },
            { value: '95+', label: 'Authenticated Assets' },
            { value: '34%', label: 'Avg. 3yr Appreciation' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold font-mono-val text-[#C9A84C] mb-1">{s.value}</div>
              <div className="text-sm text-[#6A5A40]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Drops */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl font-bold text-[#1A1207]">Featured Assets</h2>
              <p className="text-[#6A5A40] mt-1">Currently open for investment</p>
            </div>
            <Link href="/register">
              <Button variant="secondary" size="sm">View All →</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {drops.map((drop) => {
              const DropIcon = drop.Icon;
              return (
              <div
                key={drop.name}
                className="bg-white border border-[#E8E2D6] rounded-2xl overflow-hidden hover:border-[#C9A84C]/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="h-44 border-b border-[#E8E2D6] flex items-center justify-center" style={{ background: drop.iconBg }}>
                  <DropIcon style={{ color: drop.iconColor }} className="h-16 w-16 opacity-80" />
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-md uppercase tracking-wide">
                      {drop.category}
                    </span>
                    <h3 className="mt-2 font-semibold text-[#1A1207] leading-tight text-sm">{drop.name}</h3>
                    <p className="text-xs text-[#8A7A60] mt-0.5">{drop.tag}</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#C9A84C] font-bold font-mono-val">{drop.price}</span>
                    <span className="text-[#6A5A40]">{drop.pct}% sold</span>
                  </div>
                  <div className="w-full bg-[#EDE6D6] rounded-full h-1.5">
                    <div
                      className="h-full rounded-full bg-[#C9A84C]"
                      style={{ width: `${drop.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#8A7A60]">{drop.shares}</p>
                </div>
              </div>
              );
            })}
          </div>
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
                <div
                  key={f.title}
                  className="bg-white border border-[#E8E2D6] rounded-xl p-6 hover:border-[#C9A84C]/40 transition-colors"
                >
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
          <h2 className="font-display text-4xl font-bold text-[#1A1207] mb-4 tracking-tight">
            Ready to own a piece?
          </h2>
          <p className="text-[#6A5A40] mb-8 leading-relaxed">
            Create a free account and start browsing authenticated assets today.
          </p>
          <Link href="/register">
            <Button size="lg">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#E8E2D6] py-8 px-6 text-center text-[#8A7A60] text-sm bg-[#F7F4EE]">
        © 2024 Pooled Wealth. All rights reserved. Collectible asset values can go down as well as up. Past performance is not indicative of future results.
      </footer>
    </main>
  );
}
