import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import InvestmentCard from '@/components/investments/InvestmentCard';
import { Bookmark } from 'lucide-react';

export default async function WatchlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      investment: {
        include: { _count: { select: { holdings: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1207]">Watchlist</h1>
        <p className="text-[#8A7A60] text-sm mt-1">Assets you've saved for later</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-2xl bg-white border border-[#E8E2D6] flex items-center justify-center mb-4">
            <Bookmark className="h-7 w-7 text-[#8A7A60]" />
          </div>
          <p className="text-base font-semibold text-[#1A1207] mb-1">No saved assets</p>
          <p className="text-sm text-[#8A7A60]">Click the bookmark icon on any asset to save it here.</p>
          <a href="/investments" className="mt-4 text-sm text-[#C9A84C] hover:text-[#1A2B1F] transition-colors">
            Browse assets →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map(({ investment }) => (
            <InvestmentCard
              key={investment.id}
              investment={{
                ...investment,
                pricePerUnit: Number(investment.pricePerUnit),
                targetReturn: Number(investment.targetReturn),
              }}
              showWatchlist
              isSaved
            />
          ))}
        </div>
      )}
    </div>
  );
}
