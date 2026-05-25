-- AccessPing saved reports table
-- Run this in the Supabase SQL editor before enabling saved report persistence.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  report_key text not null unique,
  url text not null,
  score integer not null,
  issue_count integer not null default 0,
  page_title text not null default '',
  scanned_at timestamptz not null,
  summary jsonb not null default '{}'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  source text not null default 'manual-save',
  created_at timestamptz not null default now(),
  constraint reports_score_range check (score >= 0 and score <= 100),
  constraint reports_issue_count_range check (issue_count >= 0),
  constraint reports_source_check check (source in ('manual-save'))
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_url_idx on public.reports (url);

alter table public.reports enable row level security;

-- No anon/authenticated policies are added yet.
-- AccessPing writes saved reports through the Next.js server route with the service role key.
-- Never expose SUPABASE_SERVICE_ROLE_KEY in the browser or NEXT_PUBLIC_* variables.
