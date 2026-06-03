# AccessPing Manual QA Checklist

Use this checklist before production deploys and after significant changes.

Last updated: 2026-06-04

## Pre-flight Check

- [ ] Run `npm run lint` with no errors
- [ ] Run `npm run build` with no errors
- [ ] All analytics events are firing correctly (see `docs/analytics-event-check.md`)

---

## Core Flow Tests

### 1. Scan Test

- [ ] Open homepage at `http://127.0.0.1:3000/`
- [ ] Enter a working public URL (e.g., `https://example.com`)
- [ ] Click "Scan site"
- [ ] Confirm scan completes with score, severity, and issues
- [ ] Verify `Scan Started` and `Scan Completed` events in Vercel Analytics

**Expected**: Report preview shows with score dial, severity summary, and issue list.

---

### 2. Save Report

- [ ] Complete a scan
- [ ] Scroll to Report handoff section
- [ ] Click "Save report"
- [ ] Confirm save message appears
- [ ] Check that report appears in Report Library
- [ ] Verify `Report Saved` event fires

**Expected**: Report saved in localStorage and syncs to Supabase (if configured).

---

### 3. Sync Report

- [ ] Ensure at least one report is saved
- [ ] Click "Sync reports" in Report Library
- [ ] Confirm sync message appears
- [ ] Verify `Report Library Synced` event fires

**Expected**: Local reports match server reports (or fallback to local-only if Supabase not configured).

---

### 4. Copy Shared Report Link

- [ ] Complete a scan and save the report
- [ ] Wait for server sync (check "Server synced" label)
- [ ] Open a saved report from the library
- [ ] Click "Copy client link"
- [ ] Confirm link copied message appears
- [ ] Verify `Report Link Copied` event fires

**Expected**: Link format is `/report/[uuid]`. Anyone with link can view report.

---

### 5. PDF Download

- [ ] Complete a scan
- [ ] Click "Download report PDF"
- [ ] Confirm PDF downloads with correct filename
- [ ] Verify `PDF Downloaded` event fires

**Expected**: PDF contains score, severity summary, top fixes, and accuracy note.

---

### 6. Print Report

- [ ] Complete a scan
- [ ] Click "Print report"
- [ ] Confirm browser print dialog opens
- [ ] Verify `Report Printed` event fires

**Expected**: Print preview shows audit report section, hides navigation and CTAs.

---

### 7. Lead Capture

- [ ] Complete a scan or use sample report
- [ ] Scroll to "Report workflow beta" section
- [ ] Enter a test email (use unique format like `qa+{date}@test.com`)
- [ ] Submit the form
- [ ] Confirm success message appears
- [ ] Verify `Lead Captured` event fires

**Expected**: Lead appears in Supabase `leads` table with correct data.

---

## UI/Responsiveness Tests

### 8. Mobile Check

- [ ] Open homepage in mobile viewport (375px width)
- [ ] Confirm layout is clean without horizontal overflow
- [ ] Check scanner form is usable
- [ ] Check report results render correctly
- [ ] Check Report Library is readable
- [ ] Check shared report page at `/report/[key]` renders correctly

**Expected**: All sections stack vertically, no text overflow, buttons are tappable.

---

### 9. Dark Mode Check

- [ ] Toggle to dark mode using theme switch
- [ ] Confirm colors are correct and readable
- [ ] Check scanner preview panel
- [ ] Check report results section
- [ ] Check Report Library
- [ ] Check shared report page
- [ ] Confirm no white flashes or unreadable text

**Expected**: Dark theme applies consistently across all components.

---

## Backend/Persistence Tests

### 10. Supabase Check

- [ ] Verify `leads` table receives new rows on form submit
- [ ] Verify `reports` table receives new rows on save
- [ ] Check RLS is enabled on both tables
- [ ] Confirm service role key is not exposed (no `NEXT_PUBLIC_` prefix)

**Expected**: Data persists correctly, no unauthorized access possible.

---

### 11. Vercel Deploy Check

- [ ] Trigger a new deploy (push to main or manual redeploy)
- [ ] Wait for deploy to complete
- [ ] Open production URL
- [ ] Run a test scan
- [ ] Verify scan completes successfully
- [ ] Verify saved reports sync properly
- [ ] Check Vercel Analytics for events

**Expected**: Production behaves identically to local development.

---

## Shared Report Page Tests

### 12. Report Link Accessibility

- [ ] Copy a shared report link
- [ ] Open in incognito/private browser (no login required)
- [ ] Confirm report loads without authentication
- [ ] Check all sections render: cover, decision, scope, score explanation, summary, issues
- [ ] Verify copyable client summary works
- [ ] Check privacy note is visible

**Expected**: Anyone with link can view the report. No account required.

---

### 13. Report Status Labels

- [ ] Test with a clean score (90+): should show "Ready"
- [ ] Test with serious issues: should show "Needs fixes"
- [ ] Test with critical issues: should show "Blocked"

**Expected**: Labels are consistent across main report, library, and shared report.

---

## Edge Case Tests

### 14. Scan Failure Handling

- [ ] Try a URL that blocks automated requests
- [ ] Confirm error message is clear and actionable
- [ ] Verify "Try again" and "View sample report" buttons work
- [ ] Verify `Scan Failed` event fires

### 15. Local Fallback

- [ ] Temporarily remove Supabase env vars
- [ ] Run a scan and save a report
- [ ] Confirm report saves to localStorage
- [ ] Confirm sync falls back gracefully
- [ ] Restore env vars and verify sync works again

---

## Sign-off

Complete all checks before production deployment.

- [ ] All core flow tests passed
- [ ] Mobile check passed
- [ ] Dark mode check passed
- [ ] Supabase data persistence confirmed
- [ ] Analytics events verified in Vercel
- [ ] Shared report page works correctly
- [ ] No console errors in production build