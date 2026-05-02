import { prisma } from '@/lib/prisma';

const CODE_PREFIX = 'PW';
const CODE_START = 1001;

export async function assignDepositCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { depositCode: true },
  });

  if (user?.depositCode) return user.depositCode;

  const lastUser = await prisma.user.findFirst({
    where: { depositCode: { not: null } },
    orderBy: { depositCode: 'desc' },
    select: { depositCode: true },
  });

  let nextNumber = CODE_START;
  if (lastUser?.depositCode) {
    const match = lastUser.depositCode.match(/^PW-(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  const code = `${CODE_PREFIX}-${nextNumber}`;

  await prisma.user.update({
    where: { id: userId },
    data: { depositCode: code },
  });

  return code;
}
