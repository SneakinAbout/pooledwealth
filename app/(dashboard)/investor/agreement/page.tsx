import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AgreementClient from './AgreementClient';

export const dynamic = 'force-dynamic';

export default async function AgreementPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  // Already signed — send them on their way
  const existing = await prisma.masterAgreement.findUnique({ where: { userId: session.user.id } });
  if (existing) redirect('/investments');

  return (
    <div className="py-4">
      <AgreementClient />
    </div>
  );
}
