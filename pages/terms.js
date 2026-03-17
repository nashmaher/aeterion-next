import Head from "next/head";
import { T, btnOutline } from "../lib/theme";

const S = (title, children) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: "0 0 12px", letterSpacing: -0.3 }}>{title}</h2>
    <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.9 }}>{children}</div>
  </div>
);

export default function Terms() {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
      <Head>
        <title>Terms of Service | Aeterion Peptides</title>
        <meta name="description" content="Terms of Service for Aeterion Peptides. All products are sold exclusively for in vitro laboratory research." />
      </Head>

      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 300, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18, color: T.text, letterSpacing: -0.5 }}>Aeterion Labs</a>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a href="/privacy-policy" style={{ fontSize: 11, color: T.muted, textDecoration: "none" }}>Privacy</a>
            <a href="/disclaimer" style={{ fontSize: 11, color: T.muted, textDecoration: "none" }}>Disclaimer</a>
            <a href="/" style={{ ...btnOutline({ padding: "8px 18px", fontSize: 13, borderRadius: 10 }) }}>← Back to Store</a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-flex", background: T.blueSoft, borderRadius: 24, padding: "6px 20px", fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Legal</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 14px", color: T.text, letterSpacing: -1 }}>Terms of Service</h1>
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.8, margin: 0 }}>Effective Date: March 17, 2026</p>
        </div>

        <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, padding: "36px 32px" }}>
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.9, marginTop: 0, marginBottom: 32 }}>
            By accessing or using the website aeterionpeptides.com ("the Site") or purchasing products from Aeterion Labs ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the Site or purchase any products.
          </p>

          {S("1. Research Use Only", <>
            <div style={{ background: "#fffbeb", border: "1.5px solid #fbbf24", borderRadius: 12, padding: "14px 18px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <div style={{ fontWeight: 600, color: "#92400e", fontSize: 13, lineHeight: 1.7 }}>
                All products sold by Aeterion Labs are intended exclusively for in vitro laboratory research purposes conducted by qualified professionals. They are NOT for human consumption, veterinary use, therapeutic application, or any diagnostic purpose.
              </div>
            </div>
            <p style={{ margin: 0 }}>
              Products are sold as research chemicals and are not drugs, supplements, food products, or medical devices. They have not been approved, evaluated, or cleared by the U.S. Food and Drug Administration (FDA) for any purpose.
            </p>
          </>)}

          {S("2. User Representation", <>
            <p style={{ margin: 0 }}>
              By placing an order, you represent and warrant that:
            </p>
            <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
              <li>You are a licensed researcher, scientist, or qualified professional.</li>
              <li>You are purchasing products solely for in vitro laboratory research purposes.</li>
              <li>You will not use, administer, or distribute any product for human or animal consumption, therapeutic use, or any purpose other than laboratory research.</li>
              <li>You are at least 18 years of age.</li>
              <li>You comply with all applicable federal, state, and local laws and regulations regarding the purchase and use of research chemicals.</li>
            </ul>
          </>)}

          {S("3. FDA Disclaimer", <>
            <p style={{ margin: 0 }}>
              None of the products sold on this website have been approved by the U.S. Food and Drug Administration (FDA). No product on this site is intended to diagnose, treat, cure, or prevent any disease. Product descriptions, research summaries, and compound information are provided for educational and informational purposes only and do not constitute medical advice, clinical recommendations, or therapeutic claims.
            </p>
          </>)}

          {S("4. Limitation of Liability", <>
            <p style={{ margin: 0 }}>
              To the fullest extent permitted by applicable law, Aeterion Labs' total aggregate liability to you for any and all claims arising from or relating to your purchase or use of any product shall not exceed the purchase price of the specific order giving rise to the claim. In no event shall Aeterion Labs be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities.
            </p>
          </>)}

          {S("5. Indemnification", <>
            <p style={{ margin: 0 }}>
              You agree to indemnify, defend, and hold harmless Aeterion Labs, its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in connection with your misuse of any product, your breach of these Terms of Service, or your violation of any law or regulation.
            </p>
          </>)}

          {S("6. No Warranty", <>
            <p style={{ margin: 0 }}>
              Products are provided "AS IS" for laboratory research purposes. Aeterion Labs makes no warranties, express or implied, regarding the fitness of any product for any particular purpose beyond in vitro laboratory research. We disclaim all warranties of merchantability, fitness for a particular purpose, and non-infringement to the fullest extent permitted by law. We warrant only that products conform to the specifications stated on their Certificate of Analysis (COA) at the time of shipment.
            </p>
          </>)}

          {S("7. Governing Law", <>
            <p style={{ margin: 0 }}>
              These Terms of Service shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions.
            </p>
          </>)}

          {S("8. Dispute Resolution", <>
            <p style={{ margin: "0 0 10px" }}>
              Any dispute, controversy, or claim arising out of or relating to these Terms of Service, or the breach thereof, shall be settled by binding arbitration administered by the American Arbitration Association (AAA) in accordance with its Commercial Arbitration Rules. The arbitration shall take place in the State of Texas.
            </p>
            <p style={{ margin: "0 0 10px" }}>
              <strong>Class Action Waiver:</strong> You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. You waive any right to participate in a class action lawsuit or class-wide arbitration against Aeterion Labs.
            </p>
            <p style={{ margin: 0 }}>
              The arbitrator's decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.
            </p>
          </>)}

          {S("9. Right to Refuse Service", <>
            <p style={{ margin: 0 }}>
              Aeterion Labs reserves the right to refuse service, cancel orders, or terminate accounts at our sole discretion, without prior notice or liability, for any reason, including but not limited to suspected misuse of products, fraudulent activity, or violation of these Terms of Service.
            </p>
          </>)}

          {S("10. Age Restriction", <>
            <p style={{ margin: 0 }}>
              You must be at least 18 years of age to access this website or purchase any products. By using the Site and placing an order, you confirm that you are 18 years of age or older. We reserve the right to request age verification at any time.
            </p>
          </>)}

          {S("11. Changes to These Terms", <>
            <p style={{ margin: 0 }}>
              We reserve the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated effective date. Your continued use of the Site after any modifications constitutes acceptance of the revised terms.
            </p>
          </>)}

          {S("12. Contact", <>
            <p style={{ margin: 0 }}>
              For questions about these Terms of Service, contact us at:<br /><br />
              <strong>Aeterion Labs</strong><br />
              Email: <a href="mailto:info@aeterionpeptides.com" style={{ color: T.blue }}>info@aeterionpeptides.com</a>
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
