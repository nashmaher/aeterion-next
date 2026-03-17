import Head from "next/head";
import { T, btnOutline } from "../lib/theme";

const S = (title, children) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: "0 0 12px", letterSpacing: -0.3 }}>{title}</h2>
    <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.9 }}>{children}</div>
  </div>
);

export default function Disclaimer() {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
      <Head>
        <title>Research Use Disclaimer | Aeterion Peptides</title>
        <meta name="description" content="Research Use Disclaimer for Aeterion Peptides. All products are for in vitro laboratory research only." />
      </Head>

      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 300, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18, color: T.text, letterSpacing: -0.5 }}>Aeterion Labs</a>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a href="/privacy-policy" style={{ fontSize: 11, color: T.muted, textDecoration: "none" }}>Privacy</a>
            <a href="/terms" style={{ fontSize: 11, color: T.muted, textDecoration: "none" }}>Terms</a>
            <a href="/" style={{ ...btnOutline({ padding: "8px 18px", fontSize: 13, borderRadius: 10 }) }}>← Back to Store</a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-flex", background: T.blueSoft, borderRadius: 24, padding: "6px 20px", fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Legal</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 14px", color: T.text, letterSpacing: -1 }}>Research Use Disclaimer</h1>
          <p style={{ fontSize: 14, color: T.sub, lineHeight: 1.8, margin: 0 }}>Effective Date: March 17, 2026</p>
        </div>

        <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, padding: "36px 32px" }}>

          <div style={{ background: "#fffbeb", border: "2px solid #fbbf24", borderRadius: 14, padding: "20px 24px", marginBottom: 32, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0, fontWeight: 800, color: "#92400e", width: 24, height: 24, borderRadius: "50%", border: "2px solid #92400e", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>!</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#92400e", marginBottom: 6 }}>FOR IN VITRO RESEARCH USE ONLY</div>
              <div style={{ fontSize: 13, color: "#a16207", lineHeight: 1.7 }}>
                All compounds sold by Aeterion Labs are intended solely for in vitro research and laboratory use by qualified professionals. They are not drugs, supplements, food products, or medical devices.
              </div>
            </div>
          </div>

          {S("Products Are NOT:", <>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 8 }}><strong>NOT approved by the U.S. Food and Drug Administration (FDA)</strong> for any purpose.</li>
              <li style={{ marginBottom: 8 }}><strong>NOT intended for human consumption</strong> — orally, by injection, topically, or by any other route of administration.</li>
              <li style={{ marginBottom: 8 }}><strong>NOT intended for veterinary use</strong> — not for administration to animals.</li>
              <li style={{ marginBottom: 8 }}><strong>NOT intended to diagnose, treat, cure, or prevent any disease</strong> in humans or animals.</li>
              <li><strong>NOT dietary supplements, food additives, or cosmetic ingredients.</strong></li>
            </ul>
          </>)}

          {S("No Therapeutic Claims", <>
            <p style={{ margin: 0 }}>
              Aeterion Labs makes no therapeutic claims about any product. Product descriptions, research summaries, mechanisms of action, pharmacology data, and references to published studies are provided exclusively for educational and informational purposes to support qualified researchers. Such information does not imply any therapeutic efficacy, clinical recommendation, or medical advice. References to clinical trials or research outcomes describe findings in controlled research settings and do not suggest that our products will produce similar effects.
            </p>
          </>)}

          {S("What 'Research Grade' Means", <>
            <p style={{ margin: 0 }}>
              "Research grade" indicates that a compound has been manufactured, tested, and verified to a purity and identity standard suitable for in vitro laboratory research. Each product is independently tested by a third-party laboratory and ships with a batch-specific Certificate of Analysis (COA) documenting purity (typically ≥98-99% by HPLC) and identity (mass spectrometry confirmation). "Research grade" does not mean the compound is suitable for human use, clinical application, or any purpose other than laboratory research. Research-grade compounds are not manufactured under cGMP conditions and are not produced to pharmaceutical standards.
            </p>
          </>)}

          {S("Buyer Responsibility", <>
            <p style={{ margin: 0 }}>
              By purchasing from Aeterion Labs, you accept full responsibility for ensuring that your use of any product complies with all applicable federal, state, and local laws and regulations. You confirm that you are a qualified researcher or professional purchasing exclusively for legitimate laboratory research purposes.
            </p>
          </>)}

          {S("Related Legal Documents", <>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 8 }}><a href="/privacy-policy" style={{ color: T.blue, fontWeight: 600 }}>Privacy Policy</a> — How we collect, use, and protect your data.</li>
              <li><a href="/terms" style={{ color: T.blue, fontWeight: 600 }}>Terms of Service</a> — Full terms governing your use of this website and purchases.</li>
            </ul>
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
