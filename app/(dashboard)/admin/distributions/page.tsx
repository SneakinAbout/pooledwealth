import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import DistributionTool from '@/components/admin/DistributionTool';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function DistributionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/investments');
  }

  const [activeInvestments, settings, distributions] = await Promise.all([
    prisma.investment.findMany({
      where: { status: { in: ['ACTIVE', 'CLOSED'] } },
      select: { id: true, title: true, status: true, holdings: { select: { purchasePrice: true } } },
      orderBy: { title: 'asc' },
    }),
    prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } }),
    prisma.distribution.findMany({
      include: {
        investment: { select: { title: true, category: true } },
      },
      orderBy: { distributedAt: 'desc' },
      take: 20,
    }),
  ]);

  const feeSettings = settings
    ? {
        managementFeePercent: Number(settings.managementFeePercent),
        profitSharePercent: Number(settings.profitSharePercent),
      }
    : { managementFeePercent: 5, profitSharePercent: 30 };

  const investmentCostBases: Record<string, number> = {};
  for (const inv of activeInvestments) {
    investmentCostBases[inv.id] = inv.holdings.reduce(
      (sum, h) => sum + Number(h.purchasePrice),
      0
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">Distributions</h1>
        <p className="text-[#6A5A40]">
          Process profit distributions for investments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
        <div className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-[#6A5A40]">Management Fee</p>
          <p className="text-2xl font-bold font-mono-val">{feeSettings.managementFeePercent}%</p>
        </div>
        <div className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-[#6A5A40]">Profit Share</p>
          <p className="text-2xl font-bold font-mono-val">{feeSettings.profitSharePercent}%</p>
        </div>
        <div className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-[#6A5A40]">Active Investments</p>
          <p className="text-2xl font-bold text-[#1A1207]">{activeInvestments.length}</p>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="font-semibold text-[#1A1207] mb-5">Process Distribution</h2>
        {activeInvestments.length === 0 ? (
          <p className="text-[#6A5A40] text-sm">
            No active investments available for distribution.
          </p>
        ) : (
          <DistributionTool
            investments={activeInvestments.map(({ id, title, status }) => ({ id, title, status }))}
            settings={feeSettings}
            investmentCostBases={investmentCostBases}
          />
        )}
      </Card>

      {distributions.length > 0 && (
        <Card>
          <h2 className="font-semibold text-[#1A1207] mb-5">Distribution History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E2D6] text-left">
                  <th className="pb-3 text-[#6A5A40] font-medium">Investment</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Gross</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Fees</th>
                  <th className="pb-3 text-[#6A5A40] font-medium text-right">Net</th>
                  <th className="pb-3 text-[#6A5A40] font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D6]">
                {distributions.map((d) => (
                  <tr key={d.id} className="hover:bg-[#EDE6D6]/50">
                    <td className="py-3">
                      <p className="text-[#1A1207] font-medium">{d.investment.title}</p>
                      {d.notes && (
                        <p className="text-xs text-[#6A5A40]">{d.notes}</p>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono-val">
                      {formatCurrency(Number(d.totalAmount))}
                    </td>
                    <td className="py-3 text-right text-[#C62828] font-mono-val">
                      −{formatCurrency(Number(d.feeDeducted) + Number(d.profitShareDeducted))}
                    </td>
                    <td className="py-3 text-right text-[#2E7D32] font-medium font-mono-val">
                      {formatCurrency(Number(d.netAmount))}
                    </td>
                    <td className="py-3 text-[#6A5A40] text-xs">
                      {formatDate(d.distributedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
