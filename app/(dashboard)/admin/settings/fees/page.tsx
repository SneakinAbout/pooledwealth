import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import FeeSettingsForm from '@/components/admin/FeeSettingsForm';

export default async function FeeSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/investments');
  }

  const history = await prisma.platformSettings.findMany({
    include: {
      updatedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const current =
    history[0] ?? { managementFeePercent: 5, profitSharePercent: 30 };

  const serializedHistory = history.map((h) => ({
    ...h,
    managementFeePercent: Number(h.managementFeePercent),
    profitSharePercent: Number(h.profitSharePercent),
    updatedAt: h.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">Fee Settings</h1>
        <p className="text-[#6A5A40]">
          Configure platform management fees and profit share rates
        </p>
      </div>

      <Card>
        <FeeSettingsForm
          current={{
            managementFeePercent: Number(current.managementFeePercent),
            profitSharePercent: Number(current.profitSharePercent),
          }}
          history={serializedHistory}
        />
      </Card>
    </div>
  );
}
