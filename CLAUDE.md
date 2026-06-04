# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AccessPing is a pre-handoff accessibility report workflow SaaS MVP built with Next.js 15. It scans public pages for WCAG issues, generates access scores, and produces client-ready reports.

## Commands

```bash
npm run dev      # Development server at http://127.0.0.1:3000
npm run build    # Production build (verify before claiming code is ready)
npm run start    # Run production build locally
npm run lint     # ESLint check
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Accessibility**: axe-core with jsdom for server-side scanning
- **PDF**: pdf-lib for server-generated PDF reports
- **Database**: Supabase (REST API) with local JSON fallback
- **Analytics**: Vercel Analytics

### Directory Structure
```
app/                    # Next.js App Router pages and API routes
  api/
    scan/              # Website accessibility scanner endpoint
    leads/             # Lead capture endpoint
    reports/           # Saved report persistence
    report/pdf/        # PDF generation endpoint
  page.tsx             # Main scanner UI (renders accessping-app)
  report/[reportKey]/  # Shared client report page
components/
  accessping-app.tsx   # Core client-side application
  ui/                  # Radix UI components (switch, label, theme toggle)
lib/utils.ts           # Utility functions (cn for class merging)
supabase/
  leads.sql            # Supabase table schema for leads
  reports.sql          # Supabase table schema for saved reports
public/
  axe.min.js           # axe-core bundled for server-side use
```

### Key Patterns

**Server-side accessibility scanning**: The scan endpoint (`app/api/scan/route.ts`) fetches HTML via Node.js fetch, parses it with jsdom, runs axe-core in that jsdom context, and calculates an access score based on weighted impact counts (critical: 18, serious: 10, moderate: 5, minor: 2).

**Score calculation**: `Math.max(0, Math.min(100, 100 - penalty))` where penalty = sum(impact weight times count).

**Client-side state**: `components/accessping-app.tsx` is a large client component managing all state including scan results, saved reports (localStorage + Supabase sync), and theme preferences.

**Supabase integration**: All Supabase operations happen server-side in API routes. Service role key is server-only (`SUPABASE_SERVICE_ROLE_KEY` without `NEXT_PUBLIC_` prefix). Falls back to `data/leads.json` and `data/reports.json` when Supabase is not configured.

**PDF generation**: `app/api/report/pdf/route.ts` uses pdf-lib to create a simple one-page PDF report with score, severity summary, handoff decision, and top 6 fixes.

**Theme system**: CSS variables with `data-theme` attribute and `.dark` class on `<html>`. Theme preference stored in localStorage with system preference fallback.

## Important Conventions

- **Supabase keys**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Always use server-side API routes.
- **API responses**: Return `Cache-Control: no-store` headers for dynamic content.
- **Scan timeout**: 15 second timeout for website fetches, 30 second max duration for the API route.
- **Report key format**: UUID generated client-side with `crypto.randomUUID()` fallback to timestamp-based.
- **Sample reports**: `createSampleResult()` in accessping-app.tsx provides demo data with score 74 and 4 sample issues for the sample scenario.

## Supabase Setup

Run SQL files in `supabase/` in the Supabase SQL editor to create tables:
- `leads.sql` creates `public.leads` for early-access capture
- `reports.sql` creates `public.reports` for saved report persistence

Both tables use RLS but have no anon policies. Writes go through the service role key in server routes.

## Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-only, no NEXT_PUBLIC_ prefix
```

Missing these causes fallback to local JSON files in `data/`.
