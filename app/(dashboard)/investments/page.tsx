import { prisma } from '@/lib/prisma';
import InvestmentCard from '@/components/investments/InvestmentCard';

export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Search, SlidersHorizontal, PackageSearch } from 'lucide-react';

const CATEGORIES = ['All', 'Pokemon TCG', 'Sports Cards', 'Sneakers', 'Comics', 'Watches', 'Memorabilia'];
const PAGE_SIZE = 48;

interface SearchParams {
  category?: string;
  search?: string;
  page?: string;
}

export default async function InvestmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user.role === 'ADMIN';
  const isManager = session?.user.role === 'MANAGER';

  // Gate: logged-in users must have signed the Master Agreement
  if (session?.user && !isAdmin && !isManager) {
    const agreement = await prisma.masterAgreement.findUnique({ where: { userId: session.user.id } });
    if (!agreement) redirect('/investor/agreement');
  }

  // Active investments: exclude hard-archived (admin soft-delete) records.
  // Admins/managers see DRAFT/ACTIVE/CLOSED/EXITED/FAILED; investors only see ACTIVE.
  const activeWhere: Record<string, unknown> = { status: { not: 'ARCHIVED' } };
  if (!isAdmin && !isManager) activeWhere.status = 'ACTIVE';
  if (searchParams.category && searchParams.category !== 'All') activeWhere.category = searchParams.category;
  if (searchParams.search) {
    activeWhere.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { category: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  // Exited investments — fully completed lifecycle (raised → held → sold → distributed)
  const archivedWhere: Record<string, unknown> = { status: 'EXITED' };
  if (searchParams.category && searchParams.category !== 'All') archivedWhere.category = searchParams.category;
  if (searchParams.search) {
    archivedWhere.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { category: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));

  const [investments, total, archivedInvestments, watchlistItems] = await Promise.all([
    prisma.investment.findMany({
      where: activeWhere,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { holdings: true } } },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.investment.count({ where: activeWhere }),
    prisma.investment.findMany({
      where: archivedWhere,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { holdings: true } } },
    }),
    session?.user
      ? prisma.watchlistItem.findMany({
          where: { userId: session.user.id },
          select: { investmentId: true },
        })
      : [],
  ]);

  // Compute actual return for archived investments
  const archivedIds = archivedInvestments.map((i) => i.id);
  const [archivedDists, archivedHoldings] = archivedIds.length > 0
    ? await Promise.all([
        prisma.distribution.findMany({
          where: { investmentId: { in: archivedIds } },
          select: { investmentId: true, netAmount: true },
        }),
        prisma.holding.findMany({
          where: { investmentId: { in: archivedIds } },
          select: { investmentId: true, purchasePrice: true },
        }),
      ])
    : [[], []];

  const netByInvestment = archivedDists.reduce<Record<string, number>>((acc, d) => {
    acc[d.investmentId] = (acc[d.investmentId] ?? 0) + Number(d.netAmount);
    return acc;
  }, {});
  const costByInvestment = archivedHoldings.reduce<Record<string, number>>((acc, h) => {
    acc[h.investmentId] = (acc[h.investmentId] ?? 0) + Number(h.purchasePrice);
    return acc;
  }, {});

  const savedIds = new Set(watchlistItems.map((w) => w.investmentId));

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const showStatus = isAdmin || isManager;
  const activeCategory = searchParams.category ?? 'All';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1207]">Browse Assets</h1>
        <p className="text-[#8A7A60] text-sm mt-1">Authenticated collectibles available for fractional investment</p>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form method="GET" action="/investments" className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A7A60] pointer-events-none" />
          <input
            name="search"
            defaultValue={searchParams.search ?? ''}
            placeholder="Search assets…"
            className="w-full bg-white border border-[#E8E2D6] rounded-xl pl-9 pr-4 py-2 text-sm text-[#1A1207] placeholder-[#8A7A60] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C] transition-colors"
          />
          {searchParams.category && searchParams.category !== 'All' && (
            <input type="hidden" name="category" value={searchParams.category} />
          )}
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#8A7A60] flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`/investments?category=${cat}${searchParams.search ? `&search=${encodeURIComponent(searchParams.search)}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                activeCategory === cat
                  ? 'bg-[#1A2B1F] text-[#C9A84C]'
                  : 'bg-[#EDE6D6] text-[#6A5A40] hover:bg-[#E8E2D6] hover:text-[#1A1207]'
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      {investments.length === 0 && archivedInvestments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-2xl bg-white border border-[#E8E2D6] flex items-center justify-center mb-4">
            <PackageSearch className="h-7 w-7 text-[#8A7A60]" />
          </div>
          <p className="text-base font-semibold text-[#1A1207] mb-1">No assets found</p>
          <p className="text-sm text-[#8A7A60]">
            {searchParams.search || searchParams.category !== 'All'
              ? 'Try adjusting your filters or search query.'
              : 'No investments are available right now.'}
          </p>
          {(searchParams.search || searchParams.category) && (
            <a href="/investments" className="mt-4 text-sm text-[#C9A84C] hover:text-[#1A2B1F] transition-colors">
              Clear filters
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {investments.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-[#8A7A60]">
                {total.toLocaleString()} asset{total !== 1 ? 's' : ''}{' '}
                {activeCategory !== 'All' && `in ${activeCategory}`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {investments.map((inv) => (
                  <InvestmentCard
                    key={inv.id}
                    investment={{
                      ...inv,
                      pricePerUnit: Number(inv.pricePerUnit),
                      targetReturn: Number(inv.targetReturn),
                    }}
                    showStatus={showStatus}
                    showWatchlist={!!session?.user}
                    isSaved={savedIds.has(inv.id)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-4">
                  {page > 1 && (
                    <a
                      href={`/investments?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                      className="px-4 py-2 rounded-xl bg-white border border-[#E8E2D6] text-[#6A5A40] hover:text-[#1A1207] hover:border-[#C9A84C]/40 text-sm transition-colors"
                    >
                      ← Previous
                    </a>
                  )}
                  <span className="text-sm text-[#8A7A60]">Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <a
                      href={`/investments?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                      className="px-4 py-2 rounded-xl bg-white border border-[#E8E2D6] text-[#6A5A40] hover:text-[#1A1207] hover:border-[#C9A84C]/40 text-sm transition-colors"
                    >
                      Next →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {archivedInvestments.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#1A1207]">Completed Investments</h2>
                <span className="text-xs text-[#8A7A60] bg-[#EDE6D6] px-2 py-0.5 rounded-full">
                  {archivedInvestments.length}
                </span>
              </div>
              <p className="text-xs text-[#8A7A60]">These assets have been closed and distributions processed.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {archivedInvestments.map((inv) => {
                  const cost = costByInvestment[inv.id] ?? 0;
                  const net = netByInvestment[inv.id] ?? 0;
                  const actualReturn = cost > 0 ? ((net - cost) / cost) * 100 : null;
                  return (
                    <InvestmentCard
                      key={inv.id}
                      investment={{
                        ...inv,
                        pricePerUnit: Number(inv.pricePerUnit),
                        targetReturn: Number(inv.targetReturn),
                      }}
                      actualReturn={actualReturn}
                      showStatus={showStatus}
                      showWatchlist={!!session?.user}
                      isSaved={savedIds.has(inv.id)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
