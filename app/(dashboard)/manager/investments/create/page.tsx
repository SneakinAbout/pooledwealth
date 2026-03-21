import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import InvestmentForm from '@/components/investments/InvestmentForm';

export default async function CreateInvestmentPage() {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    redirect('/investments');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">Create Investment</h1>
        <p className="text-[#6A5A40]">
          Add a new investment opportunity to the platform
        </p>
      </div>
      <Card>
        <InvestmentForm mode="create" />
      </Card>
    </div>
  );
}
