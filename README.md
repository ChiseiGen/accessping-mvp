# AccessPing

AccessPing is a small SaaS MVP for running a fast accessibility first pass before a website is handed to a client. It scans one public page, summarizes common WCAG issues, generates a client-ready report preview, and captures early-access leads in Supabase.

## Features

- One-page public website scan
- Automated accessibility checks with `axe-core`
- Access score with issue severity summary
- Client-ready report preview
- Print dialog support for saving reports as PDF
- Early-access lead capture
- Supabase-backed lead storage with local fallback
- Light and dark mode
- Responsive product-led SaaS UI

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- axe-core
- jsdom
- Supabase REST API

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

Build for production:

```bash
npm run build
```

Run the production build locally:

```bash
npm run start -- --hostname 127.0.0.1 --port 3000
```

## Environment Variables

Create `.env.local`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Important:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser.
- Do not prefix it with `NEXT_PUBLIC_`.
- Rotate the key before production if it has ever been shared.
- `.env.local` is ignored by Git.

If these env vars are missing, `/api/leads` falls back to `data/leads.json` for local MVP testing.

## Supabase Setup

Run the SQL in:

```text
supabase/leads.sql
```

This creates `public.leads` with RLS enabled.

AccessPing writes leads from the Next.js server route using the service role key. No public `anon` insert/select policy is required for the current MVP.

## API Routes

### `POST /api/scan`

Runs a one-page accessibility scan.

Request:

```json
{
  "url": "https://example.com"
}
```

### `POST /api/leads`

Stores an early-access lead.

Request:

```json
{
  "email": "you@agency.com",
  "url": "https://example.com",
  "score": 90,
  "issueCount": 1,
  "pageTitle": "Example"
}
```

## Deployment Notes

Recommended deploy path:

1. Push this project to GitHub.
2. Import the repo in Vercel.
3. Add environment variables in Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy a preview build.
5. Test:
   - Website scan
   - Report preview
   - Print and Save as PDF
   - Lead capture in Supabase

## QA Checklists

- [Analytics event check](docs/analytics-event-check.md)

## Current MVP Limits

- Scans one public page at a time.
- Some websites block automated scans.
- Automated checks do not replace manual keyboard and screen reader QA.
- PDF export currently uses the browser print dialog.
- Payment/subscriptions are not implemented yet.
