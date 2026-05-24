import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { JSDOM } from "jsdom";

export const runtime = "nodejs";
export const maxDuration = 30;

const SCAN_TIMEOUT_MS = 15000;
let axeSourceCache: string | null = null;

function getAxeSource() {
  axeSourceCache ??= readFileSync(
    path.join(process.cwd(), "public", "axe.min.js"),
    "utf8"
  );
  return axeSourceCache;
}

type Impact = "critical" | "serious" | "moderate" | "minor";

const impactWeights: Record<Impact, number> = {
  critical: 18,
  serious: 10,
  moderate: 5,
  minor: 2
};

function normalizeUrl(rawUrl: unknown) {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    throw new Error("Enter a valid website URL.");
  }

  const withProtocol = /^https?:\/\//i.test(rawUrl.trim())
    ? rawUrl.trim()
    : `https://${rawUrl.trim()}`;

  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only public HTTP and HTTPS pages can be scanned.");
  }

  return parsed.toString();
}

function getScore(summary: Record<Impact, number>) {
  const penalty = Object.entries(summary).reduce((total, [impact, count]) => {
    return total + impactWeights[impact as Impact] * count;
  }, 0);

  return Math.max(0, Math.min(100, 100 - penalty));
}

async function readScanBody(request: NextRequest) {
  try {
    return (await request.json()) as { url?: unknown };
  } catch {
    throw new Error("Send a valid JSON body with a website URL.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readScanBody(request);
    const url = normalizeUrl(body.url);

    let pageResponse: Response;

    try {
      pageResponse = await fetch(url, {
        redirect: "follow",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 AccessPing/0.1"
        },
        cache: "no-store",
        signal: AbortSignal.timeout(SCAN_TIMEOUT_MS)
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not reach that website from the scanner. Check the URL or try another public page."
        },
        { status: 422 }
      );
    }

    const contentType = pageResponse.headers.get("content-type") || "";

    if (!pageResponse.ok) {
      return NextResponse.json(
        {
          error: `The website returned HTTP ${pageResponse.status}. It may block automated scans.`
        },
        { status: 422 }
      );
    }

    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        { error: "This URL did not return an HTML page that can be scanned." },
        { status: 422 }
      );
    }

    const html = await pageResponse.text();
    const dom = new JSDOM(html, {
      url,
      pretendToBeVisual: true,
      runScripts: "outside-only"
    });

    if (!dom.window.HTMLCanvasElement.prototype.getContext) {
      Object.defineProperty(dom.window.HTMLCanvasElement.prototype, "getContext", {
        value: () => null
      });
    }

    dom.window.eval(getAxeSource());

    const axeRunner = (
      dom.window as unknown as {
        axe: typeof import("axe-core");
      }
    ).axe;

    const results = await axeRunner.run(dom.window.document, {
      resultTypes: ["violations"]
    });

    const summary: Record<Impact, number> = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    };

    const issues = results.violations.map((violation) => {
      const impact = (violation.impact || "minor") as Impact;
      summary[impact] += 1;

      return {
        id: violation.id,
        impact,
        help: violation.help,
        description: violation.description,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.slice(0, 5).map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary || ""
        }))
      };
    });

    const title = dom.window.document.querySelector("title")?.textContent?.trim() || "";

    return NextResponse.json(
      {
        url,
        scannedAt: new Date().toISOString(),
        score: getScore(summary),
        summary,
        issueCount: issues.length,
        issues,
        pageTitle: title
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message || error.name || "The scan could not be completed."
        : String(error || "The scan could not be completed.");

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}
