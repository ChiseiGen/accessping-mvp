"use client";

import { CSSProperties, FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import SwitchToggleThemeDemo from "@/components/ui/toggle-theme";

type Impact = "critical" | "serious" | "moderate" | "minor";

type ScanIssue = {
  id: string;
  impact: Impact;
  help: string;
  description: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string;
  }>;
};

type ScanResult = {
  url: string;
  scannedAt: string;
  score: number;
  summary: Record<Impact, number>;
  issueCount: number;
  issues: ScanIssue[];
  pageTitle: string;
  isSample?: boolean;
};

const exampleSites = [
  {
    url: "https://www.wikipedia.org",
    domain: "wikipedia.org",
    logoSrc: "https://upload.wikimedia.org/wikipedia/commons/8/80/Wikipedia-logo-v2.svg",
    logoAlt: "Wikipedia logo",
    tone: "wiki"
  },
  {
    url: "https://www.shopify.com",
    domain: "shopify.com",
    logoSrc: "https://cdn.svglogos.dev/logos/shopify.svg",
    logoAlt: "Shopify logo",
    tone: "shopify"
  },
  {
    url: "https://github.com",
    domain: "github.com",
    logoSrc: "https://cdn.svglogos.dev/logos/github-icon.svg",
    logoAlt: "GitHub logo",
    tone: "github"
  },
  {
    url: "https://wordpress.org",
    domain: "wordpress.org",
    logoSrc: "https://cdn.svglogos.dev/logos/wordpress-icon.svg",
    logoAlt: "WordPress logo",
    tone: "wordpress"
  },
  {
    url: "https://vercel.com",
    domain: "vercel.com",
    logoSrc: "https://cdn.svglogos.dev/logos/vercel-icon.svg",
    logoAlt: "Vercel logo",
    tone: "vercel"
  },
  {
    url: "https://stripe.com",
    domain: "stripe.com",
    logoSrc: "https://cdn.svglogos.dev/logos/stripe.svg",
    logoAlt: "Stripe logo",
    tone: "stripe"
  },
  {
    url: "https://www.notion.com",
    domain: "notion.com",
    logoSrc: "https://cdn.svglogos.dev/logos/notion-icon.svg",
    logoAlt: "Notion logo",
    tone: "notion"
  }
];

const impactLabels: Record<Impact, string> = {
  critical: "Critical",
  serious: "Serious",
  moderate: "Moderate",
  minor: "Minor"
};

const impactDescriptions: Record<Impact, string> = {
  critical: "Blocks key access for some visitors.",
  serious: "Likely creates real friction.",
  moderate: "Worth fixing in the next pass.",
  minor: "Small polish and robustness issue."
};

const genericGuidance = {
  meaning: "This issue may make the page harder to understand or operate for some visitors.",
  why: "Accessibility problems can block users using keyboards, screen readers, zoom, or high-contrast settings.",
  fix: "Review the affected element, follow the WCAG help link, and retest after the markup or content is updated."
};

const trustDisclaimer = {
  title: "Automated first pass, not a full audit",
  summary:
    "AccessPing checks common WCAG issues that can be detected from a public page. Use it to catch launch risks early, then finish with manual keyboard, screen reader, zoom, and content review before final sign-off.",
  proof:
    "Evidence shown here comes from automated rule results, affected selectors, and page markup available to the scanner."
};

const issueGuidance: Record<string, typeof genericGuidance> = {
  "link-name": {
    meaning: "One or more links do not have readable text or an accessible name.",
    why: "Screen reader users may only hear \"link\" without knowing where it goes.",
    fix: "Add clear visible text, an aria-label, or a descriptive image alt value inside the link."
  },
  "image-alt": {
    meaning: "An image is missing alternative text.",
    why: "People using screen readers may miss important visual information.",
    fix: "Add concise alt text for meaningful images, or use empty alt text for decorative images."
  },
  "color-contrast": {
    meaning: "Text and background colors do not have enough contrast.",
    why: "Low contrast makes content difficult to read for users with low vision or bright screens.",
    fix: "Darken the text, lighten the background, or choose a color pair that passes WCAG contrast."
  },
  label: {
    meaning: "A form control does not have a clear label.",
    why: "Assistive technologies may not announce what the field is for.",
    fix: "Connect a visible label to the field with htmlFor/id, or provide a clear aria-label."
  },
  "button-name": {
    meaning: "A button does not have readable text or an accessible name.",
    why: "Users may not know what action the button performs.",
    fix: "Add visible button text or an aria-label that describes the action."
  },
  region: {
    meaning: "Some page content is not inside a landmark region.",
    why: "Landmarks help screen reader and keyboard users jump through the page faster.",
    fix: "Wrap page areas in semantic landmarks like header, main, nav, aside, or footer."
  },
  "heading-order": {
    meaning: "Heading levels skip or appear out of order.",
    why: "A clear heading structure helps users scan the page and understand hierarchy.",
    fix: "Use headings in order, such as h1, h2, h3, without skipping levels for visual styling."
  }
};

