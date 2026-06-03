import Link from "next/link";
import { notFound } from "next/navigation";
import SharedCopyableSummary from "@/components/ui/shared-copyable-summary";

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
  const brand = domain.split(".")[0] || domain;
  const rawTitle = title || domain;
  const parts = rawTitle
    .split(/\s[-|]\s/g)
    .map((part) => part.trim())
    .filter(Boolean);
  const cleanedParts = parts.filter((part, index) => {
    const normalized = part.toLowerCase();
    const isBrandRepeat = normalized === brand.toLowerCase() || normalized === domain.toLowerCase();

    return !(isBrandRepeat && index > 0);
  });
  const primary = cleanedParts[0] || rawTitle;

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

function getReportId(scannedAt: string, targetUrl: string) {
  const datePart = new Date(scannedAt)
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");
  const domainPart = getDomain(targetUrl)
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 10)
    .toUpperCase();

  return `AP-${datePart}-${domainPart || "REPORT"}`;
}

function getReportStatusLabel(report: ReportRow) {
  if (report.summary.critical > 0) return { label: "Blocked", tone: "risk" as const };
  if (report.summary.serious > 0) return { label: "Needs fixes", tone: "watch" as const };
  if (report.score < 90) return { label: "Needs fixes", tone: "watch" as const };
  return { label: "Ready", tone: "good" as const };
}

function getPriorityAction(impact: Impact) {
  if (impact === "critical") return "Fix before sending this page to client approval.";
  if (impact === "serious") return "Resolve before handoff if this page is part of launch scope.";
  if (impact === "moderate") return "Schedule for the next QA pass and retest the affected area.";
  return "Treat as polish before final sign-off.";
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
  const domain = getDomain(report.url);
  const reportTitle = cleanPageTitle(report.page_title, report.url);
  const reportId = getReportId(report.scanned_at, report.url);
  const unresolvedIssueLabel = `${report.issue_count} issue group${report.issue_count === 1 ? "" : "s"}`;
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

      <section className="sharedReportCover">
        <div className="sharedReportTitle">
          <p className="eyebrow">Pre-handoff accessibility report</p>
          <h1>{reportTitle}</h1>
          <p>
            Automated first pass for {domain}. Use this as a client-ready summary of detected access risks, priority
            fixes, and the remaining manual QA scope.
          </p>
          <div className="sharedMetaGrid" aria-label="Report metadata">
            <span>
              <small>Scanned page</small>
              <strong>{domain}</strong>
            </span>
            <span>
              <small>Scan time</small>
              <strong>{formatDate(report.scanned_at)}</strong>
            </span>
            <span>
              <small>Report ID</small>
              <strong>{reportId}</strong>
            </span>
          </div>
        </div>

        <aside className={`sharedStatusPanel ${decision.tone}`} aria-label="Report status">
          <span>Access score</span>
          <div>
            <strong>{report.score}</strong>
            <small>/100</small>
          </div>
          <p>{getReportStatusLabel(report).label}</p>
          <em>{unresolvedIssueLabel}</em>
        </aside>
      </section>

      <section className={`sharedDecision ${decision.tone}`}>
        <div>
          <span>Recommendation</span>
          <h2>{decision.label}</h2>
        </div>
        <p>{decision.summary}</p>
      </section>

      <section className="sharedScopePanel">
        <div>
          <span>Scope</span>
          <strong>Automated first pass, not a full audit</strong>
        </div>
        <p>
          AccessPing checks common WCAG issues that can be detected from a public page. Final sign-off should still
          include keyboard navigation, screen reader labels, zoom, responsive layout, and content review.
        </p>
      </section>

      <section className="sharedScoreExplanation">
        <div className="sharedScoreExplanationHeader">
          <span>How the score is calculated</span>
        </div>
        <p>
          The access score starts at 100 and subtracts points based on issue severity: critical issues deduct 18 points
          each, serious issues deduct 10, moderate issues deduct 5, and minor issues deduct 2. The score reflects
          automated checks only.
        </p>
        <div className="sharedScoreProof">
          <div>
            <strong>Can verify</strong>
            <p>Automated checks found issues from public page markup.</p>
          </div>
          <div>
            <strong>Cannot verify</strong>
            <p>Keyboard navigation, screen reader behavior, zoom, and assistive technology compatibility.</p>
          </div>
        </div>
      </section>

      <section className="sharedSummarySection" aria-label="Severity summary">
        <div className="sectionHeading">
          <div>
            <span>Severity summary</span>
            <small>Grouped automated findings</small>
          </div>
        </div>

        <div className="sharedSummaryGrid">
          {(Object.keys(impactLabels) as Impact[]).map((impact) => (
            <div key={impact} className={`summaryTile ${impact}`}>
              <strong>{report.summary[impact]}</strong>
              <span>{impactLabels[impact]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="sharedIssueList">
        <div className="sectionHeading">
          <div>
            <span>Top fixes</span>
            <small>{topIssues.length > 0 ? "Review before sign-off" : "Manual QA still recommended"}</small>
          </div>
          <p>Each item includes the client-friendly issue, priority action, and first affected selector when available.</p>
        </div>

        {topIssues.length > 0 ? (
          <ol>
            {topIssues.map((issue) => (
              <li key={issue.id}>
                <div className="sharedIssueMeta">
                  <span className={`impactBadge ${issue.impact}`}>{impactLabels[issue.impact]}</span>
                  <small>{getPriorityAction(issue.impact)}</small>
                </div>
                <div>
                  <h3>{issue.help}</h3>
                  <p>{issue.description}</p>
                  {issue.nodes?.[0]?.target?.[0] ? (
                    <div className="sharedEvidence">
                      <span>Affected selector</span>
                      <code>{issue.nodes[0].target[0]}</code>
                    </div>
                  ) : null}
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

      <SharedCopyableSummary report={report} />

      <section className="sharedPrivacyNote">
        <span>Privacy</span>
        <p>Anyone with this link can view this report. No account required. Reports are not linked to personal data.</p>
      </section>

      <footer className="sharedReportFooter">
        <span>Generated by AccessPing</span>
        <Link href="/">Run another pre-handoff check</Link>
      </footer>
    </main>
  );
}
