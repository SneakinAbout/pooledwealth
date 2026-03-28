'use client';

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const routeTitles: Record<string, string> = {
  '/investments': 'Assets',
  '/investor/portfolio': 'My Portfolio',
  '/manager/investments': 'My Investments',
  '/manager/investments/create': 'Create Investment',
  '/admin': 'Admin Dashboard',
  '/admin/investments': 'All Investments',
  '/admin/users': 'User Management',
  '/admin/fees': 'Fee Collection',
  '/admin/distributions': 'Distributions',
  '/admin/deposits': 'Bank Deposits',
  '/admin/settings': 'Settings',
  '/admin/analytics': 'Analytics',
  '/investor/settings': 'My Account',
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  // Match dynamic routes
  if (pathname.startsWith('/investments/')) return 'Asset Details';
  if (pathname.startsWith('/manager/investments/') && pathname.endsWith('/edit')) return 'Edit Investment';
  if (pathname.startsWith('/admin/users/')) return 'User Details';
  return '';
}

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-14 bg-[#F7F4EE]/95 backdrop-blur-sm border-b border-[#E8E2D6] flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-[#6A5A40] hover:text-[#1A1207] hover:bg-[#EDE6D6] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="text-sm font-semibold text-[#1A1207] font-display">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex flex-col items-end mr-1">
          <span className="text-xs font-medium text-[#1A1207] leading-tight">{session?.user?.name}</span>
          <span className="text-[10px] text-[#6A5A40] leading-tight">{session?.user?.email}</span>
        </div>
        {session?.user?.role === 'ADMIN' && (
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-[#C9A84C] hover:text-[#1A2B1F] hover:bg-[#C9A84C]/10">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs font-semibold">Admin</span>
            </Button>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-[#6A5A40] hover:text-[#1A1207]"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-xs">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