const priorityLabels: Record<Impact, string> = {
  critical: "Fix before launch",
  serious: "Fix this week",
  moderate: "Plan next sprint",
  minor: "Polish pass"
};

const priorityOrder: Record<Impact, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3
};

const manualChecklist = [
  {
    title: "Keyboard path",
    detail: "Tab through the page and confirm every interactive element is reachable."
  },
  {
    title: "Visible focus",
    detail: "Check that links, buttons, inputs, and menus show a clear focus state."
  },
  {
    title: "Screen reader labels",
    detail: "Review buttons, forms, and images with a screen reader or accessibility tree."
  },
  {
    title: "Responsive zoom",
    detail: "Test mobile width and 200% browser zoom without hidden or overlapping content."
  }
] as const;

const leadBenefits = [
  "PDF export when the beta opens",
  "Saved report history for repeat clients",
  "Fix-plan templates for common accessibility issues"
] as const;

function createSampleResult(): ScanResult {
  return {
    url: "https://demo.accessping.app/agency-launch",
    scannedAt: new Date().toISOString(),
    score: 78,
    summary: {
      critical: 0,
      serious: 1,
      moderate: 1,
      minor: 1
    },
    issueCount: 3,
    pageTitle: "Agency launch page accessibility sample",
    isSample: true,
    issues: [
      {
        id: "color-contrast",
        impact: "serious",
        help: "Elements must meet minimum color contrast ratio thresholds",
        description: "Ensure the contrast between foreground and background colors meets WCAG.",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.11/color-contrast",
        nodes: [
          {
            target: [".hero-secondary-copy"],
            html: '<p class="hero-secondary-copy">Launch faster with a cleaner handoff.</p>',
            failureSummary:
              "Fix any of the following:\n  Element has insufficient color contrast of 3.1:1"
          }
        ]
      },
      {
        id: "button-name",
        impact: "moderate",
        help: "Buttons must have discernible text",
        description: "Ensure every button has visible text or an accessible name.",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.11/button-name",
        nodes: [
          {
            target: [".carousel-next"],
            html: '<button class="carousel-next"><svg aria-hidden="true"></svg></button>',
            failureSummary:
              "Fix any of the following:\n  Element does not have inner text that is visible to screen readers"
          }
        ]
      },
      {
        id: "image-alt",
        impact: "minor",
        help: "Images must have alternative text",
        description: "Ensure meaningful images include concise alternative text.",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.11/image-alt",
        nodes: [
          {
            target: [".case-study-logo"],
            html: '<img class="case-study-logo" src="/logos/client-mark.svg">',
            failureSummary:
              "Fix any of the following:\n  Element does not have an alt attribute"
          }
        ]
      }
    ]
  };
}

const navItems = [
  {
    href: "#scanner",
    id: "scanner",
    label: "Scan"
  },
  {
    href: "#report",
    id: "report",
    label: "Score"
  },
  {
    href: "#issues",
    id: "issues",
    label: "Fixes"
  }
] as const;

function getScoreStatus(score: number) {
  if (score >= 90) {
    return {
      label: "Ready for handoff after a quick accessibility pass",
      tone: "good",
      summary:
        "The page is in good shape. Review the remaining items, then package the scan as proof that the basics were checked."
    };
  }

  if (score >= 75) {
    return {
      label: "Usable, but fix these before the client sees it",
      tone: "watch",
      summary:
        "The page can move forward, but the serious issues are worth fixing before a launch review or client handoff."
    };
  }

  return {
    label: "Do not hand this off without an accessibility review",
    tone: "risk",
    summary:
      "The scan found enough friction that the page needs attention before it supports a public campaign or paid client delivery."
  };
}

function getTopPriorities(issues: ScanIssue[]) {
  return [...issues]
    .sort((a, b) => priorityOrder[a.impact] - priorityOrder[b.impact])
    .slice(0, 3);
}

function getHandoffDecision(result: ScanResult, topIssue?: ScanIssue) {
  const guidance = topIssue ? issueGuidance[topIssue.id] || genericGuidance : null;

  if (result.summary.critical > 0) {
    return {
      tone: "risk",
      label: "Handoff should wait",
      summary:
        "This page has a critical access blocker. Fix it before sending the work to a client or putting the page behind paid traffic.",
      firstAction: topIssue?.help || "Fix the critical blocker",
      actionDetail: guidance?.fix || genericGuidance.fix,
      clientWording:
        "We found a blocker that can prevent some visitors from using the page. We should fix this before launch."
    };
  }

  if (result.summary.serious > 0) {
    return {
      tone: "watch",
      label: "Fix before client review",
      summary:
        "The page is usable, but the serious findings can create real friction. Clear these first so the report feels like proof, not a warning.",
      firstAction: topIssue?.help || "Resolve the serious issue",
      actionDetail: guidance?.fix || genericGuidance.fix,
      clientWording:
        "The page is close, but a few accessibility issues should be cleaned up before final approval."
    };
  }

  if (result.issueCount > 0) {
    return {
      tone: "good",
      label: "Good shape with follow-up fixes",
      summary:
        "No high-risk automated blockers were found. Treat the remaining items as polish before the final QA sign-off.",
      firstAction: topIssue?.help || "Review the remaining issue",
      actionDetail: guidance?.fix || genericGuidance.fix,
      clientWording:
        "The automated pass looks healthy. We found a small set of follow-up items to tighten before handoff."
    };
  }

  return {
    tone: "good",
    label: "Clean automated first pass",
    summary:
      "The automated scan did not find issue groups. Finish the manual keyboard, screen reader, and zoom checks before calling it done.",
    firstAction: "Run manual QA",
    actionDetail: "Use the checklist below to catch issues automated scanners cannot confirm.",
    clientWording:
      "The automated accessibility pass is clean. We are doing a final manual QA check before handoff."
  };
}

