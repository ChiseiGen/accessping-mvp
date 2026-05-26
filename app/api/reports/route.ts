import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Impact = "critical" | "serious" | "moderate" | "minor";

type ReportRecord = {
  reportKey: string;
  url: string;
  score: number;
  issueCount: number;
  pageTitle: string;
  scannedAt: string;
  summary: Record<Impact, number>;
  issues: unknown[];
  source: "manual-save";
  createdAt: string;
};

type SupabaseReportRow = {
  report_key: string;
  url: string;
  score: number;
  issue_count: number;
  page_title: string;
  scanned_at: string;
  summary: Record<Impact, number>;
  issues: unknown[];
  source: "manual-save";
  created_at: string;
};

const reportStorePath = path.join(process.cwd(), "data", "reports.json");
const reportSelect =
  "report_key,url,score,issue_count,page_title,scanned_at,summary,issues,source,created_at";

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    restUrl: `${supabaseUrl}/rest/v1/reports`,
    serviceRoleKey
  };
}

function normalizeString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

function normalizeUrl(value: unknown) {
  const url = normalizeString(value, "Report URL");

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Report URL must be a public web URL.");
    }
    return parsed.toString();
  } catch {
    throw new Error("Report URL must be a valid web URL.");
  }
}

function normalizeScore(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error("Report score must be between 0 and 100.");
  }

  return Math.round(value);
}

function normalizeIssueCount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("Issue count must be zero or higher.");
  }

  return Math.round(value);
}

function normalizeSummary(value: unknown): Record<Impact, number> {
  const summary = value as Partial<Record<Impact, unknown>>;
  const impacts: Impact[] = ["critical", "serious", "moderate", "minor"];

  return impacts.reduce(
    (nextSummary, impact) => {
      const count = summary?.[impact];
      nextSummary[impact] = typeof count === "number" && Number.isFinite(count) && count >= 0 ? Math.round(count) : 0;
      return nextSummary;
    },
    {} as Record<Impact, number>
  );
}

function normalizeReportKeys(value: unknown) {
  const keys = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return keys
    .map((key) => (typeof key === "string" ? key.trim() : ""))
    .filter((key) => /^[a-zA-Z0-9_.:-]{8,80}$/.test(key))
    .slice(0, 12);
}

function mapSupabaseReport(row: SupabaseReportRow): ReportRecord {
  return {
    reportKey: row.report_key,
    url: row.url,
    score: row.score,
    issueCount: row.issue_count,
    pageTitle: row.page_title,
    scannedAt: row.scanned_at,
    summary: normalizeSummary(row.summary),
    issues: Array.isArray(row.issues) ? row.issues : [],
    source: row.source,
    createdAt: row.created_at
  };
}

async function readExistingReports() {
  try {
    const file = await readFile(reportStorePath, "utf8");
    return JSON.parse(file) as ReportRecord[];
  } catch {
    return [];
  }
}

async function readReports(reportKeys: string[]) {
  if (reportKeys.length === 0) {
    return [];
  }

  const supabase = getSupabaseConfig();

  if (supabase) {
    const params = new URLSearchParams({
      select: reportSelect,
      report_key: `in.(${reportKeys.join(",")})`,
      order: "created_at.desc"
    });
    const response = await fetch(`${supabase.restUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Supabase could not fetch saved reports.");
    }

    const rows = (await response.json()) as SupabaseReportRow[];
    return rows.map(mapSupabaseReport);
  }

  const reports = await readExistingReports();
  return reports.filter((report) => reportKeys.includes(report.reportKey));
}

async function saveReport(report: ReportRecord) {
  const supabase = getSupabaseConfig();

  if (supabase) {
    const response = await fetch(`${supabase.restUrl}?on_conflict=report_key`, {
      method: "POST",
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        report_key: report.reportKey,
        url: report.url,
        score: report.score,
        issue_count: report.issueCount,
        page_title: report.pageTitle,
        scanned_at: report.scannedAt,
        summary: report.summary,
        issues: report.issues,
        source: report.source,
        created_at: report.createdAt
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Supabase could not save this report.");
    }

    return;
  }

  const reports = await readExistingReports();
  const nextReports = [
    report,
    ...reports.filter((existingReport) => existingReport.reportKey !== report.reportKey)
  ].slice(0, 100);

  await mkdir(path.dirname(reportStorePath), { recursive: true });
  await writeFile(reportStorePath, JSON.stringify(nextReports, null, 2), "utf8");
}

export async function GET(request: NextRequest) {
  try {
    const keys = normalizeReportKeys(request.nextUrl.searchParams.get("keys"));
    const reports = await readReports(keys);

    return NextResponse.json(
      {
        reports
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Saved reports could not be loaded."
      },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const now = new Date().toISOString();

    const report: ReportRecord = {
      reportKey: normalizeString(body.reportKey, "Report key"),
      url: normalizeUrl(body.url),
      score: normalizeScore(body.score),
      issueCount: normalizeIssueCount(body.issueCount),
      pageTitle: typeof body.pageTitle === "string" ? body.pageTitle.trim() : "",
      scannedAt: typeof body.scannedAt === "string" ? body.scannedAt : now,
      summary: normalizeSummary(body.summary),
      issues: Array.isArray(body.issues) ? body.issues.slice(0, 50) : [],
      source: "manual-save",
      createdAt: now
    };

    await saveReport(report);

    return NextResponse.json(
      {
        ok: true,
        message: "Report saved."
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "The report could not be saved."
      },
      { status: 400 }
    );
  }
}
