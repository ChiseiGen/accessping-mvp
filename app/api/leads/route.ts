import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type LeadRecord = {
  email: string;
  url: string;
  score: number | null;
  issueCount: number | null;
  pageTitle: string;
  source: "report-waitlist";
  createdAt: string;
};

const leadStorePath = path.join(process.cwd(), "data", "leads.json");

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    restUrl: `${supabaseUrl}/rest/v1/leads`,
    serviceRoleKey
  };
}

function normalizeEmail(email: unknown) {
  if (typeof email !== "string") {
    throw new Error("Enter a valid email address.");
  }

  const trimmedEmail = email.trim().toLowerCase();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  if (!isEmail) {
    throw new Error("Enter a valid email address.");
  }

  return trimmedEmail;
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function readExistingLeads() {
  try {
    const file = await readFile(leadStorePath, "utf8");
    return JSON.parse(file) as LeadRecord[];
  } catch {
    return [];
  }
}

async function saveLead(lead: LeadRecord) {
  const supabase = getSupabaseConfig();

  if (supabase) {
    const supabaseLead = {
      email: lead.email,
      url: lead.url,
      score: lead.score,
      issue_count: lead.issueCount,
      page_title: lead.pageTitle,
      source: lead.source,
      created_at: lead.createdAt
    };

    const response = await fetch(`${supabase.restUrl}?on_conflict=email`, {
      method: "POST",
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(supabaseLead),
      cache: "no-store"
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Supabase could not save this lead.");
    }

    return;
  }

  const leads = await readExistingLeads();
  const nextLeads = [
    ...leads.filter((existingLead) => existingLead.email !== lead.email),
    lead
  ];

  await mkdir(path.dirname(leadStorePath), { recursive: true });
  await writeFile(leadStorePath, JSON.stringify(nextLeads, null, 2), "utf8");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);

    const lead: LeadRecord = {
      email,
      url: normalizeOptionalString(body.url),
      score: normalizeOptionalNumber(body.score),
      issueCount: normalizeOptionalNumber(body.issueCount),
      pageTitle: normalizeOptionalString(body.pageTitle),
      source: "report-waitlist",
      createdAt: new Date().toISOString()
    };

    await saveLead(lead);

    return NextResponse.json(
      {
        ok: true,
        message: "You are on the early access list."
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
        error:
          error instanceof Error
            ? error.message
            : "The email could not be saved. Try again."
      },
      { status: 400 }
    );
  }
}
