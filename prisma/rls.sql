-- Enable Row Level Security on tables exposed to PostgREST.
-- Prisma connects via the service role (bypasses RLS) so no policies are
-- needed — enabling RLS is enough to block unauthenticated PostgREST access.

ALTER TABLE public.recurring_deposits ENABLE ROW LEVEL SECURITY;
