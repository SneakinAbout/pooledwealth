import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatCurrency, formatDate, calculateProgress } from '@/lib/utils';
import { Plus, Users } from 'lucide-react';

export default async function ManagerInvestmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    redirect('/investments');
  }

  const where =
    session.user.role === 'MANAGER'
      ? { createdById: session.user.id }
      : {};

  const investments = await prisma.investment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { holdings: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1207] mb-1">
            {session.user.role === 'MANAGER' ? 'My Investments' : 'All Investments'}
          </h1>
          <p className="text-[#6A5A40]">Manage your investment listings</p>
        </div>
        <Link href="/manager/investments/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Investment
          </Button>
        </Link>
      </div>

      {investments.length === 0 ? (
        <Card className="text-center py-16">
          <p className="text-[#6A5A40] mb-4">No investments created yet</p>
          <Link href="/manager/investments/create">
            <Button>Create your first investment</Button>
          </Link>
        </Card>
      ) : (
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
                    <p className="text-sm text-[#6A5A40]">{inv.category}</p>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-[#6A5A40] text-xs uppercase tracking-widest">Price / unit</p>
                        <p className="text-[#1A1207] font-medium font-mono-val">
                          {formatCurrency(Number(inv.pricePerUnit))}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#6A5A40] text-xs uppercase tracking-widest">Available</p>
                        <p className="text-[#1A1207] font-medium">
                          {inv.availableUnits}/{inv.totalUnits}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#6A5A40] text-xs flex items-center gap-1 uppercase tracking-widest">
                          <Users className="h-3 w-3" /> Investors
                        </p>
                        <p className="text-[#1A1207] font-medium">{inv._count.holdings}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={progress} showLabel />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/investments/${inv.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                    <Link href={`/manager/investments/${inv.id}/edit`}>
                      <Button variant="secondary" size="sm">Edit</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
