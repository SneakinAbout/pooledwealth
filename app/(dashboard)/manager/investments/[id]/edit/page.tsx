import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import InvestmentForm from '@/components/investments/InvestmentForm';
import type { InvestmentInput } from '@/lib/validations';

export default async function EditInvestmentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    redirect('/investments');
  }

  const investment = await prisma.investment.findUnique({
    where: { id: params.id },
  });

  if (!investment) notFound();

  if (
    session.user.role === 'MANAGER' &&
    investment.createdById !== session.user.id
  ) {
    redirect('/manager/investments');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">Edit Investment</h1>
        <p className="text-[#6A5A40]">{investment.title}</p>
      </div>
      <Card>
        <InvestmentForm
          mode="edit"
          initial={{
            id: investment.id,
            title: investment.title,
            description: investment.description,
            category: investment.category as InvestmentInput['category'],
            status: investment.status,
            totalUnits: investment.totalUnits,
            pricePerUnit: Number(investment.pricePerUnit),
            minimumUnits: investment.minimumUnits,
            minimumRaise: investment.minimumRaise,
            targetReturn: Number(investment.targetReturn),
            startDate: investment.startDate.toISOString().split('T')[0],
            endDate: investment.endDate.toISOString().split('T')[0],
            imageUrl: investment.imageUrl ?? '',
          }}
        />
      </Card>
    </div>
  );
}
