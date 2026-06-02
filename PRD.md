# AccessPing PRD

Last updated: 2026-06-03

## 1. Product Summary

AccessPing is a pre-handoff accessibility report workflow for freelancers, small agencies, and small SaaS teams. It helps users scan a public website page, identify common automated accessibility issues, turn findings into a client-ready report, save the report, and share it before client review or launch.

AccessPing is intentionally narrow for the MVP: one public page, fast scan, readable report, saved history, and client handoff output.

## 2. Problem

Web teams often send pages to clients without a consistent accessibility first pass. Common accessibility issues are discovered late during client review, launch QA, or after the page is already public.

This creates:

- avoidable rework
- delayed approvals
- awkward client conversations
- lower perceived professionalism
- inconsistent QA habits across projects
- extra manual effort turning technical findings into client-friendly notes

## 3. Target Users

Primary users:

- Webflow freelancers
- Shopify agencies
- WordPress developers
- small web agencies
- serious solo web builders who hand off client work regularly

Secondary users:

- small SaaS teams
- product marketers
- project managers responsible for launch readiness
- technical leads without a dedicated accessibility QA workflow

Anti-persona:

- enterprise accessibility teams needing deep audits, authenticated crawls, legal certification, multi-page monitoring, or expert remediation services from day one

## 4. Core Job To Be Done

When I am about to hand off or launch a public page, I want to run a fast accessibility first pass and get a readable report, so I can catch obvious issues before the client or users do.

## 5. Positioning

AccessPing is not a full accessibility audit or legal compliance tool. It is a practical pre-handoff workflow that turns automated WCAG findings into a report a client or team can understand.

Positioning statement:

> AccessPing is a pre-handoff accessibility report workflow for web teams that need to catch common issues, explain risk clearly, and send cleaner client-ready reports before launch.

## 6. Product Principles

- Be honest about scope: automated first pass, not a full audit.
- Prioritize client handoff clarity over raw technical depth.
- Keep the MVP focused on one page and one workflow.
- Turn findings into next actions, not just issue lists.
- Make small teams look prepared without adding enterprise complexity.
- Protect secrets and keep Supabase service role server-only.

## 7. Current MVP Scope

Current MVP includes:

- one-page public URL scanner
- automated accessibility issue detection
- access score
- severity summary
- top fixes
- manual QA checklist
- sample/demo report
- PDF download
- print report
- saved report library
- Supabase-backed saved reports
- shareable client report links
- report detail view
- lead capture
- pricing and offer section
- Vercel Analytics
- Vercel production deployment
- GitHub repository
- README, AGENTS.md, legal pages, and deployment cleanup

## 8. Out Of Scope For MVP

Not included yet:

- login/account system
- authenticated page scanning
- multi-page crawling
- full manual audit workflow
- legal compliance certification
- team workspace
- Stripe payments
- custom branding
- role-based permissions
- recurring monitoring

## 9. Key User Flow

1. User opens AccessPing.
2. User enters a public website URL.
3. AccessPing scans the page.
4. User reviews score, severity, top fixes, and handoff decision.
5. User exports PDF, prints, or saves the report.
6. User syncs saved report to Supabase.
7. User copies a shareable client report link.
8. User sends the report to a client or team.
9. User joins the beta if they want a repeatable report workspace.

## 10. Functional Requirements

### Scanner

- Accept a valid public HTTP/HTTPS URL.
- Run an automated accessibility scan.
- Return page title, URL, score, issue count, severity summary, and issue groups.
- Explain blocked or failed scans clearly.
- Provide sample report fallback for users who want to preview the flow.

### Report View

- Show access score and severity summary.
- Show handoff recommendation.
- Show top priorities and how to fix them.
- Include manual QA checklist.
- Support PDF download and print.
- Avoid implying full legal compliance.

### Saved Reports

- Save reports locally in the browser.
- Save synced reports to Supabase.
- Fetch saved reports by known report key only.
- Keep service role key server-only.
- Provide sync state and browser-only fallback.

### Shared Report

