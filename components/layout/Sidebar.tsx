'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Users,
  Settings,
  Building2,
  BarChart3,
  PieChart,
  DollarSign,
  Receipt,
  Plus,
  PenLine,
  Landmark,
  LayoutDashboard,
  UserCog,
  Bookmark,
} from 'lucide-react';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import DepositModal from '@/components/wallet/DepositModal';
import WithdrawModal from '@/components/wallet/WithdrawModal';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: Record<string, NavGroup[]> = {
  INVESTOR: [
    {
      items: [
        { label: 'Browse Assets', href: '/investments', icon: TrendingUp },
        { label: 'My Portfolio', href: '/investor/portfolio', icon: PieChart },
        { label: 'Watchlist', href: '/investor/watchlist', icon: Bookmark },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'My Account', href: '/investor/settings', icon: UserCog },
      ],
    },
  ],
  MANAGER: [
    {
      items: [
        { label: 'Browse Assets', href: '/investments', icon: TrendingUp },
        { label: 'My Portfolio', href: '/investor/portfolio', icon: PieChart },
        { label: 'Watchlist', href: '/investor/watchlist', icon: Bookmark },
      ],
    },
    {
      label: 'Manage',
      items: [
        { label: 'My Investments', href: '/manager/investments', icon: Building2 },
        { label: 'Create Investment', href: '/manager/investments/create', icon: PenLine },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'My Account', href: '/investor/settings', icon: UserCog },
      ],
    },
  ],
  ADMIN: [
    {
      items: [
        { label: 'Browse Assets', href: '/investments', icon: TrendingUp },
        { label: 'My Portfolio', href: '/investor/portfolio', icon: PieChart },
        { label: 'Watchlist', href: '/investor/watchlist', icon: Bookmark },
      ],
    },
    {
      label: 'Platform',
      items: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Investments', href: '/admin/investments', icon: Building2 },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Finance',
      items: [
        { label: 'Fee Collection', href: '/admin/fees', icon: Receipt },
        { label: 'Distributions', href: '/admin/distributions', icon: DollarSign },
        { label: 'Bank Deposits', href: '/admin/deposits', icon: Landmark },
      ],
    },
    {
      label: 'Config',
      items: [
        { label: 'Settings', href: '/admin/settings', icon: Settings },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'My Account', href: '/investor/settings', icon: UserCog },
      ],
    },
  ],
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? 'INVESTOR') as keyof typeof navGroups;
  const groups = navGroups[role] ?? navGroups.INVESTOR;

  const [balance, setBalance] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const fetchBalance = () => {
    fetch('/api/wallet')
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? 0))
      .catch(() => setBalance(0));
  };

  const fetchPendingDeposits = () => {
    if (role !== 'ADMIN') return;
    fetch('/api/admin/pending-count')
      .then((r) => r.json())
      .then((d: { total: number }) => {
        if (typeof d.total === 'number') setPendingCount(d.total);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (session?.user) {
      fetchBalance();
      fetchPendingDeposits();
    }
  }, [session]);

  const handleDepositClose = () => {
    setShowDeposit(false);
    fetchBalance();
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/investments' && href !== '/admin' && pathname.startsWith(href + '/'));

  const handleNavClick = () => {
    onClose?.();
  };

  const nav = (
    <aside className="w-64 bg-[#1A2B1F] border-r border-[#2E4A35] flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="h-14 px-5 flex items-center border-b border-[#2E4A35] flex-shrink-0">
        <Link href="/investments" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="Pooled Wealth" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-[#F7F4EE] text-base tracking-tight">Pooled Wealth</span>
        </Link>
      </div>

      {/* Wallet */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-[#2E4A35]/60 border border-[#2E4A35] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-[rgba(247,244,238,0.6)]">
              <Wallet className="h-3 w-3" />
              <span>Wallet</span>
            </div>
            <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#E8CFA0] transition-colors font-medium"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
            <span className="text-[rgba(247,244,238,0.3)] text-xs">·</span>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center gap-1 text-xs text-[rgba(247,244,238,0.5)] hover:text-[#F7F4EE] transition-colors font-medium"
            >
              Withdraw
            </button>
          </div>
          </div>
          <p className="text-xl font-bold font-mono-val tabular-nums">
            {balance !== null ? formatCurrency(balance) : <span className="text-[#2E4A35]">—</span>}
          </p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'pt-3' : ''}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[rgba(247,244,238,0.4)]">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showBadge = item.href === '/admin' && pendingCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'text-[#C9A84C] bg-[#C9A84C]/10 border-l-2 border-[#C9A84C] pl-[10px]'
                      : 'text-[rgba(247,244,238,0.65)] hover:text-[#F7F4EE] hover:bg-[#2E4A35]/50'
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-[#C9A84C]' : '')} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {showBadge && (
                    <span className="h-4 min-w-[1rem] px-1 rounded-full bg-[#C9A84C] text-[10px] font-bold text-[#1A2B1F] flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 pb-4 pt-2 border-t border-[#2E4A35]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="h-8 w-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] text-sm font-bold flex-shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F7F4EE] truncate">
              {session?.user?.name ?? 'User'}
            </p>
            <p className="text-xs text-[rgba(247,244,238,0.5)] truncate">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:flex flex-shrink-0">
        {nav}
      </div>

      {/* Mobile: slide-in drawer overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close menu"
          />
          <div className="relative flex-shrink-0">
            {nav}
          </div>
        </div>
      )}

      <DepositModal isOpen={showDeposit} onClose={handleDepositClose} />
      <WithdrawModal isOpen={showWithdraw} onClose={() => { setShowWithdraw(false); fetchBalance(); }} walletBalance={balance ?? 0} />
    </>
  );
}