function formatScanDate(scannedAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(scannedAt));
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
    .split(/\s[·|–—-]\s/g)
    .map((part) => part.trim())
    .filter(Boolean);

  const cleanedParts = parts.filter((part, index) => {
    const normalized = part.toLowerCase();
    const isBrandRepeat =
      normalized === brand.toLowerCase() ||
      normalized === domain.toLowerCase();

    return !(isBrandRepeat && index > 0);
  });

  const primary = cleanedParts[0] || rawTitle;
  return primary.length > 58 ? `${primary.slice(0, 55).trim()}…` : primary;
}

function scrollToResults() {
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      document.getElementById("issues")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, 120);
}

function getScanFailureCopy(message: string) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("http 401") ||
    lowerMessage.includes("http 403") ||
    lowerMessage.includes("http 429") ||
    lowerMessage.includes("block")
  ) {
    return {
      title: "This site blocked the automated scan",
      summary:
        "Some production sites block automated visitors, rate-limit requests, or require browser security checks before showing the page.",
      detail: "The scanner received this response: " + message,
      nextSteps: [
        "Try a public page from the same site that does not sit behind bot protection.",
        "Use the sample report to preview the client handoff flow.",
        "For a real client, note this as a manual review candidate instead of treating it as a broken report."
      ]
    };
  }

  if (
    lowerMessage.includes("could not reach") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("network")
  ) {
    return {
      title: "The scanner could not reach this page",
      summary:
        "The URL may be private, temporarily unavailable, too slow to respond, or blocking server-side requests.",
      detail: "The scanner received this response: " + message,
      nextSteps: [
        "Check that the URL opens in a normal browser tab.",
        "Scan the homepage or another public page from the same domain.",
        "If the site is private, use the sample report until authenticated scans are supported."
      ]
    };
  }

  if (lowerMessage.includes("html")) {
    return {
      title: "This URL is not a scannable web page",
      summary:
        "AccessPing can only run this first-pass scan on public HTML pages. Files, redirects, PDFs, images, and API responses are outside this MVP flow.",
      detail: "The scanner received this response: " + message,
      nextSteps: [
        "Use a normal website page URL, not a file or API endpoint.",
        "Try the homepage, pricing page, or product page.",
        "Load the sample report to see the output format."
      ]
    };
  }

  return {
    title: "The scan could not be completed",
    summary:
      "The page did not return a result the scanner can safely turn into a report yet. This can happen with redirects, strict hosting rules, or unusual page responses.",
    detail: "The scanner received this response: " + message,
    nextSteps: [
      "Try another public page from the same website.",
      "Use one of the suggested sample domains.",
      "Load the sample report if you only want to review the report workflow."
    ]
  };
}