- Provide a public route for saved reports: `/report/[reportKey]`.
- Show client-facing summary, score, scope, severity, and top fixes.
- Make the page feel suitable to send to a client.
- Make the limitation clear: automated first pass, not a full audit.

### Lead Capture

- Capture work email.
- Handle duplicate email gracefully.
- Store leads in Supabase.
- Connect the conversion moment to report workflow value.

## 11. Success Metrics

Activation:

- user runs a scan
- user reaches report result
- user saves a report
- user downloads PDF or prints report
- user copies client report link

Conversion:

- user joins beta/waitlist
- user interacts with pricing or offer section

Product quality:

- scan success rate
- scan failure clarity
- saved report sync success
- shared report page load success
- mobile usability
- report link usefulness during handoff

## 12. Roadmap

### Phase 1: MVP Scanner

Status: Complete

Includes URL input, one-page scan, score, issue summary, report view, failure handling, and sample report.

### Phase 2: Trust And Report Quality

Status: Complete

Includes explanation of score, top fixes, manual QA checklist, sample/demo state, PDF download, print report, and clearer report copy.

### Phase 3: Conversion And Monetization Prep

Status: Complete

Includes lead capture, pricing and offer section, beta CTA, duplicate email handling, analytics event checklist, and clearer positioning.

### Phase 4: Persistence And Production Readiness

Status: Complete

Includes Supabase leads, Supabase saved reports, GitHub repo cleanup, Vercel deployment, environment variables, README, legal links, AGENTS.md, lint/build readiness, and Vercel Analytics setup.

### Phase 5: Client Handoff Workflow

Status: In progress

Done:

- saved report library
- Supabase report sync
- shareable report link
- first pass shared report page
- shared report polish in progress

Remaining:

- finish shared report polish
- add copyable client summary
- add report status labels across saved reports
- QA mobile and dark mode for shared report
- improve report trust language and client-facing wording

### Phase 6: Monetization

Status: Not started

Potential features:

- login/account system
- paid report limits
- Stripe checkout
- custom branding
- report workspace
- client/team sharing
- saved report folders or projects

## 13. Monetization Hypothesis

Free:

- one-page scan
- sample report
- basic PDF/print
- basic shared report link

Solo:

- saved report history
- more report exports
- reusable client summaries
- report archive

Agency:

- higher report volume
- custom branding
- client-ready templates
- team workflow
- reusable fix-plan templates

Estimated pricing hypothesis:

- Solo: USD 12-19/month
- Agency: USD 39-79/month

## 14. Risks

Product risks:

- users may think AccessPing is a full audit
- users may not trust the score without clear explanation
- report workflow may not yet feel valuable enough to pay for
- agencies may need branding before sending reports to clients

Technical risks:

- some websites block automated scans
- no auth means shared report links are key-based
- Supabase service role must never be exposed to the browser
- public report links need clear privacy expectations

Go-to-market risks:

- positioning may be too broad if it sounds like another generic accessibility scanner
- user may compare only scanner quality instead of report workflow value
- pricing should wait until workflow value is clearer

## 15. Current Progress

Estimated progress:

- Strong validation MVP: 70%
- Full paid SaaS: 35-40%

Breakdown:

- Core scanner: 90%
- Report quality: 85%
- Persistence: 80%
- Shareable report workflow: 70%
- Conversion/pricing: 60%
- Production readiness: 80%
- Monetization/account system: 10%

## 16. Next Priority

Finish Phase 5 before starting accounts or payments.

Next work:

1. Complete shared report page polish.
2. Add copyable client summary.
3. QA shared report mobile and dark mode.
4. Improve report trust and limitation wording.
5. Then consider account/login or payment.

## 17. Definition Of Done For MVP Validation

AccessPing is ready for early user validation when:

- users can run a scan on a public page
- users can understand what the score means
- users can save and reopen a report
- users can export or share a client-ready report
- users understand the automated-first-pass limitation
- leads are captured reliably
- production deploy is stable
- analytics events are visible enough to evaluate usage
