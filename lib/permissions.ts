import { Role } from '@prisma/client';
import { Session } from 'next-auth';
import { NextResponse } from 'next/server';

export function hasRole(session: Session | null, ...roles: Role[]): boolean {
  if (!session?.user?.role) return false;
  return roles.includes(session.user.role as Role);
}

export function isAdmin(session: Session | null): boolean {
  return hasRole(session, Role.ADMIN);
}

export function isManagerOrAbove(session: Session | null): boolean {
  return hasRole(session, Role.ADMIN, Role.MANAGER);
}

export function isAuthenticated(session: Session | null): boolean {
  return !!session?.user;
}

export function requireAuth(session: Session | null) {
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function requireAdmin(session: Session | null) {
  const authError = requireAuth(session);
  if (authError) return authError;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export function requireManagerOrAbove(session: Session | null) {
  const authError = requireAuth(session);
  if (authError) return authError;
  if (!isManagerOrAbove(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
