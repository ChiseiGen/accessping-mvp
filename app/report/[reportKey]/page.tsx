import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Impact = "critical" | "serious" | "moderate" | "minor";

type ReportRow = {
  report_key: string;
  url: string;
  score: number;
  issue_count: number;
  page_title: string;
  scanned_at: string;
  summary: Record<Impact, number>;
  issues: Array<{
    id: string;
    impact: Impact;
    help: string;
    description: string;
    helpUrl: string;
    nodes?: Array<{
      target?: string[];
      failureSummary?: string;
    }>;
  }>;
  created_at: string;
};

const impactLabels: Record<Impact, string> = {
  critical: "Critical",
  serious: "Serious",
  moderate: "Moderate",
  minor: "Minor"
};

const impactOrder: Record<Impact, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return {
    restUrl: `${supabaseUrl}/rest/v1/reports`,
    serviceRoleKey
  };
}

function cleanReportKey(reportKey: string) {
  return /^[a-zA-Z0-9_.:-]{8,80}$/.test(reportKey) ? reportKey : "";
}

function getDomain(targetUrl: string) {
  try {
    return new URL(targetUrl).hostname.replace(/^www\./, "");
  } catch {
    return targetUrl;
  }
}

function cleanPageTitle(title: string, targetUrl: string) {
  const domain = getDomain(targetUrl);
  const rawTitle = title || domain;
  const primary = rawTitle
    .split(/\s[·|–—-]\s/g)
    .map((part) => part.trim())
    .filter(Boolean)[0] || rawTitle;

  return primary.length > 68 ? `${primary.slice(0, 65).trim()}...` : primary;
}

function formatDate(scannedAt: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(scannedAt));
}

function normalizeSummary(summary: Partial<Record<Impact, unknown>> = {}) {
  return (Object.keys(impactLabels) as Impact[]).reduce(
    (nextSummary, impact) => {
      const value = summary[impact];
      nextSummary[impact] = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
      return nextSummary;
    },
    {} as Record<Impact, number>
  );
}

function getDecision(report: ReportRow) {
  if (report.summary.critical > 0) {
    return {
      tone: "risk",
      label: "Handoff should wait",
      summary: "This page has a critical access blocker. Fix it before client approval or launch."
    };
  }

  if (report.summary.serious > 0) {
    return {
      tone: "watch",
      label: "Fix before client review",
      summary: "The page is close, but serious findings can create real visitor friction."
    };
  }

  if (report.issue_count > 0) {
    return {
      tone: "good",
      label: "Good shape with follow-up fixes",
      summary: "No high-risk automated blockers were found. Finish the remaining polish and manual QA checks."
    };
  }

  return {
    tone: "good",
    label: "Clean automated first pass",
    summary: "The automated scan did not find issue groups. Finish keyboard, screen reader, and zoom checks."
  };
}

async function getReport(reportKey: string) {
  const safeReportKey = cleanReportKey(reportKey);
  const supabase = getSupabaseConfig();

  if (!safeReportKey || !supabase) return null;

  const params = new URLSearchParams({
    select: "report_key,url,score,issue_count,page_title,scanned_at,summary,issues,created_at",
    report_key: `eq.${safeReportKey}`,
    limit: "1"
  });
  const response = await fetch(`${supabase.restUrl}?${params.toString()}`, {
    headers: {
      apikey: supabase.serviceRoleKey,
      Authorization: `Bearer ${supabase.serviceRoleKey}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const rows = (await response.json()) as ReportRow[];
  const report = rows[0];

  if (!report) return null;

  return {
    ...report,
    summary: normalizeSummary(report.summary),
    issues: Array.isArray(report.issues) ? report.issues : []
  };
}

export default async function SharedReportPage({ params }: { params: Promise<{ reportKey: string }> }) {
  const { reportKey } = await params;
  const report = await getReport(reportKey);

  if (!report) {
    notFound();
  }

  const decision = getDecision(report);
  const topIssues = [...report.issues]
    .sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
    .slice(0, 5);

  return (
    <main className="sharedReportPage">
      <header className="sharedReportHeader">
        <Link href="/" className="brandLockup" aria-label="Back to AccessPing">
          <span>A</span>
          <strong>AccessPing</strong>
        </Link>
        <span>Client handoff report</span>
      </header>

      <section className="sharedReportHero">
        <div>
          <p className="eyebrow">Automated WCAG first pass</p>
          <h1>{cleanPageTitle(report.page_title, report.url)}</h1>
          <p>
            {getDomain(report.url)} scanned {formatDate(report.scanned_at)}. This report summarizes automated findings
            and the next fixes to review before handoff.
          </p>
        </div>
        <div className="sharedScoreCard">
          <strong>{report.score}</strong>
          <span>/100</span>
          <small>{report.issue_count} issue groups</small>
        </div>
      </section>

      <section className={`sharedDecision ${decision.tone}`}>
        <span>Recommendation</span>
        <h2>{decision.label}</h2>
        <p>{decision.summary}</p>
      </section>

      <section className="sharedSummaryGrid" aria-label="Severity summary">
        {(Object.keys(impactLabels) as Impact[]).map((impact) => (
          <div key={impact}>
            <strong>{report.summary[impact]}</strong>
            <span>{impactLabels[impact]}</span>
          </div>
        ))}
      </section>

      <section className="sharedIssueList">
        <div className="sectionHeading">
          <div>
            <span>Top fixes</span>
            <small>{topIssues.length > 0 ? "Review before sign-off" : "Manual QA still recommended"}</small>
          </div>
          <p>Automated evidence is useful, but final approval should include keyboard, screen reader, zoom, and content checks.</p>
        </div>

        {topIssues.length > 0 ? (
          <ol>
            {topIssues.map((issue) => (
              <li key={issue.id}>
                <span className={`impactBadge ${issue.impact}`}>{impactLabels[issue.impact]}</span>
                <div>
                  <h3>{issue.help}</h3>
                  <p>{issue.description}</p>
                  {issue.nodes?.[0]?.target?.[0] ? <code>{issue.nodes[0].target[0]}</code> : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="sharedEmpty">
            <strong>No automated issue groups saved.</strong>
            <p>Finish the manual QA checklist before treating this page as client-ready.</p>
          </div>
        )}
      </section>
    </main>
  );
}
