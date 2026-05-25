# AGENTS.md

## Project Context

This repository is AccessPing, a Next.js SaaS MVP for pre-handoff accessibility checks, client-ready reports, saved report history, and lead capture.

## Working Agreements

- Use Indonesian when speaking with the project owner unless they ask otherwise.
- Before major UI, copy, product, Supabase, or deploy work, mention which skill is being used.
- Keep the app focused on one goal: turning public website scans into actionable client handoff reports.
- Do not add new production dependencies without explaining why.
- Do not commit secrets, `.env.local`, local data files, build output, or agent skill folders.
- Preserve existing user changes. Do not revert unrelated edits.

## Engineering

- Use `npm.cmd run build` before saying production code is ready.
- Prefer existing project patterns in `components/accessping-app.tsx`, `app/api`, and `supabase`.
- Keep Supabase service role keys server-only. Never expose them through `NEXT_PUBLIC_*`.
- Keep fallback local data out of Git.

## Product Direction

- Treat AccessPing as a pre-handoff accessibility workflow for freelancers, agencies, and small SaaS teams.
- Prioritize features that improve report trust, client handoff, saved reports, conversion, and monetization.
- Avoid adding generic dashboard features before the report workflow is strong.
