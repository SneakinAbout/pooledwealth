import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import ReturnsClient from './ReturnsClient';

export const dynamic = 'force-dynamic';

export default async function ReturnsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">Returns Report</h1>
        <p className="text-[#6A5A40]">Review your investment performance over any date range</p>
      </div>
      <ReturnsClient />
    </div>
  );
}
