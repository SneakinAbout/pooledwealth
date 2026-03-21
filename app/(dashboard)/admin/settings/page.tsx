import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SettingsTabs from '@/components/admin/SettingsTabs';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/investments');

  const history = await prisma.platformSettings.findMany({
    include: { updatedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  const current = history[0];
  if (!current) redirect('/investments'); // shouldn't happen after seed

  const serializedHistory = history.map((h) => ({
    ...h,
    managementFeePercent: Number(h.managementFeePercent),
    profitSharePercent: Number(h.profitSharePercent),
    updatedAt: h.updatedAt.toISOString(),
  }));

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">Settings</h1>
        <p className="text-[#6A5A40]">Manage platform configuration, fees, and bank details</p>
      </div>
      <SettingsTabs
        current={{
          managementFeePercent: Number(current.managementFeePercent),
          profitSharePercent: Number(current.profitSharePercent),
          bankName: current.bankName,
          bankAccountName: current.bankAccountName,
          bankBSB: current.bankBSB,
          bankAccountNumber: current.bankAccountNumber,
          bankSwift: current.bankSwift,
          platformName: current.platformName,
          supportEmail: current.supportEmail,
          minDepositAmount: current.minDepositAmount,
          maxDepositAmount: current.maxDepositAmount,
        }}
        history={serializedHistory}
      />
    </div>
  );
}
