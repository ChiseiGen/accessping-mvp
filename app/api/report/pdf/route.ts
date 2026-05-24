import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

type Impact = "critical" | "serious" | "moderate" | "minor";

type ReportIssue = {
  id?: string;
  impact?: Impact;
  help?: string;
  description?: string;
  helpUrl?: string;
  nodes?: Array<{
    target?: string[];
    failureSummary?: string;
  }>;
};

type ReportPayload = {
  url?: string;
  scannedAt?: string;
  score?: number;
  summary?: Partial<Record<Impact, number>>;
  issueCount?: number;
  issues?: ReportIssue[];
  pageTitle?: string;
  isSample?: boolean;
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

const guidanceByIssue: Record<string, string> = {
  "link-name": "Add clear visible text, an aria-label, or a descriptive image alt value inside the link.",
  "image-alt": "Add concise alt text for meaningful images, or use empty alt text for decorative images.",
  "color-contrast": "Darken the text, lighten the background, or choose a color pair that passes WCAG contrast.",
  label: "Connect a visible label to the field with htmlFor/id, or provide a clear aria-label.",
  "button-name": "Add visible button text or an aria-label that describes the action.",
  region: "Wrap page areas in semantic landmarks like header, main, nav, aside, or footer.",
  "heading-order": "Use headings in order, such as h1, h2, h3, without skipping levels for visual styling."
};

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim() || fallback;
}

function getDomain(targetUrl: string) {
  try {
    return new URL(targetUrl).hostname.replace(/^www\./, "");
  } catch {
    return targetUrl || "website";
  }
}

function getFileSlug(targetUrl: string) {
  return getDomain(targetUrl).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "report";
}

function formatDate(scannedAt: string) {
  const date = scannedAt ? new Date(scannedAt) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString("en-US");
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Ready for handoff after a quick accessibility pass";
  if (score >= 75) return "Usable, but fix these before the client sees it";
  return "Do not hand this off without an accessibility review";
}

