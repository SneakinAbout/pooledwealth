export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/investor/:path*',
    '/manager/:path*',
    '/admin/:path*',
    '/investments/:path*',
  ],
};
