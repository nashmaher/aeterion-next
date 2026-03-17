import Head from "next/head";
import { T, btnOutline } from "../lib/theme";

const S = (title, children) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: "0 0 12px", letterSpacing: -0.3 }}>{title}</h2>
    <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.9 }}>{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
      <Head>
        <title>Privacy Policy | Aeterion Peptides</title>
        <meta name="description" content="Privacy Policy for Aeterion Peptides. Learn how we collect, use, and protect your personal data." />
      </Head>

      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 300, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18, color: T.text, letterSpacing: -0.5 }}>Aeterion Labs</a>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a href="/terms" style={{ fontSize: 11, color: T.muted, textDecoration: "none" }}>Terms</a>
            <a href="/disclaimer" style={{ fontSize: 11, color: T.muted, textDecoration: "none" }}>Disclaimer</a>
            <a href="/" style={{ ...btnOutline({ padding: "8px 18px", fontSize: 13, borderRadius: 10 }) }}>← Back to Store</a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-flex", background: T.blueSoft, borderRadius: 24, padding: "6px 20px", fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Legal</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 14px", color: T.text, letterSpacing: -1 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.8, margin: 0 }}>Effective Date: March 17, 2026</p>
        </div>

        <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, padding: "36px 32px" }}>
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.9, marginTop: 0, marginBottom: 32 }}>
            Aeterion Labs ("we," "us," or "our") operates the website aeterionpeptides.com. This Privacy Policy describes how we collect, use, store, and protect your personal information when you visit our website or make a purchase.
          </p>

          {S("1. Information We Collect", <>
            <p style={{ margin: "0 0 10px" }}>We collect the following categories of personal information:</p>
            <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
              <li><strong>Identity & Contact Information:</strong> Name, email address, shipping address, and billing address.</li>
              <li><strong>Purchase Information:</strong> Order history, products purchased, payment confirmation (we do not store full payment card details).</li>
              <li><strong>Build My Stack Quiz Inputs:</strong> Research goals, experience level, budget range, and cycle length preferences entered into our research tool. <strong>These inputs are treated as sensitive data</strong> (see Section 6).</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and pages visited (collected automatically via cookies/analytics).</li>
              <li><strong>Communications:</strong> Emails, support requests, and any information you voluntarily provide.</li>
            </ul>
          </>)}

          {S("2. How We Use Your Information", <>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations, shipping updates, and receipts</li>
              <li>Provide customer support</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and unauthorized transactions</li>
            </ul>
          </>)}

          {S("3. Third-Party Data Processors", <>
            <p style={{ margin: "0 0 10px" }}>We share your personal data with the following third-party service providers who process data on our behalf:</p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><strong>Supabase:</strong> Database hosting and user authentication. Data stored in the United States.</li>
              <li><strong>Resend:</strong> Transactional email delivery (order confirmations, shipping updates).</li>
              <li><strong>Stripe:</strong> Payment processing. Stripe handles all payment card data directly and is PCI-DSS compliant. We do not store your full payment card information.</li>
              <li><strong>Vercel:</strong> Website hosting and analytics.</li>
            </ul>
            <p style={{ margin: "10px 0 0" }}>We do not sell your personal data to any third party.</p>
          </>)}

          {S("4. Texas Data Privacy and Security Act (TDPSA) Rights", <>
            <p style={{ margin: "0 0 10px" }}>If you are a Texas resident, you have the following rights under the Texas Data Privacy and Security Act (effective July 1, 2024):</p>
            <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
              <li><strong>Right to Access:</strong> You may request confirmation of whether we are processing your personal data and obtain a copy of that data.</li>
              <li><strong>Right to Correct:</strong> You may request correction of inaccurate personal data.</li>
              <li><strong>Right to Delete:</strong> You may request deletion of your personal data.</li>
              <li><strong>Right to Data Portability:</strong> You may request a portable copy of your personal data in a commonly used format.</li>
              <li><strong>Right to Opt Out:</strong> You may opt out of the sale of your personal data, targeted advertising, or profiling.</li>
            </ul>
            <p style={{ margin: "0 0 10px" }}>To exercise any of these rights, contact us at <a href="mailto:privacy@aeterionpeptides.com" style={{ color: T.blue }}>privacy@aeterionpeptides.com</a>. We will respond within 45 days.</p>
            <p style={{ margin: 0 }}><strong>Note:</strong> The TDPSA does not provide a private right of action. Enforcement is conducted exclusively by the Texas Attorney General.</p>
          </>)}

          {S("5. California Consumer Privacy Act (CCPA) Rights", <>
            <p style={{ margin: "0 0 10px" }}>If you are a California resident, you have additional rights under the CCPA:</p>
            <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
              <li><strong>Right to Know:</strong> You may request disclosure of the categories and specific pieces of personal information we have collected about you.</li>
              <li><strong>Right to Delete:</strong> You may request deletion of your personal information.</li>
              <li><strong>Right to Opt Out of Sale:</strong> We do not sell personal information. If this changes, we will provide a "Do Not Sell My Personal Information" link.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
            </ul>
            <p style={{ margin: 0 }}>To exercise these rights, contact us at <a href="mailto:privacy@aeterionpeptides.com" style={{ color: T.blue }}>privacy@aeterionpeptides.com</a>.</p>
          </>)}

          {S("6. Sensitive Data — Build My Stack Quiz", <>
            <p style={{ margin: 0 }}>
              Inputs provided to our Build My Stack research tool (including research goals, experience level, and protocol preferences) are treated as sensitive data. This data is used solely to generate compound recommendations within the tool and is <strong>never sold to third parties</strong>. We do not use this data for advertising, profiling, or any purpose other than providing the research tool functionality.
            </p>
          </>)}

          {S("7. Cookies and Analytics", <>
            <p style={{ margin: 0 }}>
              We use Vercel Speed Insights to collect anonymized performance data about page load times and user experience. We do not use third-party advertising cookies or tracking pixels. Your browser may store functional cookies necessary for the operation of the site (e.g., cart state, age verification preference). You can disable cookies in your browser settings, though this may affect site functionality.
            </p>
          </>)}

          {S("8. Data Retention", <>
            <p style={{ margin: 0 }}>
              We retain your personal data for as long as necessary to fulfill the purposes described in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Order records are retained for a minimum of 7 years for tax and legal compliance. You may request deletion of your account data at any time by contacting us; we will delete or anonymize your data within 45 days, except where retention is required by law.
            </p>
          </>)}

          {S("9. Data Security", <>
            <p style={{ margin: 0 }}>
              We implement appropriate technical and organizational measures to protect your personal data, including encrypted connections (HTTPS/TLS), secure database access controls, and PCI-compliant payment processing through Stripe. No method of electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </>)}

          {S("10. Contact Us", <>
            <p style={{ margin: 0 }}>
              For any privacy-related questions, data access requests, or to exercise your rights under the TDPSA or CCPA, contact us at:<br /><br />
              <strong>Aeterion Labs</strong><br />
              Email: <a href="mailto:privacy@aeterionpeptides.com" style={{ color: T.blue }}>privacy@aeterionpeptides.com</a>
            </p>
          </>)}
        </div>
      </div>

      <footer style={{ background: "#111827", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: 12 }}>
        <p style={{ margin: "0 0 8px" }}>© 2025 Aeterion Peptides. All Rights Reserved.</p>
        <p style={{ margin: "0 0 8px" }}>All products for laboratory research purposes only. Not for human consumption. Must be 18+.</p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
          <a href="/privacy-policy" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 11 }}>Privacy Policy</a>
          <a href="/terms" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 11 }}>Terms of Service</a>
          <a href="/disclaimer" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 11 }}>Disclaimer</a>
        </div>
      </footer>
    </div>
  );
}
