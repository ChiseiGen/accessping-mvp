-- AccessPing lead capture table
-- Run this in the Supabase SQL editor when you create your project.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  url text not null default '',
  score integer,
  issue_count integer,
  page_title text not null default '',
  source text not null default 'report-waitlist',
  created_at timestamptz not null default now(),
  constraint leads_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint leads_score_range check (score is null or (score >= 0 and score <= 100)),
  constraint leads_issue_count_range check (issue_count is null or issue_count >= 0)
);

alter table public.leads enable row level security;

-- No anon/authenticated policies are added yet.
-- AccessPing writes leads through the Next.js server route with the service role key.
-- Never expose SUPABASE_SERVICE_ROLE_KEY in the browser or NEXT_PUBLIC_* variables.
