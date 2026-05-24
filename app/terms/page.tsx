const lastUpdated = "May 24, 2026";

export const metadata = {
  title: "Terms of Use | AccessPing",
  description: "Basic terms for using the AccessPing MVP scanner and reports."
};

export default function TermsPage() {
  return (
    <main className="legalPage">
      <a className="legalBack" href="/">
        AccessPing
      </a>

      <section className="legalHero">
        <p className="eyebrow">Terms of Use</p>
        <h1>Use AccessPing as a first pass, not a final audit.</h1>
        <p>
          These terms describe how the AccessPing MVP should be used while it is
          being developed and tested.
        </p>
        <span>Last updated: {lastUpdated}</span>
      </section>

      <section className="legalContent" aria-label="Terms of use details">
        <article>
          <h2>Service status</h2>
          <p>
            AccessPing is an early MVP. Features, pricing, scan behavior, and report
            formats may change as the product improves.
          </p>
        </article>

        <article>
          <h2>Acceptable use</h2>
          <p>
            Use AccessPing only for public web pages that you own, manage, or have
            permission to evaluate. Do not use it to scan private systems, login-only
            pages, or pages that contain confidential information.
          </p>
        </article>

        <article>
          <h2>Reports and accuracy</h2>
          <p>
            AccessPing provides automated accessibility checks and plain-language
            guidance. Automated tools can miss issues and can also flag items that
            need human review. A final accessibility audit should include manual
            keyboard, screen reader, and design checks.
          </p>
        </article>

        <article>
          <h2>No professional guarantee</h2>
          <p>
            Reports are provided for informational use. AccessPing does not guarantee
            legal compliance, full WCAG conformance, or that a website is accessible
            to every visitor.
          </p>
        </article>

        <article>
          <h2>Availability</h2>
          <p>
            The service may be unavailable, delayed, or blocked by third-party sites.
            Some websites may reject automated scans or return incomplete content.
          </p>
        </article>

        <article>
          <h2>Contact</h2>
          <p>
            For questions about these terms, contact the AccessPing project owner
            through the GitHub repository or the email channel used to reach you.
          </p>
        </article>
      </section>
    </main>
  );
}
