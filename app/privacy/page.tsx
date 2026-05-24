const lastUpdated = "May 24, 2026";

export const metadata = {
  title: "Privacy Policy | AccessPing",
  description: "How AccessPing handles scan URLs, report data, and email leads."
};

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <a className="legalBack" href="/">
        AccessPing
      </a>

      <section className="legalHero">
        <p className="eyebrow">Privacy Policy</p>
        <h1>We collect only what the MVP needs to run.</h1>
        <p>
          AccessPing scans public web pages and lets visitors request follow-up
          access. This policy explains what is collected, why it is collected, and
          how to contact us.
        </p>
        <span>Last updated: {lastUpdated}</span>
      </section>

      <section className="legalContent" aria-label="Privacy policy details">
        <article>
          <h2>Information we collect</h2>
          <p>
            When you run a scan, AccessPing processes the website URL you enter and
            generates a temporary accessibility report. If you submit the lead form,
            we store your email address, scanned URL, page title, score, issue count,
            source, and timestamp.
          </p>
        </article>

        <article>
          <h2>How we use it</h2>
          <p>
            We use scan data to show the report, improve the product, and understand
            what types of pages people test. We use submitted email addresses to
            follow up about AccessPing, early access, reports, and product updates.
          </p>
        </article>

        <article>
          <h2>What we do not do</h2>
          <p>
            We do not sell personal data. We do not ask for passwords. AccessPing is
            designed for public pages, so you should not submit private dashboards,
            authenticated URLs, or confidential client pages.
          </p>
        </article>

        <article>
          <h2>Storage and service providers</h2>
          <p>
            Lead data is stored in Supabase. The application is hosted on Vercel.
            These providers process data needed to host the app, run server routes,
            and store submitted leads.
          </p>
        </article>

        <article>
          <h2>Your choices</h2>
          <p>
            You can ask us to remove your submitted lead information by contacting
            the project owner. If you do not want us to store your email, you can use
            the scanner without submitting the lead form.
          </p>
        </article>

        <article>
          <h2>Contact</h2>
          <p>
            For privacy questions, contact the AccessPing project owner through the
            GitHub repository or the email channel used to reach you.
          </p>
        </article>
      </section>
    </main>
  );
}
