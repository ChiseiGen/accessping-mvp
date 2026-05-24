# AccessPing Analytics Event Check

Use this checklist after every production deploy to confirm Vercel Analytics is receiving the events that matter for the MVP funnel.

Last updated: 2026-05-25

## What Should Be Tracked

| Funnel step | Event name | How to trigger it | Expected result |
| --- | --- | --- | --- |
| Page visit | Pageview | Open `https://accessping-mvp.vercel.app/` | Vercel Analytics shows a pageview for `/` |
| Scan intent | `Scan Started` | Paste a URL and click `Scan site` | Event appears after the scan starts |
| Scan success | `Scan Completed` | Complete a working scan, for example `https://example.com` | Event appears with `score` and `issueCount` |
| Scan failure | `Scan Failed` | Try a URL that blocks automated scans or is invalid after form validation | Event appears when the API returns an error |
| Demo activation | `Sample Report Loaded` | Click `Load sample report` | Event appears with sample `score` and `issueCount` |
| PDF intent | `PDF Downloaded` | Click `Download PDF` from the report preview | Event appears after the PDF file starts downloading |
| Report intent | `Report Printed` | Click `Print report` from the report preview | Event appears before the browser print dialog opens |
| Lead capture | `Lead Captured` | Submit the early access form with an email | Event appears after the lead is saved |

## Manual QA Steps

1. Open the live site in a normal browser tab:

   ```text
   https://accessping-mvp.vercel.app/
   ```

2. Wait 30 to 60 seconds, then check Vercel Dashboard:

   ```text
   Project -> Analytics
   ```

3. Confirm the pageview appears.

4. Run a successful scan:

   ```text
   https://example.com
   ```

5. Confirm these events appear:

   ```text
   Scan Started
   Scan Completed
   ```

6. Click `Load sample report`.

7. Confirm this event appears:

   ```text
   Sample Report Loaded
   ```

8. Click `Download PDF`.

9. Confirm this event appears:

   ```text
   PDF Downloaded
   ```

10. Click `Print report`, then cancel the print dialog if you do not need a PDF.

11. Confirm this event appears:

   ```text
   Report Printed
   ```

12. Submit the early access form with a test email.

13. Confirm this event appears:

   ```text
   Lead Captured
   ```

14. Confirm the lead also appears in Supabase:

   ```text
   Supabase -> Table Editor -> leads
   ```

## Pass Criteria

Analytics is considered working when:

- The homepage pageview appears in Vercel Analytics.
- `Scan Started` and `Scan Completed` appear after a successful scan.
- `Sample Report Loaded` appears after clicking the sample report CTA.
- `PDF Downloaded` appears after downloading a report PDF.
- `Report Printed` appears after clicking the print CTA.
- `Lead Captured` appears after a successful email submission.
- Supabase receives the lead row that matches the submitted email.

## Notes

- Vercel Analytics can take a short time to show new data.
- Browser privacy extensions, ad blockers, and tracking protection can block analytics scripts.
- Custom events may be shown separately from pageviews depending on the Vercel dashboard view and plan.
- Automated accessibility scan results are product events, not official WCAG certification records.