export default function Home() {
  const previewRef = useRef<HTMLElement | null>(null);
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadStatus, setLeadStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [leadMessage, setLeadMessage] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeSection, setActiveSection] = useState<(typeof navItems)[number]["id"]>("scanner");
  const displayScore = result ? result.score : isScanning ? 0 : 82;
  const scoreAngle = `${Math.max(0, Math.min(100, displayScore)) * 3.6}deg`;
  const resultDomain = result ? getDomain(result.url) : "";
  const resultTitle = result ? cleanPageTitle(result.pageTitle, result.url) : "";
  const scoreStatus = result ? getScoreStatus(result.score) : null;
  const topPriorities = result ? getTopPriorities(result.issues) : [];
  const handoffDecision = result ? getHandoffDecision(result, topPriorities[0]) : null;
  const reportId = result ? getReportId(result.scannedAt, result.url) : "";
  const primaryNextAction = result
    ? result.issueCount > 0
      ? "Fix the highest-risk issue, then rerun the scan."
      : "Run the manual QA checklist before sending this as proof."
    : "";
  const secondaryNextAction = result
    ? result.score >= 90
      ? "Finish the manual QA pass, then keep the report preview as launch proof."
      : "Use the checklist and report preview to explain what needs attention before handoff."
    : "";
  const scanFailure = error ? getScanFailureCopy(error) : null;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("accessping-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = prefersDark ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("isVisible");
          }
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [result, isScanning]);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    function setActiveFromHash() {
      const hashId = window.location.hash.replace("#", "");
      const matchingItem = navItems.find((item) => item.id === hashId);

      if (matchingItem) {
        setActiveSection(matchingItem.id);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - 96) -
              Math.abs(b.boundingClientRect.top - 96)
          )[0];

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id as (typeof navItems)[number]["id"]);
        }
      },
      {
        rootMargin: "-24% 0px -58% 0px",
        threshold: [0.08, 0.24, 0.48]
      }
    );

    sections.forEach((section) => observer.observe(section));
    setActiveFromHash();
    window.addEventListener("hashchange", setActiveFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", setActiveFromHash);
    };
  }, [result]);

  function setThemeMode(isDark: boolean) {
    const nextTheme = isDark ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem("accessping-theme", nextTheme);
  }

  const orderedIssues = useMemo(() => {
    if (!result) return [];
    const order: Record<Impact, number> = {
      critical: 0,
      serious: 1,
      moderate: 2,
      minor: 3
    };
    return [...result.issues].sort((a, b) => order[a.impact] - order[b.impact]);
  }, [result]);

  async function runScan(targetUrl: string) {
    setError("");
    setIsScanning(true);
    setResult(null);
    track("Scan Started", {
      source: "scanner_form"
    });

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: targetUrl })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The scan could not be completed.");
      }

      setResult(payload);
      setLeadStatus("idle");
      track("Scan Completed", {
        score: payload.score,
        issueCount: payload.issueCount
      });

      scrollToResults();
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "The scan failed.");
      track("Scan Failed");
    } finally {
      setIsScanning(false);
    }
  }

  function loadSampleReport() {
    const sampleResult = createSampleResult();
    setError("");
    setIsScanning(false);
    setUrl(sampleResult.url);
    setResult(sampleResult);
    setLeadStatus("idle");
    track("Sample Report Loaded", {
      score: sampleResult.score,
      issueCount: sampleResult.issueCount
    });

    scrollToResults();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runScan(url);
  }

  function printReport() {
    track("Report Printed");
    window.print();
  }

  async function downloadPdfReport() {
    if (!result || isDownloadingPdf) return;

    setIsDownloadingPdf(true);

    try {
      const response = await fetch("/api/report/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
      });

      if (!response.ok) {
        throw new Error("The PDF report could not be generated.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const domain = resultDomain.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();

      link.href = objectUrl;
      link.download = `accessping-${domain || "report"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      track("PDF Downloaded", {
        score: result.score,
        issueCount: result.issueCount
      });
    } catch {
      setError("The PDF report could not be downloaded. Try Print report instead.");
      window.setTimeout(() => {
        document.querySelector(".notice.error")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = leadEmail.trim().toLowerCase();
    if (!trimmedEmail) return;

    setLeadStatus("saving");
    setLeadMessage("");

    const leadPayload = {
      email: trimmedEmail,
      url: result?.url || "",
      score: result?.score ?? null,
      issueCount: result?.issueCount ?? null,
      pageTitle: result?.pageTitle || ""
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(leadPayload)
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The email could not be saved.");
      }

      let existingLeads: Array<typeof leadPayload & { createdAt: string }> = [];

      try {
        existingLeads = JSON.parse(window.localStorage.getItem("accessping-leads") || "[]");
      } catch {
        existingLeads = [];
      }

      const nextLeads = [
        ...existingLeads.filter((lead) => lead.email !== trimmedEmail),
        {
          ...leadPayload,
          createdAt: new Date().toISOString()
        }
      ];

      window.localStorage.setItem("accessping-leads", JSON.stringify(nextLeads));
      setLeadStatus("saved");
      setLeadMessage(
        payload.message ||
          "You are on the beta list. I will send the PDF export and saved-report flow when it opens."
      );
      track("Lead Captured", {
        score: result?.score ?? null,
        issueCount: result?.issueCount ?? null
      });
    } catch (leadError) {
      setLeadStatus("error");
      setLeadMessage(
        leadError instanceof Error
          ? leadError.message
          : "The email could not be saved. Try again."
      );
    }
  }

  function handlePreviewPointerMove(event: MouseEvent<HTMLElement>) {
    const panel = previewRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    panel.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
    panel.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
  }

  return (
    <main className="shell">
      <a className="skipLink" href="#scanner">
        Skip to scanner
      </a>

      <header className="topbar">
        <div className="topbarInner">
          <a className="brandMark" href="/" aria-label="AccessPing home">
            <span aria-hidden="true">A</span>
            <strong>AccessPing</strong>
          </a>
          <nav className="topnav" aria-label="Product navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <a
                  href={item.href}
                  key={item.id}
                  className={isActive ? "active" : ""}
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
          <div className="topStatus">
            <span aria-hidden="true" />
            MVP online
          </div>
          <SwitchToggleThemeDemo isDark={theme === "dark"} onThemeChange={setThemeMode} />
        </div>
      </header>

      <section className="hero">
        <div className="heroCopy" id="scanner">
          <p className="eyebrow revealItem">For freelancers, agencies, and web teams</p>
          <h1 className="revealItem delayOne">Run an accessibility check before client handoff.</h1>
          <p className="lede revealItem delayTwo">
            Paste a public page, catch common WCAG issues, and turn the result into
            a fix list your client can understand before launch review.
          </p>

          <form className="scanForm revealItem delayThree" onSubmit={handleSubmit}>
            <div className="formTopline">
              <label htmlFor="url">Website URL</label>
              <span>One-page scan</span>
            </div>
            <div className="inputRow">
              <input
                id="url"
                name="url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://yourwebsite.com…"
                autoComplete="off"
                inputMode="url"
                spellCheck={false}
                required
              />
              <button type="submit" disabled={isScanning}>
                {isScanning ? "Scanning…" : "Scan site"}
              </button>
            </div>
            <p className="hint">
              Built for pre-launch reviews. One public page only, with results kept in this session.
            </p>
          </form>

          <div className="sampleReportCard revealItem delayFour">
            <div>
              <strong>Need to see the handoff flow first?</strong>
              <p>Load a realistic sample with score, launch risk, top fixes, and client wording.</p>
            </div>
            <button type="button" onClick={loadSampleReport}>
              Load sample report
            </button>
          </div>

          <div className="examplesMarquee revealItem delayFour" aria-label="Example websites">
            <div className="marqueeTrack">
              {[...exampleSites, ...exampleSites].map((site, index) => (
                <button
                  key={`${site.url}-${index}`}
                  className="exampleChip"
                  type="button"
                  onClick={() => {
                    setUrl(site.url);
                    runScan(site.url);
                  }}
                >
                  <span className={`siteLogo ${site.tone}`} aria-hidden="true">
                    <Image
                      src={site.logoSrc}
                      alt=""
                      width={20}
                      height={20}
                      sizes="20px"
                      unoptimized
                    />
                  </span>
                  <span>{site.domain}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="signalStrip revealItem delayFive" aria-label="MVP capabilities">
            <div>
              <strong>Before handoff</strong>
              <span>Check the page before client review</span>
            </div>
            <div>
              <strong>Client-safe wording</strong>
              <span>Explain risks without audit jargon</span>
            </div>
            <div>
              <strong>Report-ready</strong>
              <span>Print today, saved exports next</span>
            </div>
          </div>
        </div>

        <aside
          ref={previewRef}
          className="previewPanel"
          aria-label="Scanner preview"
          id="report"
          onMouseMove={handlePreviewPointerMove}
          data-scroll-reveal
        >
          <div className="scanSweep" aria-hidden="true" />
          <div className="panelHeader">
            <span>Report console</span>
            <span className="statusPill">
              <span className="statusDot" aria-hidden="true" />
              Ready
            </span>
          </div>
          <div
            key={result ? result.score : isScanning ? "scan" : "idle"}
            className="scoreDial"
            style={{ "--score-angle": scoreAngle } as CSSProperties}
          >
            <span>{result ? result.score : isScanning ? "--" : "82"}</span>
            <small>access score</small>
          </div>
          <div className="metricGrid">
            {(Object.keys(impactLabels) as Impact[]).map((impact) => (
              <div key={impact} className={`metric ${impact}`}>
                <strong>{result ? result.summary[impact] : impact === "serious" ? 3 : 0}</strong>
                <span>{impactLabels[impact]}</span>
              </div>
            ))}
          </div>
          <div className="scanTimeline" aria-label="Scan pipeline">
            <div className={isScanning ? "active" : ""}>
              <span />
              Fetch page
            </div>
            <div className={isScanning ? "active delayOne" : ""}>
              <span />
              Run rules
            </div>
            <div className={isScanning ? "active delayTwo" : ""}>
              <span />
              Prioritize fixes
            </div>
          </div>
        </aside>
      </section>

      {scanFailure ? (
        <section className="notice error" role="alert" data-scroll-reveal>
          <div className="noticeHeader">
            <span aria-hidden="true" />
            <div>
              <strong>{scanFailure.title}</strong>
              <p>{scanFailure.summary}</p>
            </div>
          </div>
          <details className="scanFailureDetails">
            <summary>Show scanner response</summary>
            <p>{scanFailure.detail}</p>
          </details>
          <div className="nextStepList" aria-label="Suggested next steps">
            {scanFailure.nextSteps.map((step) => (
              <div key={step}>
                <span aria-hidden="true" />
                {step}
              </div>
            ))}
          </div>
          <div className="noticeActions">
            <button type="button" onClick={() => runScan(url)} disabled={isScanning || !url.trim()}>
              Try again
            </button>
            <button type="button" className="secondaryAction" onClick={loadSampleReport}>
              View sample report
            </button>
          </div>
        </section>
      ) : null}

      {isScanning ? <LoadingReport /> : null}

      {result ? (
        <section className="results isVisible" aria-live="polite" id="issues" data-scroll-reveal>
          <div className="resultsHeader">
            <div>
              <p className="eyebrow">{result.isSample ? "Sample report" : "Scan complete"}</p>
              <h2>{resultTitle}</h2>
              <span className="resultDomain">{resultDomain}</span>
              <p>
                {result.isSample ? "Demo generated" : "Scanned"} {formatScanDate(result.scannedAt)}.
                Found {result.issueCount} issue groups to review before handoff.
              </p>
            </div>
            <div className="finalScore">
              <span>{result.score}</span>
              <small>/100</small>
            </div>
          </div>

          <div className="summaryStrip">
            {(Object.keys(impactLabels) as Impact[]).map((impact) => (
              <div key={impact} data-scroll-reveal>
                <strong>{result.summary[impact]}</strong>
                <span>{impactLabels[impact]}</span>
                <p>{impactDescriptions[impact]}</p>
              </div>
            ))}
          </div>

          <aside className="trustNote" aria-label="Report accuracy note" data-scroll-reveal>
            <span aria-hidden="true" />
            <div>
              <strong>{trustDisclaimer.title}</strong>
              <p>{trustDisclaimer.summary}</p>
            </div>
          </aside>

          {handoffDecision ? (
            <div className={`handoffDecision ${handoffDecision.tone}`} data-scroll-reveal>
              <div className="decisionCopy">
                <p className="eyebrow">Handoff decision</p>
                <h3>{handoffDecision.label}</h3>
                <p>{handoffDecision.summary}</p>
              </div>
              <div className="decisionPanel">
                <div>
                  <span>First fix</span>
                  <strong>{handoffDecision.firstAction}</strong>
                  <p>{handoffDecision.actionDetail}</p>
                </div>
                <div>
                  <span>Client wording</span>
                  <p>{handoffDecision.clientWording}</p>
                </div>
              </div>
            </div>
          ) : null}

          {scoreStatus ? (
            <div className={`clientBrief ${scoreStatus.tone}`} data-scroll-reveal>
              <div className="briefMain">
                <p className="eyebrow">Client summary</p>
                <h3>{scoreStatus.label}</h3>
                <p>{scoreStatus.summary}</p>
              </div>

              <div className="briefStats" aria-label="Report readiness">
                <div>
                  <span>Score</span>
                  <strong>{result.score}/100</strong>
                </div>
                <div>
                  <span>Issue groups</span>
                  <strong>{result.issueCount}</strong>
                </div>
                <div>
                  <span>Top priority</span>
                  <strong>
                    {topPriorities[0] ? priorityLabels[topPriorities[0].impact] : "Manual QA"}
                  </strong>
                </div>
              </div>

              <div className="priorityPreview">
                <div className="sectionHeading">
                  <span>Priority fix list</span>
                  <small>Before launch</small>
                </div>

                {topPriorities.length > 0 ? (
                  <ol>
                    {topPriorities.map((issue) => {
                      const guidance = issueGuidance[issue.id] || genericGuidance;

                      return (
                        <li key={`priority-${issue.id}`}>
                          <span className={`impactDot ${issue.impact}`} aria-hidden="true" />
                          <div>
                            <strong>{issue.help}</strong>
                            <p>{guidance.fix}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="emptyBrief">
                    No automated issues were found. Add manual keyboard and screen reader QA before
                    calling the page client-ready.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {result ? (
            <section className="nextActionCard" aria-label="Recommended next action" data-scroll-reveal>
              <div>
                <p className="eyebrow">Next action</p>
                <h3>{primaryNextAction}</h3>
                <p>{secondaryNextAction}</p>
              </div>
              <div className="nextActionSteps">
                <a href={topPriorities.length > 0 ? "#top-fixes" : "#manual-qa"}>
                  {topPriorities.length > 0 ? "Review top fixes" : "Open manual QA"}
                </a>
                <a href={topPriorities.length > 0 ? "#manual-qa" : "#report-preview"}>
                  {topPriorities.length > 0 ? "Manual QA checklist" : "Open report preview"}
                </a>
                <a href="#early-access">Get report updates</a>
              </div>
            </section>
          ) : null}

          {scoreStatus ? (
            <article className="auditReport" aria-label="Client-ready accessibility report" data-scroll-reveal>
              <div className="auditReportHeader">
                <div>
                  <p className="eyebrow">Client-ready report</p>
                  <h3>Accessibility first pass</h3>
                  <p>
                    A concise audit summary for launch reviews, QA handoffs, and client
                    conversations.
                  </p>
                </div>
                <div className="reportMeta">
                  <span>{reportId}</span>
                  <strong>{formatScanDate(result.scannedAt)}</strong>
                </div>
              </div>

              <div className="reportSnapshot">
                <div>
                  <span>Website</span>
                  <strong>{resultDomain}</strong>
                  <p>{result.url}</p>
                </div>
                <div>
                  <span>Access score</span>
                  <strong>{result.score}/100</strong>
                  <p>{scoreStatus.label}</p>
                </div>
                <div>
                  <span>Automated findings</span>
                  <strong>{result.issueCount}</strong>
                  <p>Issue groups found by the WCAG first pass.</p>
                </div>
              </div>

              <div className="reportNarrative">
                <div>
                  <span>Executive note</span>
                  <p>{scoreStatus.summary}</p>
                </div>
                <div>
                  <span>Recommended next step</span>
                  <p>
                    Fix the highest-priority issues first, rerun the scan, then complete a
                    manual keyboard and screen reader review before final approval.
                  </p>
                </div>
              </div>

              <div className="reportTrustNote">
                <span>{trustDisclaimer.title}</span>
                <p>{trustDisclaimer.summary}</p>
                <small>{trustDisclaimer.proof}</small>
              </div>

              <div className="reportPriorityBlock" id="top-fixes">
                <div className="sectionHeading">
                  <span>Top fixes to address</span>
                  <small>Ordered by launch risk</small>
                </div>
                {topPriorities.length > 0 ? (
                  <ol>
                    {topPriorities.map((issue) => {
                      const guidance = issueGuidance[issue.id] || genericGuidance;

                      return (
                        <li key={`report-${issue.id}`}>
                          <div>
                            <span className={`impactBadge ${issue.impact}`}>
                              {impactLabels[issue.impact]}
                            </span>
                            <strong>{issue.help}</strong>
                          </div>
                          <p>{guidance.fix}</p>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p>
                    No automated findings were detected. Add manual QA before sending a final
                    accessibility sign-off.
                  </p>
                )}
              </div>

              <div className="reportFooter">
                <span>Generated by AccessPing</span>
                <span>Automated checks do not replace manual accessibility QA.</span>
              </div>
            </article>
          ) : null}

          <section className="manualQaChecklist" id="manual-qa" aria-label="Manual QA checklist" data-scroll-reveal>
            <div className="sectionHeading">
              <div>
                <span>Manual QA checklist</span>
                <small>Do this before final sign-off</small>
              </div>
              <p>Automated scans catch common issues. These checks cover the human review pass.</p>
            </div>
            <div className="checklistGrid">
              {manualChecklist.map((item, index) => (
                <article key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="reportCta" id="report-preview" data-scroll-reveal>
            <div>
              <p className="eyebrow">Report preview</p>
              <h3>Turn this scan into proof your client can understand.</h3>
              <p>
                Package the score, priority fixes, affected elements, and plain-English
                guidance into a report you can attach to a launch review.
              </p>
            </div>
            <div className="ctaActions" aria-label="Planned report actions">
              <button type="button" onClick={downloadPdfReport} disabled={isDownloadingPdf}>
                {isDownloadingPdf ? "Preparing PDF..." : "Download PDF"}
              </button>
              <button type="button" onClick={printReport}>
                Print report
              </button>
              <button type="button" disabled>
                Create fix plan soon
              </button>
            </div>
          </div>

          <form className="leadCapture" id="early-access" onSubmit={submitLead} data-scroll-reveal>
            <div>
              <p className="eyebrow">Early access beta</p>
              <h3>Get the report workflow when it becomes more than a preview.</h3>
              <p>
                Join the beta list for PDF export, saved client reports, and reusable fix
                templates built around the handoff flow you just tested.
              </p>
              <ul className="leadBenefits" aria-label="Early access benefits">
                {leadBenefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>
            <div className="leadForm">
              <span className="leadFormLabel">Reserve early access</span>
              <label className="srOnly" htmlFor="lead-email">
                Email address
              </label>
              <input
                id="lead-email"
                type="email"
                name="email"
                value={leadEmail}
                onChange={(event) => {
                  setLeadEmail(event.target.value);
                  setLeadStatus("idle");
                  setLeadMessage("");
                }}
                placeholder="you@agency.com…"
                autoComplete="email"
                spellCheck={false}
                required
              />
              <button type="submit" disabled={leadStatus === "saving"}>
                {leadStatus === "saving"
                  ? "Saving…"
                  : leadStatus === "saved"
                    ? "Saved"
                    : "Send me the report beta"}
              </button>
              <span className="privacyNote">No spam. Just beta updates for AccessPing reports.</span>
              {leadMessage ? (
                <p
                  className={leadStatus === "error" ? "leadError" : ""}
                  role={leadStatus === "error" ? "alert" : "status"}
                >
                  {leadMessage}
                </p>
              ) : null}
            </div>
          </form>

          {orderedIssues.length > 0 ? (
            <div className="issueList">
              {orderedIssues.map((issue) => {
                const guidance = issueGuidance[issue.id] || genericGuidance;

                return (
                  <article className="issue" key={issue.id} data-scroll-reveal>
                    <div className="issueTopline">
                      <span className={`impactBadge ${issue.impact}`}>
                        {impactLabels[issue.impact]}
                      </span>
                      <span className="priorityTag">{priorityLabels[issue.impact]}</span>
                      <a href={issue.helpUrl} target="_blank" rel="noreferrer">
                        WCAG help
                      </a>
                    </div>
                    <h3>{issue.help}</h3>
                    <p>{issue.description}</p>

                    <div className="guidanceGrid">
                      <div>
                        <strong>What this means</strong>
                        <p>{guidance.meaning}</p>
                      </div>
                      <div>
                        <strong>Why it matters</strong>
                        <p>{guidance.why}</p>
                      </div>
                      <div>
                        <strong>How to fix</strong>
                        <p>{guidance.fix}</p>
                      </div>
                    </div>

                    <div className="nodeBox">
                      <strong>{issue.nodes.length} affected element(s)</strong>
                      <code>{issue.nodes[0]?.target.join(", ") || "No selector available"}</code>
                      <p>{issue.nodes[0]?.failureSummary || "Review the affected markup."}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="notice">
              <strong>No automated issues found</strong>
              <p>
                Automated scans are a strong first pass. Add manual keyboard and screen
                reader checks before sending a final client report.
              </p>
            </div>
          )}
        </section>
      ) : null}

      <section className="landingSections" aria-label="Product details">
        <div className="problemBand" data-scroll-reveal>
          <p className="eyebrow">The problem</p>
          <h2>The page can look done while the handoff is still risky.</h2>
          <p>
            Freelancers and agencies are usually judged on what clients notice late:
            broken navigation, unreadable text, unclear buttons, and messy launch QA.
            AccessPing gives you a fast accessibility first pass before those issues
            become a client conversation.
          </p>
        </div>

        <div className="infoGrid">
          <article className="infoPanel wide" data-scroll-reveal>
            <p className="eyebrow">How it works</p>
            <div className="stepList">
              <div>
                <span>01</span>
                <strong>Paste a page URL</strong>
                <p>Run an automated WCAG first pass on a public page before review.</p>
              </div>
              <div>
                <span>02</span>
                <strong>See what could block handoff</strong>
                <p>Review severity, affected elements, and plain-English fix guidance.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Walk into review prepared</strong>
                <p>Use the fix list now, then package results into reusable client reports.</p>
              </div>
            </div>
          </article>

          <article className="infoPanel" data-scroll-reveal>
            <p className="eyebrow">Who it is for</p>
            <h3>For people who ship websites under client pressure.</h3>
            <ul className="audienceList">
              <li>Webflow freelancers before handoff</li>
              <li>Shopify agencies before launch QA</li>
              <li>WordPress developers before approval</li>
              <li>Small SaaS teams before release</li>
            </ul>
          </article>
        </div>

        <section className="pricingSection" aria-label="Early access pricing" data-scroll-reveal>
          <div className="pricingIntro">
            <p className="eyebrow">Early access offer</p>
            <h2>Start with a free scan. Upgrade when handoffs need proof.</h2>
            <p>
              AccessPing is free while the MVP is being shaped. The paid direction is
              simple: saved reports, cleaner PDF exports, and recurring checks for
              client sites that keep changing after launch.
            </p>
          </div>

          <div className="pricingGrid">
            <article className="pricePlan">
              <div>
                <span className="planLabel">Free</span>
                <h3>First pass</h3>
                <p>For quick checks before a one-page handoff.</p>
              </div>
              <strong>$0</strong>
              <ul>
                <li>One-page WCAG scan</li>
                <li>Access score and severity summary</li>
                <li>Printable report preview</li>
              </ul>
              <a href="#scanner">Run a scan</a>
            </article>

            <article className="pricePlan featured">
              <div>
                <span className="planLabel">Pro</span>
                <h3>Client handoff</h3>
                <p>For freelancers who want cleaner reports without rebuilding them manually.</p>
              </div>
              <strong>$12<span>/mo</span></strong>
              <ul>
                <li>Saved client-ready reports</li>
                <li>Email export and report history</li>
                <li>Fix-plan templates for common issues</li>
              </ul>
              <a href="#early-access">Get early access</a>
            </article>

            <article className="pricePlan">
              <div>
                <span className="planLabel">Agency</span>
                <h3>Site monitoring</h3>
                <p>For teams checking multiple client sites before launches and retainers.</p>
              </div>
              <strong>$39<span>/mo</span></strong>
              <ul>
                <li>Weekly client-site checks</li>
                <li>Branded report exports</li>
                <li>Priority dashboard for fixes</li>
              </ul>
              <a href="#early-access">Request agency access</a>
            </article>
          </div>
        </section>
      </section>

      <footer className="siteFooter" aria-label="Site footer">
        <div>
          <strong>AccessPing</strong>
          <p>Automated WCAG first pass for public pages.</p>
        </div>
        <nav aria-label="Legal links">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </footer>
    </main>
  );
}

function LoadingReport() {
  return (
    <section className="loadingReport" aria-live="polite" aria-label="Scan loading">
      <div className="skeleton wide" />
      <div className="skeletonGrid">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeletonList">
        <div className="skeleton row" />
        <div className="skeleton row" />
        <div className="skeleton row" />
      </div>
    </section>
  );
}
