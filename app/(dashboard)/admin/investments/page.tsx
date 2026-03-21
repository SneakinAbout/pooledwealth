import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import AdminInvestmentActions from './AdminInvestmentActions';
import { formatCurrency, formatDate, calculateProgress } from '@/lib/utils';
import { Plus, Users, Star } from 'lucide-react';
import FeaturedToggle from './FeaturedToggle';

export default async function AdminInvestmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/investments');
  }

  const investments = await prisma.investment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { holdings: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1207] mb-1">All Investments</h1>
          <p className="text-[#6A5A40]">{investments.length} total investments</p>
        </div>
        <Link href="/manager/investments/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {investments.map((inv) => {
          const progress = calculateProgress(inv.totalUnits, inv.availableUnits);
          return (
            <Card key={inv.id}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#1A1207]">{inv.title}</h3>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="text-sm text-[#6A5A40]">
                    {inv.category} · by {inv.createdBy.name} · created{' '}
                    {formatDate(inv.createdAt)}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[#6A5A40] text-xs">Price/unit</p>
                      <p className="text-[#1A1207] font-medium">
                        {formatCurrency(Number(inv.pricePerUnit))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6A5A40] text-xs">Available</p>
                      <p className="text-[#1A1207] font-medium">
                        {inv.availableUnits}/{inv.totalUnits}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6A5A40] text-xs flex items-center gap-1">
                        <Users className="h-3 w-3" /> Investors
                      </p>
                      <p className="text-[#1A1207] font-medium">{inv._count.holdings}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={progress} showLabel />
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <FeaturedToggle investmentId={inv.id} initialFeatured={inv.featuredOnHome} />
                  <Link href={`/investments/${inv.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                  <Link href={`/manager/investments/${inv.id}/edit`}>
                    <Button variant="secondary" size="sm">Edit</Button>
                  </Link>
                  {inv.status !== 'ARCHIVED' && (
                    <AdminInvestmentActions investmentId={inv.id} status={inv.status} />
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
