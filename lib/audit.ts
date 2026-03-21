import { prisma } from './prisma';

/**
 * Records an admin action to the audit log.
 * Silently ignores errors so audit failures never break the main operation.
 */
export async function auditLog(
  userId: string,
  action: string,
  target?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: Record<string, any>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { userId, action, target, details },
    });
  } catch (err) {
    console.error('[audit]', err);
  }
}
