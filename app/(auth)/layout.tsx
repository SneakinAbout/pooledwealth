import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, TrendingUp, Lock } from 'lucide-react';

const features = [
  { icon: TrendingUp, text: 'Fractional shares in authenticated collectibles' },
  { icon: ShieldCheck, text: 'KYC-verified platform with institutional safeguards' },
  { icon: Lock, text: 'Secure wallet with Stripe-powered deposits' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F4EE] flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between p-12 bg-[#1A2B1F] border-r border-[#2E4A35] relative overflow-hidden flex-shrink-0">
        {/* Decorative glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#C9A84C]/10 rounded-full blur-2xl pointer-events-none" />

        <Link href="/" className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="Pooled Wealth" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-[#F7F4EE] text-xl tracking-tight">Pooled Wealth</span>
        </Link>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-[#F7F4EE] leading-tight">
              Invest in rare assets,<br />
              <span className="text-[#C9A84C]">fractionally.</span>
            </h2>
            <p className="mt-3 text-[rgba(247,244,238,0.65)] text-sm leading-relaxed">
              Access curated collectibles — from trading cards to luxury watches —
              with as little as one share.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-[#C9A84C]" />
                </div>
                <span className="text-sm text-[rgba(247,244,238,0.75)]">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[rgba(247,244,238,0.35)]">
          Investments carry risk. Only invest what you can afford to lose.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#F7F4EE]">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="h-9 w-9 flex-shrink-0">
            <Image src="/logo.png" alt="Pooled Wealth" width={36} height={36} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
          </div>
          <span className="font-bold text-[#1A1207] text-lg tracking-tight">Pooled Wealth</span>
        </Link>

        <div className="w-full max-w-md">
          {children}
        </div>

        <p className="mt-8 text-xs text-[#8A7A60] text-center lg:hidden">
          Investments carry risk. Only invest what you can afford to lose.
        </p>
      </div>
    </div>
  );
}