function getHandoffSummary(payload: ReportPayload) {
  const summary = payload.summary || {};
  const critical = summary.critical || 0;
  const serious = summary.serious || 0;

  if (critical > 0) {
    return "Handoff should wait. This page has a critical access blocker that should be fixed before client review.";
  }

  if (serious > 0) {
    return "Fix before client review. The page is usable, but serious findings can create real friction.";
  }

  if ((payload.issueCount || 0) > 0) {
    return "Good shape with follow-up fixes. No high-risk automated blockers were found.";
  }

  return "Clean automated first pass. Finish manual keyboard, screen reader, and zoom checks before sign-off.";
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ReportPayload;
    const url = cleanText(payload.url);
    const score = typeof payload.score === "number" ? Math.max(0, Math.min(100, payload.score)) : null;

    if (!url || score === null) {
      return NextResponse.json({ error: "Send report data with url and score." }, { status: 400 });
    }

    const summary = {
      critical: payload.summary?.critical || 0,
      serious: payload.summary?.serious || 0,
      moderate: payload.summary?.moderate || 0,
      minor: payload.summary?.minor || 0
    };

    const issues = [...(payload.issues || [])]
      .filter((issue) => issue.impact && issue.help)
      .sort((a, b) => impactOrder[a.impact as Impact] - impactOrder[b.impact as Impact])
      .slice(0, 6);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const ink = rgb(0.08, 0.1, 0.14);
    const muted = rgb(0.35, 0.4, 0.38);
    const line = rgb(0.82, 0.86, 0.82);
    const accent = rgb(0.05, 0.45, 0.39);
    const soft = rgb(0.95, 0.97, 0.94);

    let y = 748;
    const left = 48;
    const right = 564;

    const drawText = (text: string, x: number, size = 10, font = regular, color = ink) => {
      page.drawText(text, { x, y, size, font, color });
      y -= size + 6;
    };

    const drawWrapped = (text: string, x: number, maxChars: number, size = 10, font = regular, color = ink) => {
      wrapText(text, maxChars).forEach((lineText) => drawText(lineText, x, size, font, color));
    };

    page.drawText("AccessPing", { x: left, y, size: 10, font: bold, color: ink });
    page.drawText(formatDate(payload.scannedAt || ""), { x: 430, y, size: 9, font: regular, color: muted });
    y -= 34;

    page.drawText(payload.isSample ? "SAMPLE REPORT" : "SCAN COMPLETE", {
      x: left,
      y,
      size: 9,
      font: bold,
      color: accent
    });
    y -= 28;

    drawWrapped(cleanText(payload.pageTitle, getDomain(url)), left, 32, 22, bold, ink);
    y += 6;
    drawText(getDomain(url), left, 10, regular, accent);

    page.drawRectangle({ x: 456, y: 628, width: 86, height: 66, borderColor: line, borderWidth: 1, color: soft });
    page.drawText(String(score), { x: 474, y: 657, size: 30, font: bold, color: ink });
    page.drawText("/100", { x: 518, y: 660, size: 10, font: bold, color: muted });

    y -= 4;
    drawWrapped(`${formatDate(payload.scannedAt || "")}. Found ${payload.issueCount || issues.length} issue groups to review before handoff.`, left, 78, 11, regular, ink);

    y -= 12;
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: line });
    y -= 28;

    const metricWidth = 126;
    (Object.keys(impactLabels) as Impact[]).forEach((impact, index) => {
      const x = left + index * (metricWidth + 6);
      page.drawRectangle({ x, y: y - 60, width: metricWidth, height: 60, borderColor: line, borderWidth: 1 });
      page.drawText(String(summary[impact]), { x: x + 14, y: y - 25, size: 18, font: bold, color: ink });
      page.drawText(impactLabels[impact].toUpperCase(), { x: x + 14, y: y - 44, size: 8, font: bold, color: muted });
    });
    y -= 92;

    drawText("Handoff Decision", left, 13, bold, ink);
    drawWrapped(getHandoffSummary(payload), left, 88, 11, regular, ink);
    y -= 10;
    drawText("Recommended Next Step", left, 13, bold, ink);
    drawWrapped(
      "Fix the highest-priority issues first, rerun the scan, then complete manual keyboard and screen reader QA before final approval.",
      left,
      88,
      11,
      regular,
      ink
    );

    y -= 10;
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: line });
    y -= 24;

    drawText("Top Fixes", left, 13, bold, ink);

    if (issues.length === 0) {
      drawWrapped("No automated findings were detected. Add manual QA before sending a final accessibility sign-off.", left, 88, 11, regular, ink);
    } else {
      issues.forEach((issue, index) => {
        if (y < 96) return;
        const impact = issue.impact as Impact;
        const guidance = guidanceByIssue[issue.id || ""] || "Review the affected element, follow the WCAG help link, and retest after the markup or content is updated.";
        const target = cleanText(issue.nodes?.[0]?.target?.join(", "), "No selector available");

        page.drawText(`${index + 1}. ${impactLabels[impact]}`, { x: left, y, size: 9, font: bold, color: accent });
        y -= 16;
        drawWrapped(cleanText(issue.help), left, 78, 11, bold, ink);
        drawWrapped(guidance, left + 12, 78, 10, regular, ink);
        drawWrapped(`Affected: ${target}`, left + 12, 78, 9, regular, muted);
        y -= 8;
      });
    }

    page.drawText("Automated checks do not replace manual accessibility QA.", {
      x: left,
      y: 36,
      size: 9,
      font: regular,
      color: muted
    });

    const pdfBytes = await pdf.save();
    const pdfBody = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    ) as ArrayBuffer;
    const filename = `accessping-${getFileSlug(url)}.pdf`;

    return new Response(pdfBody, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/pdf"
      }
    });
  } catch {
    return NextResponse.json({ error: "The PDF report could not be generated." }, { status: 400 });
  }
}
