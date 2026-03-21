import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          kycApproved: user.kycApproved,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: bake identity into the token
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.kycApproved = (user as { kycApproved: boolean }).kycApproved;
      } else {
        // Subsequent requests: re-fetch role and kycApproved from DB so that
        // admin changes (role demotion, KYC revocation) take effect immediately
        // rather than waiting up to 30 days for the token to expire.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, kycApproved: true },
        });
        if (!dbUser) {
          // User was deleted — clear identity fields to invalidate the session
          return { ...token, id: '', role: undefined, kycApproved: undefined };
        }
        token.role = dbUser.role;
        token.kycApproved = dbUser.kycApproved;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.kycApproved = token.kycApproved as boolean;
      }
      return session;
    },
  },
};
