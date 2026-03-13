// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import Head from "next/head";

/* ─── Supabase live inventory ─── */
const SB_URL = "https://kafwkhbzdtpsxkufmkmm.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZndraGJ6ZHRwc3hrdWZta21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDEyODAsImV4cCI6MjA4ODQ3NzI4MH0.sa4_CFHQpBkWVc02et_pSsu35wqPLQpD8g4WIxYRCIA";

async function fetchInventory() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/products?select=id,stock,in_stock`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    if (!res.ok) return {};
    const rows = await res.json();
    // Returns { [productId]: { stock, inStock } }
    return Object.fromEntries(rows.map(r => [r.id, { stock: r.stock, inStock: r.in_stock }]));
  } catch { return {}; }
}

/* ─── Supabase Auth helpers ─── */
async function sbSignUp({ email, password, fullName }) {
  const res = await fetch(`${SB_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, data: { full_name: fullName } }),
  });
  return res.json();
}

async function sbSignIn({ email, password }) {
  const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function sbSignOut(token) {
  await fetch(`${SB_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${token}` },
  });
}

async function sbGetProfile(token) {
  const res = await fetch(`${SB_URL}/rest/v1/profiles?select=*`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${token}` },
  });
  const rows = await res.json();
  return rows?.[0] || null;
}

async function sbSaveProfile(token, userId, profile) {
  await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify(profile),
  });
}

async function sbGetMyOrders(token, userId) {
  const res = await fetch(`${SB_URL}/rest/v1/orders?user_id=eq.${userId}&select=*&order=created_at.desc`, {
    headers: { "apikey": SB_KEY, "Authorization": `Bearer ${token}` },
  });
  return res.json();
}

// Persist session
let _session = null;
function getSession() {
  if (_session) return _session;
  try {
    const s = sessionStorage.getItem("sb_session") || localStorage.getItem("sb_session");
    if (s) { _session = JSON.parse(s); return _session; }
    const match = document.cookie.match(/sb_session=([^;]+)/);
    if (match) { _session = JSON.parse(decodeURIComponent(match[1])); return _session; }
  } catch {}
  return null;
}
function saveSession(s) {
  _session = s;
  const val = encodeURIComponent(JSON.stringify(s));
  try { localStorage.setItem("sb_session", JSON.stringify(s)); } catch {}
  try { sessionStorage.setItem("sb_session", JSON.stringify(s)); } catch {}
  try { document.cookie = `sb_session=${val};path=/;max-age=604800`; } catch {}
}
function clearSession() {
  _session = null;
  try { localStorage.removeItem("sb_session"); } catch {}
  try { sessionStorage.removeItem("sb_session"); } catch {}
  try { document.cookie = "sb_session=;path=/;max-age=0"; } catch {}
}

/* ─── Fonts loaded via index.html ─── */

function useIsMobile() {
  const [mob, setMob] = useState(false); // always false on SSR to prevent hydration mismatch
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setMob(e.matches);
    mq.addEventListener("change", handler);
    setMob(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mob;
}

function useIsTablet() {
  const [tab, setTab] = useState(false); // always false on SSR to prevent hydration mismatch
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e) => setTab(e.matches);
    mq.addEventListener("change", handler);
    setTab(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return tab;
}

/* ─── AETERION LOGO SVG ─── */
function AeterionLogo({ size = 44, showText = true, textColor = "#1B3A6B", dark = false }) {
  const navy = dark ? "#ffffff" : "#1B3A6B";
  const blue = dark ? "rgba(255,255,255,0.6)" : "#4A9FD4";
  const vbW = showText ? 370 : 100;
  const vbH = 90;

  // Left leg clip: outer edge (50,0 -> 4,82) + inner edge (50,12 -> 16,82)
  // Right leg clip: outer edge (50,0 -> 96,82) + inner edge (50,12 -> 84,82)
  const numStripes = 18;
  const stripes = Array.from({ length: numStripes }, (_, i) => ((i + 0.5) / numStripes) * 88);

  return (
    <svg
      width={size * (vbW / vbH)} height={size}
      viewBox={`0 0 ${vbW} ${vbH}`}
      fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lgL" x1="50" y1="0" x2="4" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#2B6CB0"/>
          <stop offset="50%"  stopColor="#4A9FD4"/>
          <stop offset="100%" stopColor="#7EC8F0"/>
        </linearGradient>
        <linearGradient id="lgR" x1="50" y1="0" x2="96" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#2B6CB0"/>
          <stop offset="50%"  stopColor="#4A9FD4"/>
          <stop offset="100%" stopColor="#7EC8F0"/>
        </linearGradient>
        <clipPath id="cL">
          <polygon points="50,0 50,12 16,82 4,82"/>
        </clipPath>
        <clipPath id="cR">
          <polygon points="50,0 50,12 84,82 96,82"/>
        </clipPath>
      </defs>

      {/* Solid apex cap */}
      <polygon points="50,0 58,14 42,14" fill="#2B6CB0"/>

      {/* Left leg stripes */}
      <g clipPath="url(#cL)">
        {stripes.map((y, i) => (
          <line key={"l"+i} x1={0} y1={y} x2={100} y2={y} stroke="url(#lgL)" strokeWidth={2.8}/>
        ))}
      </g>

      {/* Right leg stripes */}
      <g clipPath="url(#cR)">
        {stripes.map((y, i) => (
          <line key={"r"+i} x1={0} y1={y} x2={100} y2={y} stroke="url(#lgR)" strokeWidth={2.8}/>
        ))}
      </g>

      {/* Arc connecting the legs */}
      <path d="M18,80 Q50,52 82,80" stroke="#3A85C0" strokeWidth={5} fill="none" strokeLinecap="round"/>

      {/* Text */}
      {showText && (
        <>
          <text x="108" y="48" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="900" fontSize="34" letterSpacing="1.5" fill={navy}>AETERION</text>
          <text x="118" y="70" fontFamily="'DM Sans', Arial, sans-serif" fontWeight="500" fontSize="16" letterSpacing="5" fill={blue}>— LABS —</text>
        </>
      )}
    </svg>
  );
}

/* ─── PRODUCT IMAGES — swap these URLs once you generate in ChatGPT ─── */
const VIAL = "https://res.cloudinary.com/djxfmxrfx/image/upload/w_400,h_500,c_fill,f_auto,q_auto/image_Mar_5_2026_12_57_37_AM_wsipaw";
const IMGS = {
  metabolic:   VIAL,
  growth:      VIAL,
  recovery:    VIAL,
  longevity:   VIAL,
  neuro:       VIAL,
  body:        VIAL,
  hormonal:    VIAL,
  cosmetic:    VIAL,
  ancillaries: VIAL,
};


const DISC = { 1: 1, 5: 0.92, 10: 0.82 };

const CATS = [
  { id:"metabolic",   label:"GLP-1 / Metabolic",     icon:"" },
  { id:"growth",      label:"Growth Hormone",         icon:"" },
  { id:"recovery",    label:"Recovery & Healing",     icon:"" },
  { id:"longevity",   label:"Longevity & Anti-Aging", icon:"" },
  { id:"neuro",       label:"Cognitive & Neuro",      icon:"" },
  { id:"body",        label:"Body Composition",        icon:"" },
  { id:"hormonal",    label:"Hormonal",                icon:"" },
  { id:"cosmetic",    label:"Cosmetic",                icon:"" },
  { id:"ancillaries", label:"Ancillaries",             icon:"" },
];

const P = (id, cat, name, variants, desc, badge = null, isNew = false, form = "injectable", highlights = [], research = null) => ({
  id, cat, name, variants, desc, badge, isNew, form, img: IMGS[cat], highlights, research,
});

// Long-form research content for all products (shown in modal)
const RESEARCH = {
  1: {
    mechanism: `Semaglutide is a 94% homologous analogue of endogenous GLP-1, engineered with a C18 fatty diacid chain at lysine 26 enabling reversible albumin binding. This extends plasma half-life to approximately 165–184 hours, making once-weekly dosing feasible in research models.`,
    pharmacology: `GLP-1 receptors are expressed in pancreatic beta cells, hypothalamus, brainstem, heart, kidneys, and gut. Activation produces glucose-dependent insulin secretion, glucagon suppression, slowed gastric emptying, and centrally-mediated appetite reduction.`,
    research: `STEP 1 showed 14.9% mean body weight reduction over 68 weeks at 2.4mg weekly vs 2.4% placebo. SUSTAIN-6 cardiovascular outcomes trial demonstrated a 26% reduction in major adverse cardiovascular events.`,
    storage: `Store lyophilized at -20°C. Once reconstituted, stable 28 days at 2–8°C protected from light. Avoid freeze-thaw cycles. Reconstitute with bacteriostatic water.`,
    specs: [["Molecular Formula", "C₁₈₇H₂₉₁N₄₅O₅₉"], ["Molecular Weight", "4113.6 Da"], ["Half-life", "~165–184 hours"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"], ["Form", "Lyophilized powder"]],
  },
  2: {
    mechanism: `Tirzepatide is a 39-amino acid dual agonist at GIP and GLP-1 receptors. Simultaneous activation of both incretin pathways produces synergistic effects on insulin secretion, glucagon suppression, and energy balance that exceed single-agonist compounds.`,
    pharmacology: `GIP receptor activation enhances insulin secretion, promotes adiponectin from adipose tissue, and improves peripheral insulin sensitivity. Combined with GLP-1's appetite and gastric emptying effects, the dual mechanism produces uniquely potent metabolic outcomes.`,
    research: `SURPASS-2 showed tirzepatide 15mg achieved 2.37% HbA1c reduction and 11.2kg weight loss vs semaglutide 1mg's 1.86% and 6.2kg. SURMOUNT-1 demonstrated 20.9% mean weight reduction at 15mg — the largest pharmacological weight reduction observed at that time.`,
    storage: `Store lyophilized at -20°C. Stable 28 days at 2–8°C once reconstituted. Protect from light. Use bacteriostatic water.`,
    specs: [["Molecular Formula", "C₂₂₅H₃₄₈N₄₈O₆₈"], ["Molecular Weight", "4813.5 Da"], ["Half-life", "~5 days"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"], ["Receptor Targets", "GIP-R + GLP-1R"]],
  },
  3: {
    mechanism: `Retatrutide is a triple agonist at GLP-1, GIP, and glucagon receptors simultaneously. The glucagon component adds thermogenic and energy expenditure effects to incretin-mediated appetite suppression, creating a three-pathway metabolic intervention.`,
    pharmacology: `Glucagon receptor activation increases hepatic glucose output, promotes lipolysis, and raises basal metabolic rate — effects complementing the insulin-sensitizing and appetite-suppressing properties of its GLP-1 and GIP components. This positions retatrutide for severe metabolic dysfunction research.`,
    research: `Phase 2 trials showed 24.2% body weight reduction at the highest dose over 48 weeks — surpassing all prior pharmacological records. Subjects showed reductions in liver fat, triglycerides, and visceral adiposity beyond what dual agonists achieved.`,
    storage: `Store lyophilized at -20°C. Reconstitute with bacteriostatic water; stable 28 days at 2–8°C. Protect from light and avoid freeze-thaw cycling.`,
    specs: [["Receptor Targets", "GLP-1R + GIP-R + GcgR"], ["Half-life", "~6 days (estimated)"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"], ["Generation", "Next-gen triple agonist"], ["Status", "Phase 2/3 clinical research"]],
  },
  4: {
    mechanism: `Liraglutide is a long-acting GLP-1 analogue with 97% sequence homology to native human GLP-1, modified with a C16 fatty acid at lysine 26 via a glutamic acid spacer. This enables albumin binding and extends half-life to ~13 hours, allowing once-daily dosing.`,
    pharmacology: `As a GLP-1 receptor agonist, liraglutide increases glucose-dependent insulin secretion, suppresses glucagon, delays gastric emptying, and reduces hypothalamic appetite signaling. Its cardiovascular benefits are well-documented through multiple large outcome trials.`,
    research: `The LEADER cardiovascular outcomes trial demonstrated 13% reduction in major adverse cardiovascular events. SCALE trials documented 5–8% body weight reduction over 56 weeks. Liraglutide has over a decade of clinical data as one of the most extensively studied GLP-1 analogues.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Use bacteriostatic water.`,
    specs: [["Molecular Formula", "C₁₇₂H₂₆₅N₄₃O₅₁"], ["Molecular Weight", "3751.2 Da"], ["Half-life", "~13 hours"], ["Homology", "97% to native GLP-1"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  5: {
    mechanism: `Dulaglutide is a GLP-1 receptor agonist fused to a human IgG4 Fc fragment via two short peptide linkers. This architecture creates a large molecule resistant to DPP-4 degradation and renal clearance, extending half-life to approximately 5 days for once-weekly dosing.`,
    pharmacology: `The Fc fusion stabilizes the GLP-1 analogue and reduces immunogenicity while maintaining receptor agonism. Effects include glucose-dependent insulin secretion, glucagon suppression, gastric emptying delay, and satiety signaling.`,
    research: `The AWARD trial series across 8 trials demonstrated consistent HbA1c reductions of 1.1–1.6% and body weight reductions of 2–4kg. REWIND cardiovascular outcomes trial showed 12% reduction in major adverse cardiovascular events.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. Handle gently — the large Fc-fusion structure is sensitive to vigorous agitation.`,
    specs: [["Molecular Weight", "~59,700 Da"], ["Structure", "GLP-1 analogue + IgG4-Fc fusion"], ["Half-life", "~5 days"], ["Dosing", "Once weekly"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  6: {
    mechanism: `Mazdutide (IBI362) is a dual GLP-1 and glucagon receptor co-agonist. The glucagon component raises basal energy expenditure and promotes hepatic fat oxidation while the GLP-1 component suppresses appetite and improves insulin sensitivity.`,
    pharmacology: `Glucagon receptor agonism produces hepatic effects including increased glycogenolysis, lipolysis, and fatty acid oxidation. These thermogenic effects add a distinct dimension to GLP-1-only approaches, potentially addressing metabolic adaptation to caloric restriction.`,
    research: `Chinese Phase 2 trials showed weight reductions of 10–14% over 24 weeks. Liver fat reduction was notable, making it a subject of active NASH research. The compound is advancing through Phase 3 trials in China with international data emerging.`,
    storage: `Store lyophilized at -20°C. Reconstitute with bacteriostatic water; stable 28 days at 2–8°C. Handle with standard peptide storage precautions.`,
    specs: [["Also Known As", "IBI362"], ["Receptor Targets", "GLP-1R + GcgR"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"], ["Research Stage", "Phase 3 (China)"], ["Key Indication", "Obesity + NASH research"]],
  },
  7: {
    mechanism: `Survodutide (BI 456906) is a potent GLP-1 and glucagon receptor co-agonist with a bias toward glucagon receptor agonism. This glucagon-heavy profile produces stronger thermogenic and hepatic fat-reducing effects compared to more balanced dual agonists.`,
    pharmacology: `The glucagon-biased mechanism makes survodutide particularly relevant for NAFLD and NASH research. Glucagon receptor activation promotes hepatic beta-oxidation of fatty acids and reduces hepatic lipogenesis, while GLP-1 simultaneously suppresses appetite.`,
    research: `Phase 2 NASH trials showed liver fat reduction of up to 60% and body weight reductions of 12–15% over 24 weeks. Boehringer Ingelheim's Phase 2b NASH trial results positioned survodutide as a leading candidate in NASH pharmacotherapy research.`,
    storage: `Store lyophilized at -20°C. Reconstitute with bacteriostatic water. Stable 28 days at 2–8°C refrigerated. Standard peptide cold-chain shipping.`,
    specs: [["Also Known As", "BI 456906"], ["Receptor Bias", "Glucagon-biased dual agonist"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"], ["Key Research", "NAFLD/NASH models"], ["Status", "Phase 2b/3 trials"]],
  },
  8: {
    mechanism: `Cagrilintide is a long-acting amylin analogue engineered with a fatty acid modification enabling once-weekly dosing. It acts through amylin receptors (AMY1–3, calcitonin receptor complexes) to suppress glucagon secretion, slow gastric emptying, and reduce food intake via central mechanisms.`,
    pharmacology: `Amylin and GLP-1 act through distinct but complementary receptors — amylin receptors are highly expressed in the area postrema of the brainstem, while GLP-1 receptors predominate in the hypothalamus and vagus nerve. This anatomical separation means combined stimulation targets appetite through multiple non-redundant neural circuits.`,
    research: `Phase 2 trials of cagrilintide monotherapy showed dose-dependent weight loss of 6–11% over 26 weeks. Combined with semaglutide (CagriSema), additive effects exceeding 15% weight loss were observed — consistent with the complementary receptor mechanisms. Published data in NEJM validated the dual approach.`,
    storage: `Store lyophilized at -20°C. Reconstitute with bacteriostatic water; stable 28 days at 2–8°C. Handle identically to other long-acting peptide analogues.`,
    specs: [["Target", "Amylin receptors (AMY1–3)"], ["Half-life", "~7 days"], ["Dosing", "Once weekly"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"], ["Combination", "Synergistic with semaglutide"]],
  },
  9: {
    mechanism: `Cagrisema combines cagrilintide (amylin analogue) and semaglutide (GLP-1 analogue) in a single co-formulation. The two peptides act on anatomically and pharmacologically distinct receptor systems, producing additive rather than redundant appetite-suppressing and metabolic effects.`,
    pharmacology: `Semaglutide's hypothalamic GLP-1 signaling and cagrilintide's area postrema amylin signaling represent parallel neural pathways to the same outcome: reduced food intake and improved energy homeostasis. Co-administration amplifies both pathways simultaneously, explaining superior outcomes vs either compound alone.`,
    research: `The REDEFINE Phase 3 program demonstrated 22.7% mean weight reduction at 52 weeks in subjects with obesity — one of the highest pharmacologically-achieved weight reductions in clinical research history. The combination is being evaluated across multiple metabolic indications.`,
    storage: `Store lyophilized at -20°C. Stable 28 days at 2–8°C. Both peptides are compatible in solution.`,
    specs: [["Components", "Cagrilintide + Semaglutide"], ["Mechanism", "Dual amylin + GLP-1 agonism"], ["Clinical Result", "~22.7% weight reduction"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"], ["Dosing", "Once weekly co-formulation"]],
  },
  11: {
    mechanism: `Ipamorelin is a selective pentapeptide GHRP and ghrelin receptor agonist. Its selectivity for GHS-R1a distinguishes it from earlier GHRPs — it stimulates GH release without meaningfully activating ACTH, cortisol, or prolactin pathways.`,
    pharmacology: `Binding to GHS-R1a in the hypothalamus and anterior pituitary triggers GH release through phospholipase C and PKC signaling. The pulsatile GH release ipamorelin produces mirrors physiological GH secretion patterns. IGF-1 levels rise downstream, promoting anabolic and regenerative signaling.`,
    research: `Studies show 2–3× increases in GH pulse amplitude without cortisol elevation (vs GHRP-6 which raises cortisol ~80%). Animal studies document improved bone mineral density, increased lean mass, reduced fat mass, and accelerated wound healing with prolonged administration.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Bacteriostatic water recommended. Protect from light.`,
    specs: [["Molecular Formula", "C₃₈H₄₉N₉O₅"], ["Molecular Weight", "711.9 Da"], ["Target", "GHS-R1a (selective)"], ["Cortisol Effect", "Minimal/none"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  12: {
    mechanism: `CJC-1295 without DAC is a modified GHRH analogue corresponding to the first 29 amino acids of endogenous GHRH, with tetrasubstituted amino acid modifications providing resistance to DPP-IV degradation. Its short half-life of ~30 minutes produces GHRH pulses that align with natural GH secretory architecture.`,
    pharmacology: `By stimulating GHRH receptors on pituitary somatotrophs, CJC-1295 (no DAC) augments natural GH pulses rather than producing sustained GH elevation. This pulsatile pattern is considered more physiologically relevant than continuous GH stimulation and preserves downstream IGF-1 regulation.`,
    research: `Combined with a GHRP (ipamorelin or GHRP-2), CJC-1295 no DAC produces synergistic GH release significantly greater than either compound alone — consistent with the dual hypothalamic/pituitary regulation of GH secretion.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. Use bacteriostatic water.`,
    specs: [["Type", "GHRH analogue (modified 1-29)"], ["Half-life", "~30 minutes"], ["GH Pattern", "Pulsatile (physiological)"], ["Best Combined With", "GHRP-2 or Ipamorelin"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  13: {
    mechanism: `CJC-1295 with DAC incorporates a reactive succinimide linker at lysine 33 that forms a covalent bond with serum albumin after injection. This albumin binding dramatically extends half-life from 30 minutes to approximately 6–8 days.`,
    pharmacology: `The extended half-life produces sustained GHRH receptor stimulation and continuous elevation of GH and IGF-1 for up to a week per injection. This sustained action profile is fundamentally different from pulsatile GHRH analogues, producing a baseline GH elevation model rather than discrete pulses.`,
    research: `Published research demonstrated 2–10× increases in mean GH concentrations and 1.5–3× increases in IGF-1 lasting more than 6 days post-injection in healthy adults. The depot-like action enables sustained GH axis stimulation research without daily administration.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. The DAC modification does not affect standard peptide storage conditions.`,
    specs: [["Type", "GHRH analogue + DAC technology"], ["Half-life", "~6–8 days"], ["GH Pattern", "Sustained elevation"], ["Dosing Frequency", "Once or twice weekly"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  14: {
    mechanism: `GHRP-2 is a synthetic hexapeptide and potent ghrelin receptor (GHS-R1a) agonist. It stimulates GH release through both direct pituitary action and by amplifying endogenous GHRH signaling. GHRP-2 also modestly activates ACTH and cortisol pathways.`,
    pharmacology: `GHRP-2 produces some of the strongest acute GH pulses among GHRP compounds. At the pituitary level, it directly triggers GH granule exocytosis via phospholipase C/IP3 signaling. At the hypothalamic level, it suppresses somatostatin release, removing the primary inhibitory brake on GH secretion.`,
    research: `Research characterizes GHRP-2 as the most potent GH-stimulating GHRP in terms of peak GH release. Studies document GH peaks 5–10× above baseline. Body composition research shows significant improvements in lean mass and reductions in fat mass with prolonged administration.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Bacteriostatic water recommended.`,
    specs: [["Molecular Formula", "C₄₅H₅₅N₉O₆"], ["Molecular Weight", "817.9 Da"], ["Target", "GHS-R1a"], ["ACTH Effect", "Modest elevation"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  15: {
    mechanism: `GHRP-6 is one of the original synthetic hexapeptide GH secretagogues, functioning as a ghrelin receptor agonist. It produces strong GH release and is notable for its significant appetite-stimulating effects — a direct consequence of ghrelin receptor activation in the hypothalamus.`,
    pharmacology: `GHRP-6 ghrelin receptor agonism in the hypothalamus strongly activates NPY/AgRP hunger neurons, producing marked increases in appetite. GHRP-6 also modestly elevates cortisol and prolactin compared to ipamorelin. This profile has made it a key tool for studying the orexigenic arm of the ghrelin system.`,
    research: `GHRP-6 was among the first GH secretagogues in clinical research, with data spanning 30+ years. Studies established dose-response relationships for GH stimulation, characterized appetite effects, and demonstrated cardiac protection in ischemia models via a GH-independent mechanism.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Protect from light.`,
    specs: [["Molecular Formula", "C₄₆H₅₆N₁₂O₆"], ["Molecular Weight", "873.0 Da"], ["Target", "GHS-R1a"], ["Notable Effect", "Significant appetite stimulation"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  16: {
    mechanism: `Hexarelin is a potent synthetic hexapeptide GHRP that produces the highest acute GH release of all GHRPs through ghrelin receptor agonism. Uniquely, hexarelin also binds CD36 scavenger receptor and demonstrates cardioprotective effects independent of GH secretion.`,
    pharmacology: `The cardioprotective properties are mediated through CD36 binding on cardiomyocytes, activating survival signaling that protects against ischemia-reperfusion injury. This mechanism operates independently of GH secretion and represents a distinct research application beyond the GH axis.`,
    research: `Studies consistently demonstrate hexarelin as the most potent GHRP for acute GH stimulation, though desensitization occurs more rapidly than with ipamorelin. Cardiac research shows significant reduction in infarct size in animal ischemia models, preserved ejection fraction, and cardioprotective gene expression changes.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. Hexarelin's potency requires careful dose preparation. Bacteriostatic water recommended.`,
    specs: [["Molecular Formula", "C₅₀H₆₉N₁₃O₁₂"], ["Molecular Weight", "1041.2 Da"], ["GH Potency", "Highest among GHRPs"], ["Unique Target", "CD36 (cardiac)"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  17: {
    mechanism: `Sermorelin is a synthetic analogue of the first 29 amino acids of endogenous GHRH — the minimal active fragment required for full GHRH receptor activity. It stimulates pituitary somatotrophs through natural hypothalamic pathways rather than bypassing them.`,
    pharmacology: `Unlike GHRPs that activate ghrelin receptors, sermorelin acts specifically on GHRH receptors on pituitary somatotrophs. This selectivity preserves the hypothalamic-pituitary feedback loop — the pituitary's own regulatory mechanisms remain active, providing a self-limiting safety mechanism absent in direct GH administration.`,
    research: `One of the most clinically studied GHRH analogues with published data spanning 20+ years. Studies show consistent GH and IGF-1 elevation, improvements in sleep quality and sleep-associated GH secretion, and body composition benefits in GH-deficient adult research subjects.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Bacteriostatic water is the standard diluent.`,
    specs: [["Type", "GHRH analogue (1-29 fragment)"], ["Molecular Weight", "3357.9 Da"], ["Target", "GHRH receptor (pituitary)"], ["Half-life", "~11 minutes"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  19: {
    mechanism: `Tesamorelin is a GHRH analogue with a trans-3-hexenoic acid group conjugated to its N-terminus, protecting it against DPP-IV cleavage and extending half-life to approximately 26 minutes (vs ~7 minutes for native GHRH). This preserves full GHRH receptor activity.`,
    pharmacology: `Tesamorelin selectively activates pituitary GHRH receptors, producing pulsatile GH release that maintains physiological feedback loops. Research has focused specifically on its ability to reduce visceral adiposity — a metabolic effect of GH axis stimulation.`,
    research: `FDA approval for HIV-related lipodystrophy was based on Phase 3 trials showing 15–18% reduction in visceral adipose tissue. Research in HIV-negative subjects showed similar significant reductions. IGF-1 levels increased 60–70% over treatment periods.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Bacteriostatic water recommended.`,
    specs: [["Type", "GHRH analogue (modified N-terminus)"], ["Molecular Weight", "3357.9 Da"], ["Half-life", "~26 minutes"], ["Primary Research", "Visceral fat reduction"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  20: {
    mechanism: `IGF-1 LR3 contains a 13-amino acid N-terminal extension and an arginine substitution at position 3 that together reduce binding to IGF-binding proteins (IGFBPs) by ~1000-fold. This dramatically increases free, bioactive IGF-1 available to activate IGF-1 receptors.`,
    pharmacology: `Reduced IGFBP binding extends the half-life from ~10 minutes (native IGF-1) to ~20–30 hours. IGF-1 receptor activation triggers PI3K/Akt and MAPK/ERK cascades promoting cell proliferation, survival, protein synthesis, and glucose uptake. LR3's sustained receptor occupancy makes it a powerful tool for anabolic signaling research.`,
    research: `Muscle cell studies demonstrate enhanced protein synthesis, satellite cell activation, and myofibrillar hypertrophy vs native IGF-1. Animal studies document significant increases in lean mass and improved regeneration after injury. LR3 is a key tool for studying unbound IGF-1 biology.`,
    storage: `Store lyophilized at -20°C. Reconstitute with 1% acetic acid (not bacteriostatic water) for optimal solubility. Reconstituted solution stable 28 days at 2–8°C.`,
    specs: [["Type", "IGF-1 analogue (N-terminal extended)"], ["Molecular Weight", "~9117 Da"], ["Half-life", "~20–30 hours"], ["IGFBP Binding", "~1000× reduced vs native IGF-1"], ["Reconstitution", "1% acetic acid"], ["Purity", "≥98% (HPLC)"]],
  },
  21: {
    mechanism: `Follistatin 344 (FST-344) is a glycoprotein that functions as a potent antagonist of myostatin (GDF-8), activin A, activin B, and other TGF-β superfamily ligands. By sequestering and neutralizing myostatin, it removes the primary negative regulator of skeletal muscle mass.`,
    pharmacology: `Myostatin is produced by muscle cells and acts as a powerful inhibitor of muscle growth via Smad2/3 signaling. FST-344's high-affinity binding to myostatin and other activins blocks this inhibitory signaling, allowing muscle satellite cell activation and hypertrophy signaling to proceed unopposed.`,
    research: `Animal studies demonstrate dramatic increases in muscle mass — myostatin knockout mice develop double-muscled phenotypes, and follistatin overexpression in mice produces 200–300% increases in muscle mass. Primate studies using AAV-delivered follistatin showed sustained muscle mass increases. Research focuses on muscular dystrophy and sarcopenia models.`,
    storage: `Store lyophilized at -20°C. Reconstitute with bacteriostatic water. Stable 14 days at 2–8°C. Follistatin is a glycoprotein — handle gently and avoid vigorous agitation.`,
    specs: [["Type", "Glycoprotein / TGF-β antagonist"], ["Molecular Weight", "~35,000 Da"], ["Primary Target", "Myostatin (GDF-8)"], ["Also Inhibits", "Activin A, Activin B"], ["Storage", "-20°C lyophilized"], ["Purity", "≥95% (HPLC)"]],
  },
  22: {
    mechanism: `BPC-157 is a synthetic pentadecapeptide (Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val) derived from a gastric juice protein. It activates FAK-paxillin signaling, upregulates growth factors (EGF, VEGF, TGF-β), and modulates the NO system — promoting cell migration and angiogenesis.`,
    pharmacology: `Tissue repair mechanisms include accelerated fibroblast migration via focal adhesion kinase activation, upregulation of VEGF for neovascularization, modulation of dopaminergic and serotonergic systems, and interaction with the NO synthase pathway. Its oral bioavailability is remarkable among peptides, suggesting multiple absorption mechanisms.`,
    research: `Over 200 published preclinical studies document healing of tendon, ligament, muscle, GI tract, bone, and neural tissue. Key findings: complete Achilles tendon healing in 14 days vs 28+ days control, protection against NSAID-induced GI damage, acceleration of bowel anastomosis healing, and neuroprotection in TBI models. No LD50 established.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 30 days at 2–8°C. BPC-157 is relatively stable. Bacteriostatic water recommended.`,
    specs: [["Molecular Formula", "C₆₂H₉₈N₁₆O₂₂"], ["Molecular Weight", "1419.5 Da"], ["Sequence", "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val"], ["Studies Published", "200+"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  23: {
    mechanism: `TB-500 is the synthetic analogue of Thymosin Beta-4's central actin-binding domain. Its core mechanism involves G-actin sequestration — binding monomeric actin to regulate actin filament dynamics. This controls cell motility, shape, and cytoskeletal changes required for migration and tissue repair.`,
    pharmacology: `TB-500 activates endothelial progenitor cells and stem cells, reduces NF-κB-mediated inflammation, improves keratinocyte migration for wound closure, and promotes stem cell recruitment to injury sites. Its systemic distribution enables whole-body recovery research vs locally-acting growth factors.`,
    research: `Key research areas: cardiac regeneration post-MI (cardiomyocyte recruitment and vascular regrowth), skeletal muscle repair (accelerated recovery from crush injury), tendon healing (improved collagen organization and tensile strength), corneal wound healing, and spinal cord repair. TB-500 appears to activate dormant stem cells and recruit them to injury sites.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Dissolve slowly with gentle agitation — vigorous shaking can degrade the peptide. Bacteriostatic water recommended.`,
    specs: [["Molecular Formula", "C₂₁₂H₃₅₀N₅₆O₇₈S"], ["Molecular Weight", "4963.5 Da"], ["Active Region", "Central Thymosin β4 fragment"], ["Primary Target", "G-actin (actin sequestration)"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  24: {
    mechanism: `The BPC-157 + TB-500 blend combines two complementary tissue repair peptides. BPC-157 provides local angiogenic, tendon, and GI repair via FAK-paxillin and VEGF pathways, while TB-500 provides systemic stem cell mobilization and anti-inflammatory effects via actin regulation and NF-κB modulation.`,
    pharmacology: `The combination addresses tissue repair from two directions: BPC-157 recruits growth factors and promotes neovascularization at the injury site, while TB-500 mobilizes circulating progenitor cells and reduces systemic inflammatory burden. Their receptor systems and downstream pathways are distinct, producing additive effects.`,
    research: `Individual published research for both components is extensive. Combined use research is primarily practitioner-reported, with the rationale supported by their mechanistic complementarity. Animal models suggest the combination produces faster and more complete recovery than either compound alone.`,
    storage: `Store lyophilized blend at -20°C. Reconstitute with bacteriostatic water. Stable 21 days at 2–8°C. Both peptides are compatible in solution.`,
    specs: [["Components", "BPC-157 + TB-500"], ["Mechanism A", "FAK-paxillin / VEGF (BPC-157)"], ["Mechanism B", "Actin regulation / stem cell mobilization (TB-500)"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"], ["Application", "Multi-tissue repair research"]],
  },
  25: {
    mechanism: `GLOW blends BPC-157, GHK-Cu, and TB-500 into a single recovery formulation. BPC-157 drives angiogenesis and local tissue repair; GHK-Cu promotes collagen synthesis and antioxidant activity via copper-mediated enzyme activation; TB-500 mobilizes stem cells and reduces inflammation.`,
    pharmacology: `GHK-Cu (glycine-histidine-lysine-copper) activates over 4,000 human genes related to tissue repair, increases collagen and elastin synthesis, and reduces inflammatory cytokines. Combined with BPC-157's angiogenic effects and TB-500's stem cell signaling, GLOW addresses wound healing, collagen remodeling, angiogenesis, anti-inflammation, and stem cell recruitment in parallel.`,
    research: `Each component has extensive independent published research. The triple combination is relevant for complex tissue repair research where single-pathway interventions have shown limitations.`,
    storage: `Store lyophilized blend at -20°C. Reconstitute with bacteriostatic water. Stable 21 days at 2–8°C. The three peptides are stable together in solution.`,
    specs: [["BPC-157", "10mg per vial"], ["GHK-Cu", "50mg per vial"], ["TB-500", "10mg per vial"], ["Mechanisms", "3 distinct repair pathways"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  26: {
    mechanism: `KPV (Lys-Pro-Val) is a C-terminal tripeptide of alpha-melanocyte-stimulating hormone (α-MSH). It retains the anti-inflammatory properties of full α-MSH but lacks melanocortin receptor-mediated pigmentation effects, making it highly selective for inflammatory pathway modulation.`,
    pharmacology: `KPV exerts anti-inflammatory effects by inhibiting NF-κB nuclear translocation, reducing pro-inflammatory cytokine production (IL-1β, IL-6, TNF-α), and modulating intestinal epithelial barrier function. Its ability to penetrate intestinal epithelium and act directly on submucosal immune cells makes it particularly relevant for GI inflammation research.`,
    research: `Research in IBD models demonstrates dose-dependent reduction in macroscopic and histological colitis severity. DSS-induced and TNBS-induced colitis models show KPV reduces mucosal damage, decreases inflammatory markers, and preserves epithelial integrity.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. KPV is a small, stable tripeptide with good thermal stability.`,
    specs: [["Sequence", "Lys-Pro-Val"], ["Origin", "C-terminal α-MSH fragment"], ["Primary Target", "NF-κB / intestinal inflammation"], ["Molecular Weight", "~340 Da"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  27: {
    mechanism: `LL-37 is a 37-amino acid human cathelicidin antimicrobial peptide (AMP). Its amphipathic helical structure enables insertion into microbial membranes, disrupting their integrity. Beyond antimicrobial activity, LL-37 modulates host immune responses through Toll-like receptor (TLR) interaction.`,
    pharmacology: `LL-37 acts as a direct antimicrobial agent, an immune modulator, and an angiogenesis promoter simultaneously. It activates FPR2 on immune cells, promotes VEGF and FGF-2 expression for wound-associated angiogenesis, stimulates keratinocyte migration, and modulates TLR-mediated innate immune activation.`,
    research: `Research areas include wound healing (accelerated closure and neovascularization), infection resistance (broad-spectrum activity against bacteria, fungi, and some viruses), anti-biofilm activity against resistant pathogens, and cancer research (pro-apoptotic effects in some cancer cell lines).`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. LL-37's amphipathic properties can cause aggregation — use non-stick tubes and minimize adsorption to container surfaces.`,
    specs: [["Type", "Cathelicidin AMP (human)"], ["Molecular Weight", "4493.3 Da"], ["Targets", "Bacterial membranes, FPR2, TLRs"], ["Half-life", "Rapidly cleared in vivo"], ["Storage", "-20°C lyophilized"], ["Purity", "≥95% (HPLC)"]],
  },
  28: {
    mechanism: `GHK-Cu is a tripeptide (glycine-histidine-lysine) with high affinity for copper (II) ions. The GHK-Cu complex activates over 4,000 human genes through copper-mediated enzyme activation, transcription factor modulation, and direct receptor interactions. It naturally occurs in plasma, saliva, and urine at declining levels with age.`,
    pharmacology: `GHK-Cu activates superoxide dismutase, increases collagen, elastin, and glycosaminoglycan synthesis, promotes wound contraction via fibroblast activation, stimulates nerve outgrowth, suppresses IL-6 and TNF-α, and promotes hair follicle enlargement and anagen phase extension.`,
    research: `Research documents wound healing acceleration (complete closure 33% faster in wound models), hair follicle stimulation (significant increases in follicle size and hair shaft diameter), anti-aging effects on skin (reduced wrinkle depth, increased skin density), and neuroprotective effects. GHK-Cu is one of the most studied regenerative tripeptides.`,
    storage: `Store lyophilized at -20°C or as copper complex solution at 2–8°C. Stable 60+ days at 2–8°C in solution. Protect from light.`,
    specs: [["Sequence", "Gly-His-Lys (copper complex)"], ["Molecular Weight", "340.4 Da"], ["Genes Regulated", "4,000+ documented"], ["Natural Source", "Human plasma, saliva, urine"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  29: {
    mechanism: `Thymosin Alpha-1 (Tα1) is a 28-amino acid N-terminally acetylated peptide derived from prothymosin alpha. It acts primarily through TLR-2 and TLR-9 signaling pathways to activate dendritic cells, T lymphocytes (CD4+ and CD8+), and natural killer cells.`,
    pharmacology: `Tα1 promotes differentiation of T-cell precursors into mature T cells, enhances cytokine production (IFN-γ, IL-2, IL-10), activates dendritic cell maturation, and increases MHC class I expression on tumor cells. These effects make it relevant for immune deficiency research, viral infection models, and cancer immunotherapy support.`,
    research: `Tα1 is approved for clinical use in multiple countries. Research documents efficacy in chronic hepatitis B and C (immune restoration), malignant melanoma (immune adjuvant), DiGeorge syndrome (T-cell reconstitution), and COVID-19 severity reduction in clinical studies. The compound has been in clinical use for 40+ years.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Tα1 is relatively stable due to N-terminal acetylation. Bacteriostatic water recommended.`,
    specs: [["Molecular Formula", "C₁₂₉H₂₁₅N₃₃O₅₅"], ["Molecular Weight", "3108.4 Da"], ["Primary Targets", "TLR-2, TLR-9, T cells, DCs"], ["N-terminal", "Acetylated"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  31: {
    mechanism: `SS-31 (Elamipretide) is a tetrapeptide (D-Arg-2,6-Dmt-Lys-Phe-NH2) that selectively concentrates 1000–5000× in the inner mitochondrial membrane (IMM) by electrostatic interaction with cardiolipin. This cardiolipin binding stabilizes IMM architecture and preserves electron transport chain complex activity.`,
    pharmacology: `Cardiolipin is a unique phospholipid essential for cristae curvature, respiratory complex organization, and ATP synthase efficiency. Oxidative stress causes cardiolipin peroxidation and IMM disruption. SS-31 prevents this by acting as a cardiolipin-protective antioxidant and structural stabilizer, preserving ATP production.`,
    research: `Published research encompasses heart failure (preserved ejection fraction and reduced cardiac fibrosis), ischemia-reperfusion injury (reduced infarct size and preserved mitochondrial function), chronic kidney disease (reduced proteinuria and nephron preservation), and aging models (improved exercise capacity, muscle mitochondrial function). Multiple Phase 2 clinical trials completed.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. The dimethyltyrosine modification confers peptidase resistance.`,
    specs: [["Sequence", "D-Arg-2,6-Dmt-Lys-Phe-NH₂"], ["Molecular Weight", "639.8 Da"], ["Target", "Cardiolipin (inner mitochondrial membrane)"], ["Concentration", "1000–5000× enrichment in IMM"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  32: {
    mechanism: `VIP (Vasoactive Intestinal Peptide) is a 28-amino acid neuropeptide signaling through VPAC1 and VPAC2 receptors coupled to adenylyl cyclase/cAMP pathways. It is one of the most pleiotropic neuropeptides known, with expression in the nervous system, gut, lung, and immune cells.`,
    pharmacology: `VPAC1/2 receptor activation produces: smooth muscle relaxation (bronchodilation, vasodilation), anti-inflammatory cytokine shifts (IL-10↑, TNF-α↓), T regulatory cell induction, neuroprotection via BDNF upregulation, gut motility regulation, and circadian rhythm modulation via suprachiasmatic nucleus expression.`,
    research: `Clinical research encompasses pulmonary arterial hypertension (inhaled VIP reduced pulmonary vascular resistance), rheumatoid arthritis (reduced joint inflammation in animal models), IBD (mucosal protection and T-reg induction), PTSD and anxiety models (VIP modulates stress response circuitry), and COVID-19 ARDS (anti-inflammatory pulmonary effects).`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. VIP is sensitive to oxidation — minimize air exposure.`,
    specs: [["Molecular Formula", "C₁₄₇H₂₄₅N₄₃O₄₃S"], ["Molecular Weight", "3326.8 Da"], ["Receptors", "VPAC1, VPAC2"], ["Half-life", "~1 minute (in vivo)"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  33: {
    mechanism: `Epitalon (Ala-Glu-Asp-Gly) is a synthetic tetrapeptide analogue of Epithalamin from the pineal gland. It activates telomerase (hTERT gene expression) in somatic cells — a finding with significant implications for cellular aging research, as telomere shortening is a primary molecular clock of cellular senescence.`,
    pharmacology: `Beyond telomerase activation, Epitalon increases melatonin production by the pineal gland, normalizes circadian rhythm disruption, exhibits antioxidant activity via superoxide dismutase activation, and modulates the hypothalamic-pituitary axis. Its ability to activate telomerase in differentiated somatic cells (normally unable to maintain telomere length) is its most studied and distinctive property.`,
    research: `Russian research programs spanning 30+ years document: telomere lengthening in somatic cells in vitro, extended lifespan in senescence-accelerated mouse models, normalization of circadian melatonin patterns in elderly subjects, reduction in cancer incidence in aged animal models, and improved cognitive and immune function markers in elderly human subjects.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Protect from light. Bacteriostatic water recommended.`,
    specs: [["Sequence", "Ala-Glu-Asp-Gly"], ["Molecular Weight", "390.3 Da"], ["Key Action", "Telomerase (hTERT) activation"], ["Origin", "Pineal gland extract analogue"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  34: {
    mechanism: `NAD+ (nicotinamide adenine dinucleotide) is an essential coenzyme in all living cells that functions as a hydride (H⁻) acceptor in oxidation-reduction reactions. It is the central electron carrier in mitochondrial oxidative phosphorylation, shuttling electrons through complexes I and III of the electron transport chain.`,
    pharmacology: `Beyond energy metabolism, NAD+ is consumed by sirtuins (SIRT1–7, deacetylases regulating stress response and longevity), PARP enzymes (DNA repair), CD38 (cADPR signaling), and NAMPT. Each NAD+-consuming enzyme competes for the same pool, making NAD+ levels a master regulator of cellular stress responses, metabolism, and longevity signaling.`,
    research: `Clinical and preclinical research documents: 50% decline in NAD+ levels between age 40–80; reversal of age-associated metabolic and mitochondrial decline with NAD+ repletion; improved cognitive function in aging models; enhanced DNA repair capacity; cardioprotection in ischemia models. IV NAD+ administration studies show rapid intracellular repletion.`,
    storage: `Store lyophilized at -20°C protected from moisture. NAD+ is hygroscopic — humidity causes rapid degradation. Reconstituted solution should be used within 24 hours. Do not freeze-thaw reconstituted solution.`,
    specs: [["Molecular Formula", "C₂₁H₂₇N₇O₁₄P₂"], ["Molecular Weight", "663.4 Da"], ["Function", "Redox coenzyme + sirtuin/PARP substrate"], ["Decline with Age", "~50% by age 80"], ["Storage", "-20°C (moisture-protected)"], ["Purity", "≥99% (HPLC)"]],
  },
  37: {
    mechanism: `Humanin is a 21-amino acid peptide encoded within the 16S ribosomal RNA gene of mitochondrial DNA. It signals through a trimeric receptor complex (CNTFR-α/WSX-1/gp130) and activates STAT3 and PI3K/Akt survival pathways.`,
    pharmacology: `Humanin protects neurons against Aβ-induced and oxidative stress-induced apoptosis, reduces cardiomyocyte death from ischemic stress, protects against chemotherapy-induced gonadal toxicity, and improves insulin sensitivity. Its receptor complex is shared with CNTF, IL-27, and other cytokines.`,
    research: `Research documents: neuroprotection against Alzheimer's-related Aβ toxicity (100% protection in some cell models), 30–40% reduction in atherosclerotic plaque in ApoE-/- mice, protection against cisplatin-induced gonadal damage, improved insulin sensitivity in diabetic models, and circulating humanin levels inversely correlating with cardiovascular disease risk.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. Bacteriostatic water recommended.`,
    specs: [["Type", "Mitochondria-encoded peptide (MDP)"], ["Molecular Weight", "~2500 Da"], ["Receptor", "CNTFR-α/WSX-1/gp130 complex"], ["Signaling", "STAT3, PI3K/Akt"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  38: {
    mechanism: `MOTS-c is a 16-amino acid peptide encoded within the 12S rRNA gene of mitochondrial DNA. It activates AMPK by inhibiting the folate cycle and one-carbon metabolism, increasing AMP:ATP ratios and triggering cellular energy-sensing pathways.`,
    pharmacology: `AMPK activation promotes glucose uptake, fatty acid oxidation, and mitochondrial biogenesis while suppressing gluconeogenesis and lipid synthesis. MOTS-c also translocates to the nucleus in response to exercise or metabolic stress, regulating nuclear gene expression related to metabolism — acting as a mitochondrial-to-nuclear retrograde signal.`,
    research: `Mouse studies demonstrate: reversal of age- and diet-induced insulin resistance, 31% increase in running capacity, protection against obesity on high-fat diet, and extended lifespan in aged mice. Human studies show exercise increases circulating MOTS-c levels, and young adults have higher MOTS-c than elderly subjects.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. Bacteriostatic water for reconstitution.`,
    specs: [["Type", "Mitochondria-derived peptide (MDP)"], ["Molecular Weight", "~2174 Da"], ["Primary Target", "AMPK (via folate cycle inhibition)"], ["Nuclear Role", "Metabolic gene regulation"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  41: {
    mechanism: `Thymalin is a polypeptide extract from thymic tissue containing multiple bioactive peptides that collectively restore thymic function. It acts on T-cell precursors in bone marrow, the thymic microenvironment, and peripheral T-cell populations to restore age-associated immune decline.`,
    pharmacology: `Thymalin promotes thymocyte differentiation into mature T cells, restores Th1/Th2 cytokine balance, increases NK cell activity, enhances macrophage phagocytic activity, and normalizes IL-2 and IFN-γ production.`,
    research: `A 25-year Russian longitudinal study using thymalin in elderly subjects (60–74 year olds) demonstrated 50% reduction in mortality over 6 years compared to untreated controls. Additional research documents restoration of T-cell counts, improved vaccine responsiveness in immunosenescent subjects, and enhanced anti-tumor immunity in cancer models.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. Bacteriostatic water recommended.`,
    specs: [["Type", "Thymic polypeptide extract"], ["Components", "Multiple thymic peptides"], ["Primary Target", "T-cell differentiation and function"], ["Key Study", "25-year longitudinal data"], ["Storage", "-20°C lyophilized"], ["Purity", "≥95% (HPLC)"]],
  },
  42: {
    mechanism: `Semax is a heptapeptide (Met-Glu-His-Phe-Pro-Gly-Pro) analogue of ACTH(4-7) with C-terminal Pro-Gly-Pro extension. Its primary mechanism involves upregulation of BDNF (Brain-Derived Neurotrophic Factor) and its TrkB receptor, promoting neuroplasticity and neuronal survival.`,
    pharmacology: `Semax activates melanocortin receptors, modulates dopaminergic and serotonergic neurotransmission in the hippocampus and prefrontal cortex, reduces neuroinflammatory markers (IL-1β, IL-6), increases VEGF for cerebrovascular support, and promotes BDNF/TrkB-mediated synaptic strengthening. Intranasal administration delivers it to the CNS via olfactory pathways.`,
    research: `25+ years of Russian and Ukrainian clinical research documents: significant cognitive enhancement in healthy subjects, accelerated stroke recovery (registered pharmaceutical in Russia), neuroprotection in ischemia models, improvement in attention disorders, and anxiolytic effects without sedation.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution sensitive to temperature — stable 2–4 weeks at 2–8°C. Protect from light.`,
    specs: [["Sequence", "Met-Glu-His-Phe-Pro-Gly-Pro"], ["Molecular Weight", "887.0 Da"], ["Primary Target", "BDNF upregulation"], ["Route", "Injectable or intranasal"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  43: {
    mechanism: `Selank is a synthetic heptapeptide analogue of the human immune peptide tuftsin (Thr-Lys-Pro-Arg), extended with Gly-Gln-Pro for stability. It modulates GABA-A receptor function, increases BDNF expression, and regulates serotonin and dopamine metabolism in key brain regions.`,
    pharmacology: `Unlike classical benzodiazepines, Selank's anxiolytic effects occur without sedation, muscle relaxation, or dependency through a GABA-A modulatory mechanism distinct from benzodiazepine binding sites. It also increases BDNF expression promoting neuroplasticity and has documented immunomodulatory effects through tuftsin-like receptor interactions.`,
    research: `Published Russian research documents: significant anxiolytic effects equivalent to benzodiazepines in anxiety models without sedation or tolerance development; nootropic effects including improved memory consolidation and attention; immune modulation with increased phagocytic activity; and antiviral properties in influenza and herpes models.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Protect from light.`,
    specs: [["Sequence", "Thr-Lys-Pro-Arg-Pro-Gly-Pro"], ["Origin", "Tuftsin analogue (extended)"], ["Primary Mechanism", "GABA-A modulation / BDNF"], ["Anxiolytic Profile", "No sedation or tolerance"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  44: {
    mechanism: `Dihexa (N-hexanoic-Tyr-Ile-6-aminohexanoic amide) is derived from angiotensin IV and functions as a high-affinity ligand for hepatocyte growth factor receptor (HGFR/c-Met). HGF/c-Met signaling promotes synaptogenesis — the formation of new synaptic connections between neurons.`,
    pharmacology: `HGFR activation triggers downstream signaling cascades that promote dendritic spine formation, presynaptic bouton development, and stabilization of new synaptic connections. Published research suggests Dihexa is 10⁷ times more potent than BDNF in promoting synapse formation in cell models — extraordinary potency that drives intense scientific interest.`,
    research: `Preclinical research demonstrates: reversal of scopolamine-induced cognitive deficits, improvement in spatial learning in aged rats (equivalent to young-adult performance), protection against neurodegeneration in Parkinson's models, and enhanced social cognition. Primary research focus is cognitive rescue.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. Can also be formulated for transdermal delivery research. Bacteriostatic water for parenteral reconstitution.`,
    specs: [["Type", "Angiotensin IV derivative"], ["Target", "HGFR (c-Met)"], ["Potency", "~10⁷× more potent than BDNF (synaptogenesis)"], ["Primary Effect", "Synapse formation"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  45: {
    mechanism: `Cerebrolysin is a mixture of low-molecular-weight peptides and free amino acids derived from purified porcine brain proteins. Its neurotrophic activity is attributed to peptide fragments that mimic the effects of endogenous neurotrophins (BDNF, NGF, GDNF) through overlapping receptor pathways.`,
    pharmacology: `Cerebrolysin produces multiple parallel neurotrophic effects: protection against glutamate excitotoxicity, reduction of amyloid precursor protein processing toward neurotoxic fragments, anti-apoptotic signaling in neurons, enhancement of synaptic plasticity, and promotion of neuronal sprouting and axonal regrowth after injury.`,
    research: `Extensive research across stroke recovery, Alzheimer's disease, TBI, and vascular dementia. Meta-analyses of stroke trials demonstrate significant improvements in functional outcomes. Alzheimer's trials show stabilization of cognitive decline. TBI studies document accelerated neurological recovery. Cerebrolysin has been in clinical use in Europe and Asia for 50+ years.`,
    storage: `Store unopened vials at room temperature (15–25°C). Once opened, use immediately or refrigerate at 2–8°C for up to 24 hours. Cerebrolysin is supplied as aqueous solution — do not freeze.`,
    specs: [["Type", "Neuropeptide mixture (porcine brain)"], ["Molecular Weight", "<10,000 Da (peptide fragments)"], ["Key Effects", "Neurotrophic, neuroprotective, neuroplasticity"], ["Clinical Use", "50+ years (EU/Asia)"], ["Storage", "Room temp (unopened)"], ["Purity", "Standardized by bioassay"]],
  },
  50: {
    mechanism: `DSIP (Delta Sleep-Inducing Peptide) is a nonapeptide (Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu) originally isolated from rabbit thalamic venous blood during sleep. It appears to act on multiple systems including the serotonin/melatonin axis, opioid receptors, GABA receptors, and hypothalamic releasing hormones.`,
    pharmacology: `DSIP promotes slow-wave (delta) sleep architecture, reduces stress-induced cortisol hypersecretion, modulates GH pulsatility, reduces pain sensitivity through opioidergic mechanisms, and reduces oxidative stress. Its effects on multiple sleep regulatory systems suggest it acts as an endogenous sleep-promoting regulator.`,
    research: `Research examines DSIP in insomnia treatment (improved sleep onset and slow-wave sleep percentage), stress-induced hypercorticism (normalized cortisol patterns), alcohol and opiate withdrawal (reduced severity), chronic pain models (reduced sensitivity), and epilepsy (anti-seizure effects in animal models).`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. DSIP is sensitive to oxidation — minimize air exposure.`,
    specs: [["Sequence", "Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu"], ["Molecular Weight", "848.9 Da"], ["Primary Effect", "Slow-wave sleep promotion"], ["Also Modulates", "GH, cortisol, pain pathways"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  51: {
    mechanism: `Adamax is a peptide incorporating an adamantane moiety attached to a tripeptide backbone. The adamantane group (a polycyclic hydrocarbon cage) dramatically improves lipophilicity and blood-brain barrier penetration, while the tripeptide core provides biological activity.`,
    pharmacology: `The adamantane modification increases membrane permeability and slows enzymatic degradation. Research suggests Adamax enhances BDNF signaling, modulates NMDA receptor activity (similar to neuroprotective effects of adamantane drugs like memantine), and promotes neuronal survival under oxidative stress conditions.`,
    research: `Research shows superior BBB penetration vs unmodified reference peptides, neuroprotection in excitotoxicity models, and cognitive enhancement in scopolamine-induced impairment models. The adamantane chemistry represents a promising approach to improving CNS bioavailability of peptide therapeutics.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. The adamantane modification improves stability vs standard peptides.`,
    specs: [["Type", "Adamantane-modified neuropeptide"], ["BBB Advantage", "Enhanced by adamantane lipophilicity"], ["Molecular Weight", "~500–800 Da (est.)"], ["Primary Effects", "Neuroprotection, cognitive enhancement"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  52: {
    mechanism: `PE-22-28 is a synthetic hexapeptide fragment of spadin, derived from the propeptide of TREK-1 (TWIK-related potassium channel-1). It acts as an antagonist/modulator of the TREK-1 potassium channel — a mechanosensitive, thermosensitive background K⁺ channel expressed in hippocampal neurons.`,
    pharmacology: `TREK-1 channel blockade depolarizes neurons and enhances serotonergic neurotransmission by preventing the hyperpolarizing effect that reduces serotonin neuron firing. This mechanism is distinct from SSRIs (which block serotonin reuptake) and produces rapid antidepressant effects in animal models — with onset within hours rather than weeks.`,
    research: `PE-22-28 demonstrates antidepressant effects in forced swim test and tail suspension test within 4–24 hours of administration. Research shows activation of hippocampal neurogenesis, normalization of BDNF expression, and no anxiogenic effects. The rapid onset mechanism positions it as a subject of intense pharmacological research.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. Bacteriostatic water for reconstitution.`,
    specs: [["Origin", "Spadin fragment / TREK-1 modulator"], ["Target", "TREK-1 potassium channel"], ["Onset", "Hours (vs weeks for SSRIs)"], ["Neurogenesis", "Promotes hippocampal neurogenesis"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  53: {
    mechanism: `AOD9604 is a modified fragment of human growth hormone corresponding to residues 176–191, with a tyrosine added at the N-terminus. It retains the lipolytic properties of the C-terminal GH fragment without stimulating IGF-1 or affecting glucose metabolism.`,
    pharmacology: `AOD9604 activates lipolysis in adipocytes through a GH receptor-independent mechanism. Research suggests it activates beta-3 adrenergic receptors and directly stimulates intracellular lipase activity. It does not stimulate cell proliferation or affect glucose metabolism — a clean lipolytic profile.`,
    research: `Australian clinical research documented significant fat loss vs placebo in obesity trials, with dose-dependent lipolytic effects and preserved lean mass. The safety profile showed no effects on glucose, insulin, or IGF-1 — distinguishing it from full GH. Phase 2b trials were conducted in the early 2000s with positive efficacy data.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Bacteriostatic water recommended.`,
    specs: [["Origin", "hGH fragment 176-191 (modified)"], ["Molecular Weight", "~1817 Da"], ["GH Receptor", "Does not bind (lipolytic via separate mechanism)"], ["IGF-1 Effect", "None"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  54: {
    mechanism: `HGH Fragment 176-191 is the C-terminal fragment of human growth hormone. It produces selective lipolysis by directly stimulating fat cell metabolism through a GH receptor-independent mechanism while having no effect on GH receptor-mediated growth or IGF-1 signaling.`,
    pharmacology: `The fragment's lipolytic mechanism involves activation of hormone-sensitive lipase within adipocytes, promoting release of free fatty acids. Unlike full GH, which produces both anabolic (IGF-1-mediated) and lipolytic effects, Fragment 176-191 retains only the lipolytic activity with preferential effects on adipose tissue.`,
    research: `Studies in obese mice show 50% reduction in body fat over 2 weeks with preserved lean mass. Human research demonstrates increased fat oxidation rates and lipolytic activity. The clean lipolytic profile without IGF-1 stimulation makes it a valuable tool for isolating GH's fat-burning mechanism from its growth-promoting effects.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Bacteriostatic water standard diluent.`,
    specs: [["Origin", "hGH fragment 176-191"], ["Molecular Weight", "~1817 Da"], ["Lipolytic Activity", "Preserved from GH"], ["IGF-1 Stimulation", "None"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  55: {
    mechanism: `Adipotide (FTPP) is a chimeric peptide linking a targeting moiety (CKGGRAKDC, which homes to vasculature of white adipose tissue) to a proapoptotic domain (KLAKLAKKLAKLAK). It selectively destroys blood vessels supplying white fat.`,
    pharmacology: `The homing domain binds prohibitin on endothelial cells of white adipose tissue vasculature. Once bound, the proapoptotic domain inserts into mitochondria and triggers BAX-mediated apoptosis of these endothelial cells, selectively eliminating the blood supply to white fat and causing adipocyte death through ischemia.`,
    research: `Rhesus macaque studies demonstrated 39% reduction in body weight over 4 weeks — the most dramatic pharmacological weight loss ever observed in primates. Visceral and subcutaneous fat were both targeted. The targeted apoptosis mechanism is mechanistically unlike all other weight loss approaches.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 14 days at 2–8°C. Adipotide's proapoptotic domain requires careful handling. Bacteriostatic water for reconstitution.`,
    specs: [["Type", "Chimeric targeting + proapoptotic peptide"], ["Mechanism", "Adipose vascular targeted apoptosis"], ["Primate Data", "39% body weight reduction"], ["Selectivity", "White adipose tissue vasculature"], ["Storage", "-20°C lyophilized"], ["Purity", "≥95% (HPLC)"]],
  },
  56: {
    mechanism: `5-Amino-1MQ is a small molecule inhibitor of NNMT (Nicotinamide N-Methyltransferase), an enzyme that methylates nicotinamide using SAM as the methyl donor. NNMT is highly expressed in white adipose tissue and inhibiting it raises intracellular NAD+ and SAM levels.`,
    pharmacology: `NNMT inhibition in adipocytes reduces fat cell size, promotes adipose tissue browning (conversion of white fat to metabolically active beige fat), raises NAD+ for sirtuin activation, and improves insulin sensitivity. 5-Amino-1MQ is structurally optimized for NNMT selectivity and cellular penetration.`,
    research: `Published studies in obese mouse models demonstrate: 7% body weight reduction, significant reduction in adipocyte size, upregulation of brown fat markers (UCP-1, PGC-1α), improved glucose tolerance, and elevated plasma NAD+ levels. The mechanism is distinct from all GLP-1 and GH-based approaches.`,
    storage: `Store oral capsules at room temperature (15–25°C). Protect from heat and moisture. Shelf life 18–24 months.`,
    specs: [["Type", "Small molecule NNMT inhibitor"], ["Primary Target", "NNMT (nicotinamide N-methyltransferase)"], ["Effect", "NAD+ restoration, adipose browning"], ["Form", "Oral capsule"], ["Storage", "Room temperature (cool, dry)"], ["Purity", "≥99% (HPLC)"]],
  },
  57: {
    mechanism: `SLU-PP-332 is a synthetic small molecule agonist of ERRα, ERRβ, and ERRγ (estrogen-related receptors). These nuclear receptors regulate mitochondrial biogenesis, fatty acid oxidation, and oxidative phosphorylation gene expression — processes stimulated by endurance exercise.`,
    pharmacology: `ERR agonism activates PGC-1α co-activation programs that normally require sustained aerobic exercise to trigger. This includes upregulation of mitochondrial biogenesis genes (TFAM, NRF1/2), oxidative metabolism enzymes, and slow-twitch muscle fiber genes — collectively recapitulating the molecular signature of trained endurance athletes.`,
    research: `Published animal studies demonstrate: 70% increase in treadmill running time in sedentary treated mice vs controls, increased mitochondrial number and size in muscle tissue, reduced fat mass with preserved lean mass, and improved cardiac efficiency. Actively investigated as an 'exercise mimetic' for metabolic disease, sarcopenia, and cardiac failure research.`,
    storage: `Store oral capsules at room temperature (15–25°C). Small molecule with good thermal stability. Protect from moisture and light. Shelf life 18–24 months.`,
    specs: [["Type", "ERR agonist (small molecule)"], ["Targets", "ERRα, ERRβ, ERRγ"], ["Described As", "Exercise mimetic"], ["Key Effect", "Mitochondrial biogenesis + endurance"], ["Form", "Oral capsule"], ["Purity", "≥99% (HPLC)"]],
  },
  58: {
    mechanism: `ACE-031 is a fusion protein of the extracellular domain of activin receptor type IIB (ActRIIB) and a human IgG1-Fc domain. Acting as a 'myostatin trap,' ACE-031 binds and sequesters myostatin, activin A, activin B, GDF-11, and other TGF-β family ligands that inhibit muscle growth.`,
    pharmacology: `By sequestering multiple TGF-β family inhibitory ligands, ACE-031 provides broader inhibition of muscle growth suppression than myostatin-specific antibodies. The Fc fusion enables weekly or bi-weekly dosing. Downstream effects include enhanced satellite cell activation and increased muscle protein synthesis.`,
    research: `Phase 2 clinical trials in healthy postmenopausal women showed significant increases in total lean mass (3%), thigh muscle volume (6%), and bone mineral density (4%) over 3 months. Trials in Duchenne Muscular Dystrophy are ongoing. The multi-ligand trap design makes it more potent than single-target myostatin inhibitors.`,
    storage: `Store lyophilized at -20°C. The Fc fusion is sensitive to aggregation — reconstitute gently. Reconstituted solution stable 14 days at 2–8°C.`,
    specs: [["Type", "ActRIIB-Fc fusion protein"], ["Molecular Weight", "~120,000 Da"], ["Ligands Trapped", "Myostatin, activin A/B, GDF-11"], ["Clinical Muscle Gain", "~3% lean mass (Phase 2)"], ["Storage", "-20°C lyophilized"], ["Purity", "≥95% (HPLC)"]],
  },
  59: {
    mechanism: `L-Carnitine (β-hydroxy-β-methylaminobutyric acid) is an endogenously synthesized quaternary ammonium compound essential for mitochondrial fatty acid oxidation. It facilitates transport of long-chain fatty acids across the inner mitochondrial membrane as acylcarnitine esters via the carnitine shuttle system.`,
    pharmacology: `Without L-carnitine, long-chain fatty acids cannot enter the mitochondrial matrix for beta-oxidation — making it rate-limiting for fatty acid energy metabolism. Carnitine also removes potentially toxic acyl groups from mitochondria (as acylcarnitines) and modulates the acetyl-CoA/CoA ratio and gene expression via PPARα activation.`,
    research: `Decades of clinical research document: improved exercise performance and reduced muscle damage markers, significant fat oxidation increases in aging populations, protection against doxorubicin-induced cardiotoxicity, improved sperm motility and morphology in male fertility research, and significant reduction in peripheral vascular symptoms.`,
    storage: `Store liquid solution at room temperature (15–25°C). Refrigeration optional but extends shelf life. Aqueous L-Carnitine solutions are stable for 12+ months sealed.`,
    specs: [["Molecular Formula", "C₇H₁₅NO₃"], ["Molecular Weight", "161.2 Da"], ["Function", "Mitochondrial fatty acid transporter"], ["Concentration", "5000mg/dose (liquid)"], ["Storage", "Room temperature"], ["Purity", "≥99%"]],
  },
  60: {
    mechanism: `Lipo-C is a lipotropic blend combining methionine, inositol, choline, and L-carnitine. These four compounds collectively promote hepatic fat metabolism: methionine provides methyl groups for phosphatidylcholine synthesis, inositol facilitates lipid transport, choline enables VLDL assembly, and carnitine enables mitochondrial fatty acid oxidation.`,
    pharmacology: `Lipotropic agents prevent fatty liver by promoting hepatic fat export as VLDL, reducing hepatic de novo lipogenesis, and enhancing mitochondrial fat oxidation. Choline deficiency specifically causes hepatic steatosis, underscoring its critical role. The combination addresses multiple steps in hepatic lipid metabolism simultaneously.`,
    research: `Individual component research is extensive. Combination lipotropic research has been conducted in fatty liver models, lipid metabolism studies, and clinical weight management contexts. Inositol and choline synergy for VLDL assembly has been specifically documented in hepatocyte studies.`,
    storage: `Store liquid solution at room temperature (15–25°C) in a sealed container. Refrigerate after opening for extended shelf life.`,
    specs: [["Components", "Methionine, Inositol, Choline, L-Carnitine"], ["Form", "Injectable liquid (10ml)"], ["Primary Target", "Hepatic lipid metabolism"], ["Mechanism", "Multi-pathway lipotropic"], ["Storage", "Room temperature (refrigerate after opening)"], ["Application", "Lipid metabolism research"]],
  },
  61: {
    mechanism: `MIC combines methionine, inositol, and choline (the core lipotropic triad) with vitamin B12 (cyanocobalamin). B12 adds its role as a methylation cofactor for methionine synthase, DNA synthesis support, and energy metabolism support through mitochondrial succinyl-CoA production.`,
    pharmacology: `B12 deficiency impairs methionine regeneration, leading to elevated homocysteine — a cardiovascular and neurological risk factor. The MIC combination ensures both the lipotropic pathway and the B12-dependent methylation pathway are simultaneously supported, making it relevant for both hepatic fat metabolism and homocysteine-related cardiovascular research.`,
    research: `Clinical research documents improvements in energy levels, liver enzyme normalization in fatty liver subjects, weight loss facilitation in combination with caloric restriction, and improvements in mood and cognitive function (B12-related). Widely used in medical weight management research protocols.`,
    storage: `Store at room temperature (15–25°C). Protect from light (B12 is photosensitive). Refrigerate after opening. Use within 30 days of opening.`,
    specs: [["Components", "Methionine + Inositol + Choline + Vitamin B12"], ["Form", "Injectable liquid (10ml)"], ["Addition vs Lipo-C", "Vitamin B12 (methylation support)"], ["B12 Form", "Cyanocobalamin"], ["Storage", "Room temp, protect from light"], ["Application", "Lipotropic + methylation research"]],
  },
  62: {
    mechanism: `Lemon Bottle is a riboflavin-based lipolytic formulation containing riboflavin (vitamin B2), bromelain (a proteolytic enzyme from pineapple), and L-carnitine. Riboflavin activates FAD-dependent oxidation pathways in adipocytes; bromelain provides proteolytic remodeling of adipose extracellular matrix; carnitine facilitates fatty acid oxidation.`,
    pharmacology: `The combination targets adipocyte fat breakdown through multiple mechanisms: riboflavin-dependent electron transport chain support enhancing oxidative fat metabolism, bromelain-mediated disruption of connective tissue surrounding fat cells, and L-carnitine's role in transporting fatty acids into mitochondria for oxidation.`,
    research: `Lemon Bottle is a newer formulation with research focused on aesthetic medicine applications. Published data documents rapid localized reduction in fat volume after injection in clinical observation studies. Research interest centers on the comparative mechanism vs deoxycholic acid-based lipolytic agents.`,
    storage: `Store at room temperature (15–25°C). Protect from light (riboflavin is highly photosensitive — the yellow color bleaches with light exposure). Refrigerate after opening. Use within 30 days.`,
    specs: [["Key Components", "Riboflavin (B2), Bromelain, L-Carnitine"], ["Form", "Injectable liquid (10ml)"], ["Characteristic", "Yellow color from riboflavin"], ["Mechanism", "Multi-pathway lipolytic"], ["Storage", "Room temp, protect from light"], ["Purity", "≥98%"]],
  },
  63: {
    mechanism: `AICAR (5-aminoimidazole-4-carboxamide ribonucleotide) is a cell-permeable AMPK activator. Inside cells it is phosphorylated to AICA ribonucleotide (ZMP), which mimics AMP and allosterically activates AMPK without actually depleting cellular ATP.`,
    pharmacology: `AMPK activation by AICAR triggers a comprehensive metabolic switch: increased glucose uptake (GLUT4 translocation), enhanced fatty acid oxidation (ACC phosphorylation → malonyl-CoA reduction → CPT1 disinhibition), mitochondrial biogenesis (PGC-1α upregulation), and inhibition of anabolic pathways (mTORC1 suppression, fatty acid synthesis inhibition).`,
    research: `Landmark studies established AICAR as the definitive AMPK activator for metabolic research. Published findings include: 44% increase in running endurance in mice without exercise training (Nature 2008), reversal of high-fat diet-induced insulin resistance, significant fat mass reduction with preserved lean mass, and prevention of metabolic syndrome in genetic obesity models.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Use bacteriostatic water.`,
    specs: [["Molecular Formula", "C₉H₁₄N₄O₈P"], ["Molecular Weight", "338.2 Da"], ["Target", "AMPK (via ZMP)"], ["Endurance Effect", "44% increase in mice"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  64: {
    mechanism: `ARA290 is an 11-amino acid cyclic peptide derived from the sequence of erythropoietin (EPO) that selectively activates the innate repair receptor (IRR) — a heterodimer of EPOR and β-common receptor. Unlike EPO itself, ARA290 does not stimulate EPOR homodimerization and has no erythropoietic effects.`,
    pharmacology: `IRR activation triggers tissue-protective signaling (Akt, STAT3, NF-κB) that promotes survival of stressed neurons, reduces inflammatory cytokine production, promotes peripheral nerve regeneration, and improves insulin sensitivity. The separation of tissue-protective from erythropoietic effects was a key pharmacological breakthrough.`,
    research: `Phase 2 clinical trials in small fiber neuropathy (SFN) demonstrated significant improvement in autonomic symptoms, reduction in neuropathic pain VAS scores, and increase in corneal nerve fiber density on confocal microscopy. Research also documents improvements in insulin sensitivity in type 2 diabetes and anti-inflammatory effects in inflammatory models.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. Cyclic peptide structure confers improved stability vs linear peptides.`,
    specs: [["Origin", "EPO-derived cyclic peptide"], ["Molecular Weight", "~1200 Da"], ["Receptor", "Innate Repair Receptor (IRR)"], ["EPO Activity", "None (no erythropoiesis)"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  65: {
    mechanism: `HCG (Human Chorionic Gonadotropin) is a 237-amino acid glycoprotein hormone structurally homologous to LH, sharing the same α subunit and a structurally similar β subunit. It activates the LH receptor (LHCGR) on Leydig cells in the testes and theca cells in the ovaries.`,
    pharmacology: `LHCGR activation by HCG triggers cAMP/PKA signaling in Leydig cells, stimulating steroidogenesis — the conversion of cholesterol to testosterone via the StAR protein and CYP11A1. In males, this maintains testicular testosterone production and prevents testicular atrophy during HPG axis suppression.`,
    research: `HCG is one of the most extensively studied reproductive hormones. Research applications include: HPG axis maintenance during testosterone replacement, testicular restart protocols, ovulation induction in female fertility research, Leydig cell function assessment, and differential diagnosis of hypogonadism via HCG stimulation test.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. HCG is a glycoprotein — handle gently. Bacteriostatic water recommended.`,
    specs: [["Type", "Glycoprotein hormone"], ["Molecular Weight", "~36,700 Da"], ["Receptor", "LHCGR"], ["Subunits", "α (shared with LH/FSH/TSH) + β (specific)"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99 IU/mg potency"]],
  },
  66: {
    mechanism: `HMG (Human Menopausal Gonadotropin) contains both FSH (follicle-stimulating hormone) and LH activity extracted from the urine of postmenopausal women. FSH activates FSHR on granulosa cells and Sertoli cells; LH activates LHCGR for steroidogenesis.`,
    pharmacology: `The dual FSH+LH activity provides comprehensive gonadotropin stimulation for both folliculogenesis (ovarian follicle maturation) and steroidogenesis. In male research, FSH supports spermatogenesis while LH drives testosterone production. This makes HMG more physiologically complete than either FSH or LH alone.`,
    research: `HMG has been used in reproductive medicine for 60+ years. Research applications include: ovarian stimulation for ART protocols, evaluation of gonadotropin-responsive conditions, male hypogonadism treatment, and characterization of gonadotropin receptor pharmacology.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Handle gently — gonadotropin glycoproteins are sensitive to aggregation from vigorous agitation.`,
    specs: [["Type", "Gonadotropin extract (urinary)"], ["Activity", "FSH + LH"], ["Molecular Weight", "FSH: ~30,000 Da; LH: ~28,000 Da"], ["Standard Dose", "75 IU per vial"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99 IU/mg potency"]],
  },
  67: {
    mechanism: `Gonadorelin is a synthetic decapeptide identical in sequence to endogenous GnRH (Glu-His-Trp-Ser-Tyr-Gly-Leu-Arg-Pro-Gly-NH2). It binds GnRH receptors on pituitary gonadotrophs, triggering LH and FSH release through calcium-dependent signaling and PKC activation.`,
    pharmacology: `Pulsatile gonadorelin administration (mimicking endogenous GnRH's 60–90 minute pulse frequency) maintains gonadotroph responsiveness and stimulates LH and FSH secretion. Continuous administration paradoxically suppresses gonadotroph function through receptor desensitization and downregulation.`,
    research: `Research applications include: HPG axis function assessment (GnRH stimulation test), pulsatile GnRH therapy for hypothalamic hypogonadism, differentiation of pituitary vs hypothalamic defects, and characterization of gonadotroph biology.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Bacteriostatic water recommended.`,
    specs: [["Sequence", "Glu-His-Trp-Ser-Tyr-Gly-Leu-Arg-Pro-Gly-NH₂"], ["Molecular Weight", "1182.3 Da"], ["Target", "GnRH receptor (pituitary)"], ["Pulsatile Effect", "Stimulates LH/FSH"], ["Continuous Effect", "Suppresses LH/FSH (desensitization)"], ["Purity", "≥99% (HPLC)"]],
  },
  68: {
    mechanism: `Oxytocin is a 9-amino acid nonapeptide synthesized in hypothalamic paraventricular and supraoptic nuclei. It acts through G-protein coupled oxytocin receptors (OTR) linked to Gq-PLC signaling, expressed in the brain, uterus, mammary gland, heart, kidney, and immune cells.`,
    pharmacology: `Beyond classical reproductive roles, oxytocin modulates social behavior via amygdala OTR activation (reducing fear and stress responses), promotes trust via VTA-dopamine circuit interaction, reduces food intake (hypothalamic OTR), modulates pain processing, and has cardioprotective effects via OTR on cardiomyocytes.`,
    research: `Research has expanded dramatically beyond reproductive pharmacology: social bonding enhancement in autism spectrum disorder studies, anxiolytic effects (reduced cortisol response to social stressors), trust and prosocial behavior modulation, pain reduction (opioid-independent mechanism), cardiac protection in ischemia models, and metabolic effects including reduced caloric intake.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. Oxytocin is susceptible to oxidation at the cysteine-cysteine disulfide bond — minimize air exposure.`,
    specs: [["Sequence", "Cys-Tyr-Ile-Gln-Asn-Cys-Pro-Leu-Gly-NH₂"], ["Molecular Weight", "1007.2 Da"], ["Receptor", "OTR (Gq-linked GPCR)"], ["Key Features", "Disulfide bridge (Cys1-Cys6)"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  69: {
    mechanism: `Kisspeptin-10 is the shortest biologically active form of the kisspeptin family. It activates KISS1R (GPR54), a Gq-coupled receptor on GnRH neurons in the hypothalamic arcuate and anteroventral periventricular nuclei, triggering GnRH pulse generation.`,
    pharmacology: `KISS1R/Gq activation depolarizes GnRH neurons through PLC/IP3/PKC signaling, triggering GnRH release into the hypothalamic-pituitary portal circulation. Kisspeptin is considered the 'gatekeeper' of reproductive function — integrating signals from leptin, estrogen, testosterone, and metabolic status to regulate GnRH pulsatility.`,
    research: `Kisspeptin-10 has been used in clinical research to characterize GnRH pulse dynamics, test hypothalamic gonadotroph integrity, investigate delayed puberty, and study neuroendocrine regulation of fertility. Intravenous kisspeptin-10 infusion studies precisely document GnRH-LH-FSH-testosterone pulse characteristics.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. Standard bacteriostatic water reconstitution.`,
    specs: [["Sequence", "Tyr-Asn-Trp-Asn-Ser-Phe-Gly-Leu-Arg-Phe-NH₂"], ["Molecular Weight", "1302.5 Da"], ["Receptor", "KISS1R (GPR54)"], ["Role", "GnRH pulsatility regulator"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  70: {
    mechanism: `Triptorelin is a synthetic GnRH analogue with a D-tryptophan substitution at position 6 that confers resistance to enzymatic degradation. As a GnRH agonist, it initially stimulates then powerfully suppresses the HPG axis through receptor downregulation.`,
    pharmacology: `Initial triptorelin administration produces a 'flare' of LH and FSH release (lasting 1–2 weeks) followed by profound pituitary desensitization — GnRH receptor downregulation, uncoupling of receptor from G proteins, and reduction in gonadotroph GnRH receptor number. This suppresses LH, FSH, testosterone, and estradiol to castrate levels within 3–4 weeks.`,
    research: `Triptorelin is an approved pharmaceutical used in prostate cancer, precocious puberty, endometriosis, and fertility protocols. Research applications include: testosterone suppression modeling, HPG axis suppression/restart studies, prostate cancer androgen deprivation models, and investigation of GnRH receptor desensitization mechanisms.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. Bacteriostatic water standard.`,
    specs: [["Type", "GnRH agonist analogue (D-Trp6)"], ["Molecular Weight", "1311.5 Da"], ["Half-life", "Extended (vs native GnRH)"], ["Effect Timeline", "Stimulation then profound suppression"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  71: {
    mechanism: `PT-141 (Bremelanotide) is a cyclic heptapeptide melanocortin receptor agonist derived from Melanotan II via cyclization. It activates melanocortin MC3R and MC4R receptors in the CNS, particularly in the hypothalamus and limbic system, modulating the central arousal pathway.`,
    pharmacology: `Unlike PDE5 inhibitors that act peripherally on penile vasculature, PT-141's mechanism is entirely central — it activates dopaminergic pathways in the hypothalamus associated with sexual arousal and motivation. MC4R activation in the paraventricular nucleus triggers downstream dopamine release in the mesolimbic reward pathway.`,
    research: `Published Phase 2 and 3 clinical trials document significant improvements in arousal endpoints vs placebo in both male and female subjects. FDA approved bremelanotide (Vyleesi) for hypoactive sexual desire disorder in premenopausal women in 2019 — validating the central melanocortin mechanism.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. The cyclic structure provides stability vs linear analogues. Bacteriostatic water standard.`,
    specs: [["Type", "Cyclic melanocortin peptide"], ["Molecular Weight", "1025.2 Da"], ["Targets", "MC3R, MC4R (CNS)"], ["Mechanism", "Central (non-vascular)"], ["FDA Status", "Approved as Vyleesi (2019)"], ["Purity", "≥99% (HPLC)"]],
  },
  72: {
    mechanism: `Dermorphin is a 7-amino acid opioid heptapeptide (Tyr-D-Ala-Phe-Gly-Tyr-Pro-Ser-NH2) originally isolated from the skin of South American Phyllomedusa frogs. Its D-alanine at position 2 is critical for mu-opioid receptor binding and confers resistance to peptidase degradation.`,
    pharmacology: `Dermorphin has exceptional selectivity and potency at mu-opioid receptors (MOR) — estimated to be 30–40× more potent than morphine in terms of analgesic effect in animal models. The D-amino acid configuration provides both enhanced receptor binding affinity and metabolic stability, making it a valuable MOR pharmacology research tool.`,
    research: `Research has focused on MOR binding characteristics and selectivity studies, opioid receptor pharmacology (dermorphin as a highly selective MOR tool), analgesic mechanism characterization, opioid receptor distribution mapping using radiolabeled dermorphin, and investigation of the relationship between D-amino acid configuration and biological potency.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. D-amino acid content confers superior stability vs L-amino acid analogues.`,
    specs: [["Sequence", "Tyr-D-Ala-Phe-Gly-Tyr-Pro-Ser-NH₂"], ["Molecular Weight", "912.0 Da"], ["MOR Potency", "30–40× morphine (analgesic)"], ["Key Feature", "D-Ala at position 2"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  73: {
    mechanism: `FOXO4-DRI is a D-retro-inverso (DRI) peptide — all D-amino acids in reverse sequence — designed to penetrate cells and disrupt the physical interaction between FOXO4 and p53 in senescent cells. Normally, nuclear FOXO4 binds p53 and prevents it from triggering apoptosis in senescent cells.`,
    pharmacology: `In senescent cells, FOXO4 accumulates in the nucleus and binds p53, preventing apoptosis. FOXO4-DRI competitively displaces FOXO4 from p53, allowing p53 to initiate mitochondrial apoptosis selectively in senescent cells — sparing normal, healthy cells which don't rely on this anti-apoptotic mechanism.`,
    research: `Landmark Nature Medicine 2017 study demonstrated FOXO4-DRI cleared senescent cells from aging mice, restoring physical fitness (grip strength, running distance), fur density, and kidney function. Survival was extended. This was the first demonstration that targeted senolytic therapy could reverse physical aging phenotypes.`,
    storage: `Store lyophilized at -20°C. DRI peptides are highly resistant to enzymatic degradation due to D-amino acid backbone. Reconstituted solution stable 60+ days at 2–8°C.`,
    specs: [["Type", "D-retro-inverso (DRI) senolytic peptide"], ["Mechanism", "FOXO4/p53 interaction disruption"], ["Selectivity", "Senescent cells (spares normal cells)"], ["Key Study", "Nature Medicine 2017"], ["Storage", "-20°C lyophilized"], ["Purity", "≥98% (HPLC)"]],
  },
  74: {
    mechanism: `Melanotan I (afamelanotide) is a linear α-MSH analogue with a norleucine substitution at position 4 and D-phenylalanine at position 7. These modifications increase MC1R binding affinity and metabolic stability vs natural α-MSH (~3 minute half-life), extending half-life to several hours.`,
    pharmacology: `MC1R activation on melanocytes triggers the cAMP/PKA pathway, increasing transcription of MITF (master melanocyte transcription factor), which upregulates melanogenic enzymes: tyrosinase, TYRP1, and DCT. This promotes eumelanin synthesis and melanosome formation and transfer to keratinocytes — producing skin darkening.`,
    research: `Research has focused on photoprotection (Melanotan I reduces UV-induced DNA damage in patients with erythropoietic protoporphyria — EU approved for this indication), melanocyte biology, MC1R pharmacology, and pigmentation disorders. Unlike Melanotan II, selectivity for MC1R means minimal central (sexual arousal) effects.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. Protect from light. Bacteriostatic water standard.`,
    specs: [["Type", "α-MSH analogue (linear)"], ["Molecular Weight", "1646.9 Da"], ["Primary Target", "MC1R (melanocyte-selective)"], ["Key Modification", "[Nle4, D-Phe7]-α-MSH"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  75: {
    mechanism: `Melanotan II is a cyclic α-MSH analogue with broad melanocortin receptor activity: MC1R (melanogenesis), MC3R (feeding, energy balance), MC4R (sexual arousal, weight regulation), and MC5R (exocrine gland function). The cyclic structure via disulfide bridge provides greater stability than Melanotan I.`,
    pharmacology: `MC1R activation produces pigmentation; MC3R/MC4R activation produces central effects (appetite suppression, sexual arousal, autonomic effects) that distinguish Melanotan II from the more selective Melanotan I. The pan-melanocortin activity makes it a broader research tool for studying the melanocortin system.`,
    research: `Extensive research documents: dose-dependent melanogenesis and pigmentation, reduced food intake and body weight in feeding behavior models, MC4R-dependent modulation of sexual arousal circuitry, effects on insulin sensitivity, and autonomic nervous system effects. The compound has driven much of the understanding of melanocortin receptor biology developed in the past 30 years.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 28 days at 2–8°C. The cyclic disulfide structure is susceptible to disulfide exchange — avoid reducing agents.`,
    specs: [["Type", "Cyclic α-MSH analogue"], ["Molecular Weight", "1024.2 Da"], ["Receptors", "MC1R, MC3R, MC4R, MC5R"], ["Structure", "Cyclic via Cys4-Cys9 disulfide"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  76: {
    mechanism: `Glutathione (GSH) is the body's most abundant intracellular antioxidant — a tripeptide (γ-Glu-Cys-Gly) with a reactive thiol (-SH) group on cysteine that neutralizes reactive oxygen species (ROS) directly or as a cofactor for glutathione peroxidase and glutathione S-transferase.`,
    pharmacology: `GSH participates in: direct ROS scavenging, regeneration of vitamins C and E, detoxification of xenobiotics and electrophiles via GSH conjugation, maintenance of cellular redox status (GSH/GSSG ratio), protein thiol protection from oxidative modification, and inhibition of tyrosinase activity — the mechanism underlying its skin brightening effects.`,
    research: `IV GSH has been studied for: chemotherapy protection (reduced cisplatin nephrotoxicity and peripheral neuropathy), Parkinson's disease (oxidative stress reduction), liver protection (hepatitis, NAFLD), skin lightening (significant reductions in melanin index in clinical trials), and immune function enhancement in HIV.`,
    storage: `Store lyophilized at -20°C protected from oxygen and moisture. GSH is highly susceptible to oxidation — once oxidized to GSSG, biological activity is lost. Prepare fresh solutions immediately before use.`,
    specs: [["Sequence", "γ-Glu-Cys-Gly"], ["Molecular Weight", "307.3 Da"], ["Reactive Group", "Free thiol (-SH) on cysteine"], ["Oxidized Form", "GSSG (disulfide — inactive)"], ["Storage", "-20°C (oxygen-protected)"], ["Purity", "≥99% (HPLC)"]],
  },
  77: {
    mechanism: `Snap-8 is a synthetic octapeptide (Acetyl-Glu-Glu-Met-Gln-Arg-Arg-Ala-Asp-NH2) analogue of the N-terminal end of SNAP-25. It competes with SNAP-25 for incorporation into the SNARE complex at neuromuscular junctions, reducing acetylcholine release.`,
    pharmacology: `The SNARE complex (SNAP-25 + Syntaxin + VAMP/Synaptobrevin) is essential for synaptic vesicle fusion and neurotransmitter release. By competitively incorporating in place of native SNAP-25, Snap-8 prevents complete SNARE complex formation and reduces acetylcholine release at the neuromuscular junction — attenuating muscle contraction in fine facial expression muscles.`,
    research: `Cosmetic research documents Snap-8's ability to reduce the depth of expression lines (forehead, glabellar, periorbital) when applied topically. Studies show 35% reduction in wrinkle depth vs placebo after 28 days. The safety profile is superior to botulinum toxin-based approaches.`,
    storage: `Store lyophilized at -20°C. Reconstituted solution stable 21 days at 2–8°C. The acetylated N-terminus and amidated C-terminus improve stability.`,
    specs: [["Sequence", "Ac-Glu-Glu-Met-Gln-Arg-Arg-Ala-Asp-NH₂"], ["Molecular Weight", "1075.2 Da"], ["Target", "SNARE complex (SNAP-25 competitor)"], ["Mechanism", "Reduced NMJ acetylcholine release"], ["Storage", "-20°C lyophilized"], ["Purity", "≥99% (HPLC)"]],
  },
  78: {
    mechanism: `Bacteriostatic Water (BW) is sterile water for injection containing 0.9% benzyl alcohol (9mg/mL) as the bacteriostatic preservative. Benzyl alcohol prevents bacterial growth by disrupting bacterial cell membrane integrity and inhibiting metabolic enzyme activity.`,
    pharmacology: `Benzyl alcohol is effective against gram-positive and gram-negative bacteria at the 0.9% concentration. The pH of bacteriostatic water is typically 4.5–7.0, compatible with most peptide reconstitutions. BW enables multi-use vials to remain sterile between uses — critical for protocols requiring multiple doses from a single reconstituted vial.`,
    research: `BW is the universal standard diluent for research peptides and is the recommended reconstitution medium for all standard peptides including GHRH analogues, GHRPs, GLP-1 agonists, and recovery peptides. Its standardized formulation ensures consistent reconstitution conditions across research protocols.`,
    storage: `Store at room temperature (15–25°C) or 2–8°C. Shelf life typically 28 days after first use (multi-dose vial). Discard if particulates, cloudiness, or discoloration appear.`,
    specs: [["Content", "Sterile Water for Injection"], ["Preservative", "0.9% Benzyl Alcohol"], ["pH", "4.5–7.0"], ["Sterility", "USP Sterility tested"], ["Storage", "Room temperature or refrigerated"], ["Use", "Universal peptide diluent"]],
  },
  79: {
    mechanism: `1% Acetic Acid solution provides a mildly acidic aqueous environment (pH ~2.4–2.6) that dramatically improves solubility and stability for peptides with low isoelectric points or those that form aggregates at physiological pH. Specifically required for reconstituting IGF-1 LR3 and certain growth factors.`,
    pharmacology: `The acidic pH protonates peptide amine groups, increasing overall positive charge and reducing intermolecular peptide-peptide interactions that lead to aggregation. For IGF-1 LR3 specifically, neutral pH of bacteriostatic water causes rapid aggregation and loss of activity — 1% acetic acid prevents this.`,
    research: `1% Acetic Acid is the established reconstitution standard for IGF-1 LR3, EGF, acidic FGF, and other growth factors. Published peptide chemistry protocols universally specify acetic acid reconstitution for these compounds. The solubilized peptide can then be diluted into physiological buffers for use.`,
    storage: `Store sealed at room temperature (15–25°C). Acetic acid solution is extremely stable — effectively indefinite shelf life when sealed. Once opened, tightly seal to prevent evaporation of acetic acid.`,
    specs: [["Content", "1% Acetic Acid (v/v)"], ["pH", "~2.4–2.6"], ["Primary Use", "IGF-1 LR3 reconstitution"], ["Volume", "10ml"], ["Storage", "Room temperature (sealed)"], ["Application", "Growth factor solubilization"]],
  },
};

const PRODUCTS = [
  // ── METABOLIC / GLP-1 ── (market rate −7.5%)
  P(1,"metabolic","Semaglutide",[{s:"2mg",p:64},{s:"5mg",p:105},{s:"10mg",p:148},{s:"15mg",p:191},{s:"20mg",p:234}],"Semaglutide is a GLP-1 receptor agonist originally developed for type 2 diabetes management and weight reduction research. It mimics the glucagon-like peptide-1 hormone, suppressing appetite signaling and slowing gastric emptying. Research has demonstrated significant reductions in body weight and improvements in metabolic markers.","Popular",false,"injectable",["GLP-1 receptor agonist","Appetite regulation","Metabolic research","~7 day half-life"]),
  P(2,"metabolic","Tirzepatide",[{s:"5mg",p:73},{s:"10mg",p:124},{s:"15mg",p:159},{s:"20mg",p:199},{s:"40mg",p:306}],"Tirzepatide is a novel dual GIP and GLP-1 receptor agonist that has shown remarkable results in metabolic research. By activating both incretin receptors simultaneously, it demonstrates superior effects on insulin sensitivity and body composition compared to single-agonist compounds in clinical studies.","Best Seller",false,"injectable",["Dual GIP/GLP-1 agonist","Insulin sensitivity","Superior metabolic response","Weekly dosing"]),
  P(3,"metabolic","Retatrutide",[{s:"5mg",p:99},{s:"10mg",p:129},{s:"15mg",p:174},{s:"20mg",p:220}],"Retatrutide is a next-generation triple agonist targeting GLP-1, GIP, and glucagon receptors simultaneously. Early research has shown extraordinary potential for weight reduction and metabolic health, with trials demonstrating the highest weight loss percentages observed in peptide research to date.",null,true,"injectable",["Triple receptor agonist","GLP-1 + GIP + Glucagon","Next-gen metabolic","Highest efficacy observed"]),
  P(4,"metabolic","Liraglutide",[{s:"5mg",p:73},{s:"10mg",p:116}],"Liraglutide is a long-acting GLP-1 analogue with approximately 97% sequence homology to native human GLP-1. Research applications include metabolic health, cardiovascular risk markers, and appetite regulation studies. Its daily dosing profile makes it a well-characterized research tool.",null,false,"injectable",["97% hGLP-1 homology","Daily dosing","Cardiovascular research","Appetite regulation"]),
  P(5,"metabolic","Dulaglutide",[{s:"5mg",p:73},{s:"10mg",p:116}],"Dulaglutide is a once-weekly GLP-1 receptor agonist fused to an immunoglobulin Fc fragment, extending its half-life significantly. Research focuses on its metabolic effects, insulin secretion modulation, and sustained appetite suppression over extended periods.",null,false,"injectable",["Once-weekly dosing","Fc-fused stability","Sustained action","Metabolic research"]),
  P(6,"metabolic","Mazdutide",[{s:"5mg",p:127},{s:"10mg",p:202}],"Mazdutide (IBI362) is a dual GLP-1 and glucagon receptor agonist under active research. The glucagon component adds thermogenic and energy expenditure properties to the GLP-1-mediated appetite suppression, making it a potent metabolic research compound with a distinct mechanism.",null,true,"injectable",["Dual GLP-1/Glucagon","Thermogenic effects","Energy expenditure","Emerging compound"]),
  P(7,"metabolic","Survodutide",[{s:"10mg",p:142}],"Survodutide (BI 456906) is a potent GLP-1 and glucagon receptor co-agonist designed for metabolic and liver health research. Studies have demonstrated strong effects on weight reduction and liver fat content, with ongoing research into non-alcoholic fatty liver disease.",null,true,"injectable",["GLP-1/Glucagon co-agonist","Liver health research","NAFLD studies","Strong metabolic effects"]),
  P(8,"metabolic","Cagrilintide",[{s:"5mg",p:84},{s:"10mg",p:140}],"Cagrilintide is a long-acting amylin analogue that works through a complementary mechanism to GLP-1 agonists. Amylin regulates food intake and glucagon secretion. Research has shown that combining cagrilintide with semaglutide produces additive effects on body weight reduction.",null,true,"injectable",["Amylin receptor agonist","Complementary to GLP-1","Glucagon regulation","Combination research"]),
  P(9,"metabolic","Cagrisema (2.5+2.5mg)",[{s:"combo",p:99}],"Cagrisema is the investigational combination of cagrilintide and semaglutide in a single formulation. Phase 3 trials have demonstrated superior weight reduction compared to either compound alone, representing a convergence of two complementary metabolic pathways.",null,true,"injectable",["Dual mechanism combo","Amylin + GLP-1","Superior combo data","Phase 3 research"]),

  // ── GROWTH HORMONE ──
  P(11,"growth","Ipamorelin",[{s:"2mg",p:41},{s:"5mg",p:67},{s:"10mg",p:105}],"Ipamorelin is a selective growth hormone secretagogue and ghrelin receptor agonist. It stimulates pulsatile GH release without significantly affecting cortisol, prolactin, or ACTH. Research highlights its clean GH-stimulating profile, making it one of the most studied GHRP compounds available.",null,false,"injectable",["Selective GH secretagogue","No cortisol spike","Pulsatile GH release","Clean safety profile"]),
  P(12,"growth","CJC-1295 (no DAC)",[{s:"2mg",p:34},{s:"5mg",p:59}],"CJC-1295 without DAC is a modified GHRH analogue with a shorter, more pulsatile action profile. It stimulates growth hormone release in sync with natural GH pulses, making it ideal for research requiring physiological GH patterns.",null,false,"injectable",["GHRH analogue","Pulsatile GH profile","Physiological pattern","Short-acting"]),
  P(13,"growth","CJC-1295 (DAC)",[{s:"2mg",p:45},{s:"5mg",p:73}],"CJC-1295 with DAC (Drug Affinity Complex) is a long-acting GHRH analogue engineered for sustained GH and IGF-1 elevation. The DAC technology binds the peptide to serum albumin, extending its half-life to approximately 8 days from a single administration.",null,false,"injectable",["GHRH + DAC technology","~8 day half-life","Sustained GH/IGF-1","Once-weekly research"]),
  P(14,"growth","GHRP-2",[{s:"5mg",p:38},{s:"10mg",p:62},{s:"15mg",p:84}],"GHRP-2 is a potent synthetic hexapeptide that stimulates GH release via the ghrelin receptor. Research shows it produces strong GH pulses and has been studied for its effects on body composition, recovery, and metabolic function.",null,false,"injectable",["Potent GH stimulator","Ghrelin receptor agonist","Strong GH pulses","Body composition"]),
  P(15,"growth","GHRP-6",[{s:"5mg",p:38},{s:"10mg",p:62}],"GHRP-6 is one of the original synthetic growth hormone releasing peptides. Research demonstrates significant GH release along with notable appetite stimulation through ghrelin receptor activation. It remains a well-characterized research tool for GH axis studies.",null,false,"injectable",["Original GHRP compound","Significant GH release","Appetite stimulation","Ghrelin research"]),
  P(16,"growth","Hexarelin",[{s:"2mg",p:39},{s:"5mg",p:67}],"Hexarelin is a potent synthetic GHRP that produces some of the highest GH release among GHRP compounds. Research also indicates cardioprotective properties independent of GH release, with studies examining its effects on cardiac function and tissue protection.",null,false,"injectable",["Strongest GHRP","Cardiac research","High GH release","Tissue protection"]),
  P(17,"growth","Sermorelin",[{s:"2mg",p:37},{s:"5mg",p:59},{s:"10mg",p:95}],"Sermorelin is a synthetic analogue of the first 29 amino acids of endogenous GHRH. Research explores its ability to stimulate the pituitary gland to produce GH naturally. It is one of the most studied GHRH analogues in clinical research.",null,false,"injectable",["GHRH(1-29) analogue","Pituitary stimulation","Natural GH pathway","Extensively studied"]),
  P(19,"growth","Tesamorelin",[{s:"2mg",p:52},{s:"5mg",p:88},{s:"10mg",p:138},{s:"20mg",p:242}],"Tesamorelin is a stabilized GHRH analogue with a trans-3-hexenoic acid modification that extends its half-life. Research has focused on its ability to reduce visceral fat accumulation. It produces physiological GH release patterns.",null,false,"injectable",["Stabilized GHRH analogue","Visceral fat research","Physiological GH pattern","Extended half-life"]),
  P(20,"growth","IGF-1 LR3",[{s:"1mg",p:88}],"IGF-1 LR3 is a recombinant analogue of insulin-like growth factor-1 engineered with a 13-amino acid N-terminal extension and an arginine substitution at position 3. These modifications reduce binding to IGF-binding proteins and extend its half-life to approximately 20 hours, making it a powerful tool for growth factor signaling research.",null,true,"injectable",["IGF-1R agonist","Extended half-life","Anabolic signaling","PI3K/Akt pathway"]),
  P(21,"growth","Follistatin 344",[{s:"1mg",p:113}],"Follistatin 344 (FST-344) is a glycoprotein that acts as a potent antagonist of myostatin and activin, thereby removing key inhibitors of muscle growth. Research in animal models has demonstrated significant increases in muscle mass. It is one of the most studied proteins in muscle biology research.",null,true,"injectable",["Myostatin antagonist","Activin inhibitor","Muscle mass research","Animal model data"]),

  // ── RECOVERY & HEALING ──
  P(22,"recovery","BPC-157",[{s:"5mg",p:45},{s:"10mg",p:77}],"BPC-157 (Body Protection Compound 157) is a synthetic pentadecapeptide derived from a protein found in gastric juice. It is among the most studied healing peptides, with research documenting remarkable effects on tendon, ligament, muscle, and GI tract repair. It modulates growth factor signaling and promotes angiogenesis.","Best Seller",false,"injectable",["Tendon & ligament repair","GI tract protection","Angiogenesis promotion","Most studied healing peptide"]),
  P(23,"recovery","TB-500 (Thymosin Beta-4)",[{s:"2mg",p:39},{s:"5mg",p:58},{s:"10mg",p:95}],"TB-500 is a synthetic version of a naturally occurring 43-amino acid peptide found in virtually all human cells. Research demonstrates potent anti-inflammatory properties and tissue repair capabilities, particularly for muscle, tendons, and cardiac tissue. It promotes cell migration and differentiation.",null,false,"injectable",["Thymosin Beta-4 analogue","Anti-inflammatory","Cardiac tissue research","Cell migration"]),
  P(24,"recovery","BPC-157 + TB-500 Blend",[{s:"BPC5mg+TB5mg",p:88},{s:"BPC10mg+TB10mg",p:148}],"This combination blends BPC-157 and TB-500 for synergistic recovery research. BPC-157 accelerates local tissue repair and GI protection while TB-500 provides systemic anti-inflammatory and cell migration effects. Research suggests complementary mechanisms that may enhance overall healing outcomes.",null,true,"injectable",["Synergistic blend","Local + systemic effects","Complementary mechanisms","Enhanced recovery"]),
  P(25,"recovery","GLOW Blend",[{s:"70mg",p:124}],"GLOW is a precision recovery blend combining BPC-157 (10mg), GHK-Cu (50mg), and TB-500 (10mg) in a single vial. Research across each component demonstrates wound healing, collagen synthesis, anti-inflammatory, and tissue repair properties, making this a comprehensive multi-pathway recovery compound.",null,true,"injectable",["BPC-157 + GHK-Cu + TB-500","Multi-pathway recovery","Collagen synthesis","Tissue repair research"]),
  P(26,"recovery","KPV",[{s:"5mg",p:52},{s:"10mg",p:88}],"KPV is a tripeptide derived from the C-terminus of alpha-MSH. Research demonstrates potent anti-inflammatory properties, particularly in gut inflammation models. Studies have examined its effects on intestinal permeability and inflammatory bowel conditions.",null,false,"injectable",["α-MSH derived tripeptide","Gut inflammation research","Anti-inflammatory","Intestinal permeability"]),
  P(27,"recovery","LL-37",[{s:"5mg",p:70}],"LL-37 is a human cathelicidin antimicrobial peptide. Research examines its broad-spectrum antimicrobial activity, immune modulation, wound healing promotion, and angiogenic properties. It has shown promise in infection resistance and skin repair studies.",null,false,"injectable",["Human cathelicidin","Antimicrobial research","Immune modulation","Wound healing"]),
  P(28,"recovery","GHK-Cu",[{s:"50mg",p:45},{s:"100mg",p:77}],"GHK-Cu is a naturally occurring tripeptide with high affinity for copper ions. Research has documented effects on collagen synthesis, wound healing, hair follicle stimulation, and antioxidant activity. It is one of the most extensively studied peptides in regenerative research.",null,false,"injectable",["Copper-binding tripeptide","Collagen synthesis","Hair follicle research","Antioxidant activity"]),
  P(29,"recovery","Thymosin Alpha-1",[{s:"5mg",p:64},{s:"10mg",p:105}],"Thymosin Alpha-1 is a 28-amino acid peptide derived from prothymosin alpha. Research demonstrates potent immune system modulation, particularly in enhancing T-cell function and dendritic cell activity. It has been investigated for immune deficiency, viral infections, and cancer immunotherapy support.",null,false,"injectable",["Immune modulator","T-cell enhancement","Antiviral research","Cancer support studies"]),
  P(31,"recovery","SS-31 (Elamipretide)",[{s:"5mg",p:88},{s:"10mg",p:148}],"SS-31 (Elamipretide) is a mitochondria-targeted tetrapeptide that selectively concentrates in the inner mitochondrial membrane. Research demonstrates protection against mitochondrial dysfunction, oxidative stress, and cellular energy failure in models of heart failure, ischemia-reperfusion, and aging.",null,false,"injectable",["Mitochondria-targeted","Oxidative stress research","Cardioprotective","Energy metabolism"]),
  P(32,"recovery","VIP (Vasoactive Intestinal Peptide)",[{s:"5mg",p:70},{s:"10mg",p:113}],"VIP is a 28-amino acid neuropeptide with broad biological activity across the nervous, immune, and endocrine systems. Research examines its potent anti-inflammatory effects, bronchodilatory properties, neuroprotection, and immune modulation. It has been studied in models of pulmonary hypertension and autoimmune conditions.",null,false,"injectable",["Neuropeptide","Anti-inflammatory","Bronchodilatory research","Immune modulation"]),

  // ── LONGEVITY ──
  P(33,"longevity","Epitalon",[{s:"10mg",p:52},{s:"50mg",p:210}],"Epitalon is a synthetic tetrapeptide derived from Epithalamin, a natural polypeptide from the pineal gland. Research has focused on its telomerase activation properties, antioxidant activity, and potential anti-aging effects. Studies suggest it may regulate melatonin production and circadian rhythms.",null,false,"injectable",["Telomerase activation","Pineal gland derived","Circadian regulation","Anti-aging research"]),
  P(34,"longevity","NAD+",[{s:"100mg",p:48},{s:"500mg",p:73},{s:"1000mg",p:127}],"NAD+ is a critical coenzyme in cellular energy metabolism present in every living cell. Research has extensively documented its role in mitochondrial function, DNA repair via sirtuins and PARPs, and cellular aging processes. Levels decline significantly with age.",null,false,"injectable",["Mitochondrial function","DNA repair pathway","Sirtuin activation","Cellular aging research"]),
  P(37,"longevity","Humanin",[{s:"10mg",p:70}],"Humanin is a 21-amino acid mitochondria-derived peptide encoded within the 16S ribosomal RNA region of mitochondrial DNA. Research has demonstrated neuroprotective, cardioprotective, and cytoprotective properties. Circulating humanin levels decline with age.",null,false,"injectable",["Mitochondria-derived","Neuroprotective","Cardioprotective","Declines with age"]),
  P(38,"longevity","MOTS-c",[{s:"10mg",p:88},{s:"15mg",p:120},{s:"20mg",p:156},{s:"40mg",p:260}],"MOTS-c is a mitochondria-derived peptide encoded in the mitochondrial genome. Research demonstrates its role in regulating metabolic homeostasis, insulin sensitivity, and exercise capacity. Studies suggest it acts as a mitochondrial signal to the nucleus influencing gene expression related to metabolism.",null,false,"injectable",["Mitochondrial peptide","Insulin sensitivity","Exercise capacity","Metabolic homeostasis"]),
  P(41,"longevity","Thymalin",[{s:"10mg",p:53}],"Thymalin is a polypeptide extract from thymic tissue studied for its broad immunomodulatory properties. Research demonstrates restoration of T-cell function, improved immune responses, and potential anti-aging effects through thymic pathway activation.",null,false,"injectable",["Thymic polypeptide","T-cell restoration","Immune function","Anti-aging research"]),

  // ── COGNITIVE & NEURO ──
  P(42,"neuro","Semax",[{s:"5mg",p:52},{s:"10mg",p:88}],"Semax is a synthetic heptapeptide analogue of ACTH(4-7). Originally developed in Russia, it has been extensively researched for cognitive enhancement, neuroprotection, and BDNF upregulation. Research demonstrates enhanced memory, focus, and neuroplasticity.",null,false,"injectable",["ACTH analogue","BDNF upregulation","Neuroprotective","Cognitive enhancement"]),
  P(43,"neuro","Selank",[{s:"5mg",p:52},{s:"10mg",p:88}],"Selank is a synthetic analogue of the human tetrapeptide tuftsin. Research examines its anxiolytic, nootropic, and immunomodulatory properties. Unlike traditional anxiolytics, it does not appear to cause sedation, tolerance, or dependence in research models.",null,false,"injectable",["Tuftsin analogue","Anxiolytic without sedation","Nootropic properties","No tolerance observed"]),
  P(44,"neuro","Dihexa",[{s:"10mg",p:95}],"Dihexa is a potent nootropic peptide derived from angiotensin IV. Research has shown it to be several orders of magnitude more potent than BDNF in promoting new synapse formation. Studies have examined its effects on cognitive deficits and neurodegenerative conditions.",null,false,"injectable",["Angiotensin IV derivative","Synaptogenesis","Potent nootropic","Neurodegeneration research"]),
  P(45,"neuro","Cerebrolysin",[{s:"60mg",p:56}],"Cerebrolysin is a mixture of neuropeptides derived from purified porcine brain proteins. Extensive research has examined its neurotrophic, neuroprotective, and neuroplasticity-enhancing properties. Studies cover stroke recovery, traumatic brain injury, and neurodegenerative disease models.",null,false,"injectable",["Neurotrophic peptide mix","Stroke recovery research","TBI applications","Neuroplasticity"]),
  P(50,"neuro","DSIP (Delta Sleep Inducing Peptide)",[{s:"2mg",p:45},{s:"5mg",p:69}],"DSIP is a nonapeptide originally isolated from rabbit brain during sleep. Research has examined its effects on sleep architecture, stress response modulation, and pain regulation. Studies also explore its influence on hormone release including GH and cortisol.",null,false,"injectable",["Sleep architecture research","Stress modulation","GH release influence","Pain regulation"]),
  P(51,"neuro","Adamax",[{s:"5mg",p:86}],"Adamax is a next-generation nootropic peptide combining adamantane with a tripeptide backbone for enhanced blood-brain barrier penetration. Research examines its cognitive-enhancing and neuroprotective properties, with studies suggesting potent effects on memory consolidation and neural resilience.",null,true,"injectable",["Enhanced BBB penetration","Cognitive enhancement","Memory consolidation","Neuroprotective"]),
  P(52,"neuro","PE-22-28",[{s:"5mg",p:73}],"PE-22-28 is a synthetic peptide fragment of spadin, itself derived from the TREK-1 potassium channel propeptide. Research has demonstrated rapid antidepressant effects in animal models, acting through a mechanism distinct from classical antidepressants with a notably fast onset of action.",null,true,"injectable",["TREK-1 channel modulator","Antidepressant research","Rapid onset action","Novel mechanism"]),

  // ── BODY COMPOSITION ──
  P(53,"body","AOD9604",[{s:"2mg",p:32},{s:"5mg",p:52},{s:"10mg",p:82}],"AOD9604 is a modified fragment of human growth hormone (hGH 176-191) with lipolytic and anti-lipogenic properties without the insulin-like effects of full GH. Studies specifically examine fat cell metabolism and body composition changes.",null,false,"injectable",["hGH fragment 176-191","Lipolytic properties","No insulin-like effects","Fat metabolism"]),
  P(54,"body","HGH Fragment 176-191",[{s:"1mg",p:32},{s:"2mg",p:45},{s:"5mg",p:69},{s:"10mg",p:105}],"HGH Fragment 176-191 is the C-terminal fragment of human growth hormone. Research shows it retains the fat-burning properties of HGH without stimulating IGF-1 or affecting blood glucose. It is one of the most selective lipolytic research peptides available.",null,false,"injectable",["C-terminal hGH fragment","Selective lipolysis","No IGF-1 stimulation","Blood glucose neutral"]),
  P(55,"body","Adipotide (FTPP)",[{s:"2mg",p:45},{s:"5mg",p:75},{s:"10mg",p:124}],"Adipotide is a proapoptotic peptide that selectively targets the vasculature of white adipose tissue. Research in primate models demonstrated significant reduction in body weight by inducing apoptosis specifically in blood vessels supplying fat tissue.",null,false,"injectable",["Adipose-targeting peptide","Proapoptotic mechanism","Selective fat targeting","Primate model research"]),
  P(56,"body","5-AMINO-1MQ",[{s:"5mg",p:56},{s:"10mg",p:92}],"5-Amino-1MQ is a small molecule NNMT (nicotinamide N-methyltransferase) inhibitor. Research demonstrates its role in reversing metabolic dysfunction, reducing fat cell size, and improving insulin sensitivity by restoring NAD+ levels in adipose tissue.",null,true,"capsule",["NNMT inhibitor","Metabolic research","Fat cell reduction","NAD+ restoration"]),
  P(57,"body","SLU-PP-332",[{s:"5mg",p:69},{s:"10mg",p:105}],"SLU-PP-332 is a synthetic ERR (estrogen-related receptor) agonist that mimics the molecular effects of endurance exercise. Research has demonstrated improvements in aerobic capacity, mitochondrial biogenesis, and metabolic efficiency in animal models, earning it the label of an 'exercise mimetic.'",null,true,"capsule",["ERR agonist","Exercise mimetic","Mitochondrial biogenesis","Endurance research"]),
  P(58,"body","ACE-031",[{s:"1mg",p:82}],"ACE-031 is a fusion protein of activin receptor type IIB (ActRIIB) and human IgG1-Fc that acts as a myostatin trap, binding and neutralizing myostatin and related ligands. Research has demonstrated significant increases in muscle mass and bone density in clinical studies.",null,true,"injectable",["Myostatin inhibitor","ActRIIB fusion protein","Muscle mass research","Bone density studies"]),
  P(59,"body","L-Carnitine",[{s:"5000mg",p:34}],"L-Carnitine is a naturally occurring compound essential for fatty acid transport into mitochondria for energy production. Research examines its role in fat oxidation, exercise performance, and metabolic efficiency. It is one of the most studied compounds in sports and metabolic research.",null,false,"liquid",["Fatty acid transport","Mitochondrial energy","Fat oxidation research","Exercise performance"]),
  P(60,"body","Lipo-C",[{s:"10ml",p:37}],"Lipo-C is a lipotropic compound blend formulated to support fat metabolism research. It combines methionine, inositol, choline, and L-carnitine — compounds that facilitate the breakdown and transport of fat in the body. Research examines synergistic effects on hepatic fat processing.",null,false,"liquid",["Lipotropic blend","Fat metabolism","Hepatic research","Synergistic formula"]),
  P(61,"body","MIC (Lipo-C + B12)",[{s:"10ml",p:43}],"MIC combines methionine, inositol, and choline with vitamin B12 for comprehensive lipotropic research. B12 adds neurological and energy metabolism support to the lipotropic core. This combination is widely studied for its synergistic effects on fat metabolism and energy production.",null,false,"liquid",["Methionine-Inositol-Choline","Vitamin B12 added","Lipotropic research","Energy metabolism"]),
  P(62,"body","Lemon Bottle",[{s:"10ml",p:49}],"Lemon Bottle is a riboflavin-based lipolytic compound blend studied for its ability to accelerate the breakdown of fat cells. Research examines the synergistic interaction of its riboflavin, bromelain, and L-carnitine components in adipocyte metabolism.",null,true,"liquid",["Riboflavin-based formula","Adipocyte metabolism","Lipolytic research","Bromelain synergy"]),
  P(63,"body","AICAR",[{s:"50mg",p:62},{s:"100mg",p:105}],"AICAR (5-aminoimidazole-4-carboxamide ribonucleotide) is an AMPK activator extensively studied for its role in mimicking exercise-like metabolic effects. Research documents improved insulin sensitivity, increased fatty acid oxidation, and enhanced endurance capacity in animal models.",null,false,"injectable",["AMPK activator","Exercise mimetic","Insulin sensitivity","Endurance research"]),
  P(64,"body","ARA290 (Cibinetide)",[{s:"10mg",p:69}],"ARA290 (Cibinetide) is a peptide derived from erythropoietin (EPO) that selectively activates the innate repair receptor without triggering EPO's erythropoietic effects. Research examines its neuroprotective, anti-inflammatory, and metabolic properties including improvement of small fiber neuropathy.",null,false,"injectable",["EPO-derived peptide","Innate repair receptor","Neuropathy research","Anti-inflammatory"]),

  // ── HORMONAL ──
  P(65,"hormonal","HCG",[{s:"5000iu",p:56},{s:"10000iu",p:84}],"Human Chorionic Gonadotropin is a glycoprotein hormone structurally similar to LH. Research examines its role in stimulating testosterone production, maintaining testicular function during HPG axis suppression, and supporting fertility research in both male and female models.",null,false,"injectable",["LH-like activity","Testosterone stimulation","HPG axis research","Fertility studies"]),
  P(66,"hormonal","HMG",[{s:"75iu",p:45}],"Human Menopausal Gonadotropin contains both FSH and LH activity. Research examines its role in stimulating ovarian and testicular function, follicle development, and reproductive endocrinology studies. It is used in clinical and preclinical fertility research.",null,false,"injectable",["FSH + LH activity","Ovarian stimulation","Fertility research","Reproductive endocrinology"]),
  P(67,"hormonal","Gonadorelin Acetate",[{s:"2mg",p:32},{s:"5mg",p:52}],"Gonadorelin is a synthetic decapeptide identical to endogenous GnRH. Research examines its role in stimulating LH and FSH release. Pulsatile administration is studied for its ability to maintain HPG axis function and gonadal activity.",null,false,"injectable",["GnRH identical sequence","LH & FSH stimulator","Pulsatile administration","HPG axis research"]),
  P(68,"hormonal","Oxytocin Acetate",[{s:"2mg",p:30},{s:"5mg",p:45},{s:"10mg",p:69}],"Oxytocin is a naturally occurring nonapeptide produced in the hypothalamus. Research has expanded to examine social bonding, anxiety modulation, trust behavior, pain regulation, and metabolic effects beyond its classical reproductive roles.",null,false,"injectable",["Hypothalamic nonapeptide","Social bonding research","Anxiety modulation","Metabolic effects"]),
  P(69,"hormonal","Kisspeptin-10",[{s:"5mg",p:45},{s:"10mg",p:75}],"Kisspeptin-10 is the shortest active form of the kisspeptin neuropeptide family and a critical regulator of the HPG axis. Research examines its role in stimulating GnRH release, regulating LH/FSH, and reproductive endocrinology.",null,false,"injectable",["HPG axis regulator","GnRH stimulator","Reproductive research","LH/FSH modulation"]),
  P(70,"hormonal","Triptorelin Acetate",[{s:"2mg",p:52}],"Triptorelin is a potent GnRH agonist used in research models for HPG axis modulation. Initial stimulation is followed by receptor desensitization and suppression of LH/FSH, making it valuable in testosterone suppression and prostate cancer research models.",null,false,"injectable",["Potent GnRH agonist","HPG axis modulation","LH/FSH suppression","Prostate research"]),
  P(71,"hormonal","PT-141 (Bremelanotide)",[{s:"10mg",p:56}],"PT-141 is a synthetic melanocortin receptor agonist derived from Melanotan II. Research focuses on its central nervous system effects on arousal pathways through MC3R and MC4R activation. Unlike PDE5 inhibitors, it acts centrally rather than on the vascular system.",null,false,"injectable",["Melanocortin agonist","Central arousal pathway","MC3R/MC4R activation","Non-vascular mechanism"]),
  P(72,"hormonal","Demorphin",[{s:"2mg",p:45}],"Demorphin is an endogenous opioid heptapeptide originally isolated from the skin of South American frogs. It has exceptional potency at mu-opioid receptors. Research examines its binding characteristics, analgesic mechanisms, and role in pain pathway studies.",null,false,"injectable",["Endogenous opioid","Mu-opioid receptor","Analgesic research","Pain pathway studies"]),
  P(73,"hormonal","FOXO4-DRI",[{s:"2mg",p:58},{s:"10mg",p:116}],"FOXO4-DRI (FOXO4-D-Retro-Inverso) is a peptide designed to disrupt the interaction between FOXO4 and p53 in senescent cells, triggering selective apoptosis of these cells. Research has demonstrated clearance of senescent cells and restoration of physical function in aged mouse models.",null,true,"injectable",["Senolytic peptide","Senescent cell clearance","p53/FOXO4 disruption","Aging reversal research"]),

  // ── COSMETIC ──
  P(74,"cosmetic","Melanotan I",[{s:"10mg",p:49}],"Melanotan I is a potent, long-acting analogue of alpha-MSH that stimulates melanogenesis through MC1R activation. Research examines its effects on skin pigmentation and UV protection mechanisms. Its longer half-life compared to natural α-MSH makes it a useful tool for melanocyte biology research.",null,false,"injectable",["α-MSH analogue","MC1R activation","Melanogenesis research","UV protection studies"]),
  P(75,"cosmetic","Melanotan II",[{s:"10mg",p:45}],"Melanotan II is a synthetic analogue of alpha-MSH with broad melanocortin receptor binding. Research examines its dual effects on melanogenesis via MC1R and central modulation via MC3R/MC4R, making it one of the most studied melanocortin peptides.","Popular",false,"injectable",["α-MSH analogue","Broad MC receptor binding","Melanogenesis research","Central CNS effects"]),
  P(76,"cosmetic","Glutathione",[{s:"600mg",p:52},{s:"1500mg",p:102}],"Glutathione is the body's master antioxidant tripeptide, composed of glutamine, cysteine, and glycine. Research examines its role in oxidative stress reduction, skin brightening via melanin pathway modulation, immune support, and heavy metal chelation.",null,false,"injectable",["Master antioxidant","Oxidative stress research","Melanin modulation","Immune support"]),
  P(77,"cosmetic","Snap-8",[{s:"10mg",p:56}],"Snap-8 is an octapeptide analogue of the N-terminal end of SNAP-25 that competes for a position in the SNARE complex. Cosmetic research examines its topical neuromuscular modulating effects on expression lines as an alternative to neurotoxin-based approaches.",null,false,"injectable",["SNAP-25 analogue","SNARE complex modulator","Expression line research","Neuromuscular modulation"]),

  // ── ANCILLARIES ──
  P(78,"ancillaries","Bacteriostatic Water",[{s:"3ml",p:13},{s:"10ml",p:19}],"Bacteriostatic Water is sterile water containing 0.9% benzyl alcohol, which prevents bacterial growth and allows multi-use withdrawal from a single vial. It is the standard and recommended reconstitution medium for all research peptides.",null,false,"liquid",["0.9% benzyl alcohol","Multi-use reconstitution","Bacteria inhibition","Research standard"]),
  P(79,"ancillaries","Acetic Acid 1%",[{s:"10ml",p:13}],"1% Acetic Acid solution is used as an alternative reconstitution medium for peptides with poor solubility in bacteriostatic water, including IGF-1 LR3 and some growth factors. It provides an acidic environment that improves solubility for certain peptide classes.",null,false,"liquid",["IGF-1 LR3 compatible","Improves solubility","Alternative reconstitution","Growth factor standard"]),

  // ── Added from supplier list ──
  P(80,"growth","HGH (Somatropin)",[{s:"10iu",p:129},{s:"12iu",p:149},{s:"15iu",p:175},{s:"24iu",p:245}],"Human Growth Hormone (Somatropin) is the full 191-amino acid sequence recombinant hGH used extensively in growth and metabolic research. Studies examine its effects on lean mass accretion, lipolysis, IGF-1 signaling, bone density, and recovery. Each vial is supplied as lyophilized powder requiring reconstitution with bacteriostatic water.",null,false,"injectable",["191aa sequence","IGF-1 stimulation","Lean mass research","Lipolysis & recovery"]),
  P(81,"recovery","CJC-1295 + Ipamorelin Blend",[{s:"10mg (5+5)",p:69}],"A pre-combined blend of CJC-1295 (without DAC) and Ipamorelin in equal 5mg portions per vial. Research documents synergistic GHRH + GHRP action: CJC-1295 extends the GH pulse window while Ipamorelin triggers a clean, selective GH release without significant cortisol or prolactin elevation. One of the most studied GH-axis stacks.",null,false,"injectable",["Synergistic GHRH+GHRP","Clean GH pulse","No cortisol spike","Most studied GH stack"]),
  P(82,"recovery","BPC+GHK-Cu+TB500+KPV Quad Blend",[{s:"80mg",p:145}],"A comprehensive recovery blend combining BPC-157 (10mg), GHK-Cu (50mg), TB-500 (10mg), and KPV (10mg) in a single vial. Research on each component documents complementary mechanisms: BPC-157 for gut and tendon repair, GHK-Cu for collagen and wound healing, TB-500 for systemic tissue regeneration, and KPV for anti-inflammatory signalling.",null,true,"injectable",["Quad-peptide recovery","BPC+GHK+TB500+KPV","Anti-inflammatory","Comprehensive healing"]),
  P(83,"metabolic","FTPP Adipotide",[{s:"5mg",p:59}],"FTPP Adipotide (also listed as Adipotide or FTPP) is a pro-apoptotic peptide that selectively targets the vasculature of white adipose tissue. Research has demonstrated significant reductions in visceral fat in primate models. It acts by inducing apoptosis specifically in blood vessels supplying fat deposits, representing a mechanistically novel fat-reduction approach.",null,false,"injectable",["Pro-apoptotic","Adipose vasculature targeting","Visceral fat research","Primate model data"]),
];

const calcP = (u, v) => u * v * DISC[v];
const fmt = n => `$${n.toFixed(2)}`;

/* ─── DESIGN TOKENS ─── */
const T = {
  bg:       "#f5f7fa",
  white:    "#ffffff",
  border:   "#e8ecf0",
  blue:     "#1a6ed8",
  blueSoft: "#eff5ff",
  blueHov:  "#1558b0",
  text:     "#111827",
  sub:      "#5a6475",
  muted:    "#6b7280",
  green:    "#16a34a",
  greenSoft:"#f0fdf4",
  red:      "#dc2626",
  shadow:   "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
  shadowHov:"0 4px 20px rgba(26,110,216,0.16), 0 1px 4px rgba(0,0,0,0.06)",
};

const btnPrimary = (ex = {}) => ({
  background: T.blue, color: "#fff", border: "none", borderRadius: 10,
  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  transition: "background .15s",
  ...ex,
});

const btnOutline = (ex = {}) => ({
  background: "transparent", color: T.blue, border: `1.5px solid ${T.blue}`,
  borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  ...ex,
});

/* ─── BADGE ─── */
function Badge({ badge, isNew }) {
  if (!badge && !isNew) return null;
  return (
    <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4, zIndex: 2 }}>
      {badge && <span style={{ background: badge === "Best Seller" ? T.blue : "#f59e0b", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>{badge}</span>}
      {isNew && <span style={{ background: T.green, color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 20 }}>NEW</span>}
    </div>
  );
}

/* ─── PRODUCT CARD ─── */

/* ─── Frequently Bought Together pairs ─── */
const FBT = {
  // GLP-1
  1:  [2, 3],      // Semaglutide → Tirzepatide, Retatrutide
  2:  [1, 4],      // Tirzepatide → Semaglutide, Liraglutide
  3:  [1, 2],      // Retatrutide → Sema, Tirze
  // Recovery
  23: [24, 41],    // BPC-157 → TB-500, GHK-Cu
  24: [23, 41],    // TB-500 → BPC-157, GHK-Cu
  41: [23, 24],    // GHK-Cu → BPC-157, TB-500
  82: [23, 24],    // BPC+GHK+TB+KPV Quad → BPC-157, TB-500
  // Growth / GH axis
  12: [81, 13],    // Ipamorelin → CJC+IPA Blend, CJC-1295
  13: [81, 12],    // CJC-1295 → CJC+IPA Blend, Ipamorelin
  81: [12, 13],    // CJC+IPA Blend → Ipamorelin, CJC-1295
  80: [12, 13],    // HGH → Ipamorelin, CJC-1295
  14: [80, 12],    // Tesamorelin → HGH, Ipamorelin
  // Neuro
  50: [51, 53],    // Semax → Selank, Dihexa
  51: [50, 53],    // Selank → Semax, Dihexa
  53: [50, 51],    // Dihexa → Semax, Selank
  // Longevity
  60: [62, 58],    // NAD+ → Epitalon, MOTS-c
  62: [60, 58],    // Epitalon → NAD+, MOTS-c
  58: [60, 62],    // MOTS-c → NAD+, Epitalon
  // Metabolic / fat loss
  83: [7, 8],      // FTPP Adipotide → AOD9604, L-Carnitine
  7:  [83, 8],     // AOD9604 → FTPP Adipotide, L-Carnitine
};

function StarRow({ avg, count, small }) {
  if (!count) return null;
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  return (
    <div style={{ display:"flex", alignItems:"center", gap: small ? 3 : 4, marginBottom: small ? 2 : 4 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: small ? 10 : 12, color: i <= full ? "#f59e0b" : (i === full+1 && half) ? "#f59e0b" : "#d1d5db" }}>
          {i <= full ? "★" : (i === full+1 && half) ? "½" : "☆"}
        </span>
      ))}
      <span style={{ fontSize: small ? 9 : 10, color:"#6b7280", fontWeight:600 }}>{avg.toFixed(1)} ({count})</span>
    </div>
  );
}

function Card({ p, onOpen, onAdd, mob, inv, productReviews }) {
  const [si, setSi] = useState(0);
  const [qty, setQty] = useState(1);
  const [hov, setHov] = useState(false);
  const v = p.variants[si];
  const total = calcP(v.p, qty);

  const isSoldOut = inv && (!inv.inStock || inv.stock === 0);
  const isLow     = inv && inv.inStock && inv.stock > 0 && inv.stock <= 5;

  // Compute review stats for this product
  const revList = productReviews || [];
  const revCount = revList.length;
  const revAvg = revCount ? revList.reduce((s,r) => s + r.rating, 0) / revCount : 0;

  if (mob) return (
    <div style={{
      background: T.white, borderRadius: 14,
      border: `1.5px solid ${isSoldOut ? "#e2e8f0" : T.border}`,
      overflow: "hidden", display: "flex", flexDirection: "row",
      boxShadow: T.shadow, alignItems: "stretch",
      opacity: isSoldOut ? 0.65 : 1,
    }}>
      <div onClick={() => onOpen(p, si, qty)} style={{ position: "relative", cursor: "pointer", background: "#eef3fb", flexShrink: 0, width: 100, overflow: "hidden" }}>
        <img src={p.img} alt={p.name} loading="lazy" style={{ width: 100, height: "100%", minHeight: 120, objectFit: "cover", display: "block" }} />
        <Badge badge={p.badge} isNew={p.isNew} />
        {isSoldOut && <div style={{ position: "absolute", bottom: 6, left: 4, background: "rgba(220,53,69,0.9)", color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>SOLD OUT</div>}
        {isLow    && <div style={{ position: "absolute", bottom: 6, left: 4, background: "rgba(255,149,0,0.9)", color: "#fff", fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>LOW STOCK</div>}
      </div>
      <div style={{ flex: 1, padding: "12px 13px 12px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div onClick={() => onOpen(p, si, qty)} style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3, cursor: "pointer" }}>{p.name}</div>
        <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.55 }}>
          {p.desc.slice(0, 80).trim()}… <span onClick={() => onOpen(p, si, qty)} style={{ color: T.blue, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Read more</span>
        </div>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2, flexShrink: 0 }}>
          {p.variants.map((vv, i) => (
            <button key={i} onClick={() => setSi(i)} style={{
              flexShrink: 0, padding: "6px 11px", borderRadius: 20, border: "1.5px solid", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", minHeight: 28,
              borderColor: si === i ? T.blue : T.border, background: si === i ? T.blueSoft : "transparent", color: si === i ? T.blue : T.sub,
            }}>{vv.s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 5, 10].map(q => (
            <button key={q} onClick={() => setQty(q)} style={{
              flex: 1, padding: "8px 2px", borderRadius: 8, border: "1.5px solid", fontSize: 10, fontWeight: 700, cursor: "pointer", textAlign: "center", fontFamily: "inherit", minHeight: 36,
              borderColor: qty === q ? T.blue : T.border, background: qty === q ? T.blueSoft : "#fff", color: qty === q ? T.blue : T.sub,
            }}>
              {q}×{q > 1 && <div style={{ fontSize: 8, color: T.green, fontWeight: 700, marginTop: 1 }}>{q === 5 ? "-8%" : "-18%"}</div>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fmt(total)}</div>
            {qty > 1 && <div style={{ fontSize: 9, color: T.muted }}>{fmt(total / qty)}/vial</div>}
          </div>
          {isSoldOut
            ? <div style={{ fontSize: 11, fontWeight: 700, color: "#dc3545", padding: "7px 10px", borderRadius: 8, background: "#fff0f2", border: "1.5px solid #f5c6cb" }}>Sold Out</div>
            : <button onClick={() => onAdd(p, v, qty, total)} style={{ ...btnPrimary({ padding: "9px 14px", fontSize: 12, borderRadius: 8, boxShadow: "0 2px 6px rgba(26,110,216,0.22)" }) }}>+ Cart</button>
          }
        </div>
      </div>
    </div>
  );

  // Desktop card
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.white, borderRadius: 16,
        border: `1.5px solid ${isSoldOut ? "#e2e8f0" : hov ? T.blue : T.border}`,
        overflow: "hidden", display: "flex", flexDirection: "column",
        transition: "all .18s",
        boxShadow: hov && !isSoldOut ? T.shadowHov : T.shadow,
        transform: hov && !isSoldOut ? "translateY(-2px)" : "none",
        opacity: isSoldOut ? 0.65 : 1,
      }}
    >
      <div onClick={() => onOpen(p, si, qty)} style={{ position: "relative", cursor: "pointer", background: "#eef3fb", overflow: "hidden", flexShrink: 0 }}>
        <img src={p.img} alt={p.name} loading="lazy"
          style={{ width: "100%", height: 170, objectFit: "cover", display: "block", transition: "transform .3s" }}
          onMouseEnter={e => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={e => (e.target.style.transform = "scale(1)")}
        />
        <Badge badge={p.badge} isNew={p.isNew} />
        {isSoldOut && <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(220,53,69,0.9)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20 }}>SOLD OUT</div>}
        {isLow     && <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(255,149,0,0.9)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20 }}>LOW STOCK — {inv.stock} LEFT</div>}
      </div>

      <div style={{ padding: "13px 14px 15px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        <div onClick={() => onOpen(p, si, qty)} style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.35, cursor: "pointer" }}>{p.name}</div>
        <StarRow avg={revAvg} count={revCount} small={true} />
        <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6 }}>
          {p.desc.slice(0, 90).trim()}… <span onClick={() => onOpen(p, si, qty)} style={{ color: T.blue, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Read more</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {p.variants.map((vv, i) => (
            <button key={i} onClick={() => setSi(i)} style={{
              padding: "6px 11px", borderRadius: 20, border: "1.5px solid", fontSize: 9, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", minHeight: 28,
              borderColor: si === i ? T.blue : T.border, background: si === i ? T.blueSoft : "transparent", color: si === i ? T.blue : T.sub,
            }}>{vv.s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 5, 10].map(q => (
            <button key={q} onClick={() => setQty(q)} style={{
              flex: 1, padding: "4px 2px", borderRadius: 8, border: "1.5px solid", fontSize: 9, fontWeight: 700, cursor: "pointer", textAlign: "center", fontFamily: "inherit",
              borderColor: qty === q ? T.blue : T.border, background: qty === q ? T.blueSoft : "#fff", color: qty === q ? T.blue : T.sub,
            }}>
              {q}×{q > 1 && <div style={{ fontSize: 7, color: T.green, fontWeight: 700, marginTop: 1 }}>{q === 5 ? "-8%" : "-18%"}</div>}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 3 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{fmt(total)}</div>
            {qty > 1 && <div style={{ fontSize: 8, color: T.muted }}>{fmt(total / qty)}/vial</div>}
          </div>
          {isSoldOut
            ? <div style={{ fontSize: 11, fontWeight: 700, color: "#dc3545", padding: "7px 12px", borderRadius: 8, background: "#fff0f2", border: "1.5px solid #f5c6cb" }}>Sold Out</div>
            : <button onClick={() => onAdd(p, v, qty, total)} style={{ ...btnPrimary({ padding: "7px 13px", fontSize: 11, borderRadius: 8, boxShadow: "0 2px 6px rgba(26,110,216,0.22)" }) }}>Add to Cart</button>
          }
        </div>
      </div>
    </div>
  );
}


/* ─── MAIN APP ─── */
/* ══ HOMEPAGE STRUCTURED DATA (module-level so SSR always has access) ══ */
const HOMEPAGE_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Aeterion Labs",
    "url": "https://aeterionpeptides.com",
    "logo": "https://aeterionpeptides.com/apple-touch-icon.png",
    "contactPoint": { "@type": "ContactPoint", "email": "info@aeterionpeptides.com", "contactType": "customer service" },
    "description": "US-based supplier of research-grade peptides, GLP-1 compounds, SARMs, nootropics, and analytical compounds."
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Aeterion Labs",
    "url": "https://aeterionpeptides.com",
    "potentialAction": { "@type": "SearchAction", "target": "https://aeterionpeptides.com/?q={search_term_string}", "query-input": "required name=search_term_string" }
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Research Peptides Catalog",
    "description": "Research-grade peptides, GLP-1 agonists, SARMs, and analytical compounds",
    "url": "https://aeterionpeptides.com",
    "numberOfItems": 72,
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Semaglutide", "url": "https://aeterionpeptides.com/products/semaglutide" },
      { "@type": "ListItem", "position": 2, "name": "Tirzepatide", "url": "https://aeterionpeptides.com/products/tirzepatide" },
      { "@type": "ListItem", "position": 3, "name": "BPC-157", "url": "https://aeterionpeptides.com/products/bpc-157" },
      { "@type": "ListItem", "position": 4, "name": "TB-500", "url": "https://aeterionpeptides.com/products/tb-500" },
      { "@type": "ListItem", "position": 5, "name": "Retatrutide", "url": "https://aeterionpeptides.com/products/retatrutide" },
      { "@type": "ListItem", "position": 7, "name": "CJC-1295", "url": "https://aeterionpeptides.com/products/cjc-1295-with-dac" },
      { "@type": "ListItem", "position": 8, "name": "Ipamorelin", "url": "https://aeterionpeptides.com/products/ipamorelin" },
      { "@type": "ListItem", "position": 9, "name": "NAD+", "url": "https://aeterionpeptides.com/products/nad" },
      { "@type": "ListItem", "position": 10, "name": "Epithalon", "url": "https://aeterionpeptides.com/products/epithalon" }
    ]
  }
];

function ReviewForm({ pid, onSubmit, onCancel, T, btnPrimary }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  return (
    <div style={{ background:T.bg, borderRadius:12, padding:"16px", marginBottom:16, border:`1px solid ${T.border}` }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <input
          placeholder="Your name (e.g. J.M.)"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          style={{ padding:"9px 12px", borderRadius:9, border:`1.5px solid ${T.border}`, fontSize:16, fontFamily:"inherit", outline:"none", background:T.white, color:T.text }} />
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 12px", borderRadius:9, border:`1.5px solid ${T.border}`, background:T.white }}>
          <span style={{ fontSize:12, color:T.muted, marginRight:2 }}>Rating:</span>
          {[1,2,3,4,5].map(star => (
            <span key={star} onClick={() => setRating(star)}
              style={{ fontSize:18, cursor:"pointer", color: star <= rating ? "#f59e0b" : "#d1d5db", transition:"color .1s" }}>★</span>
          ))}
        </div>
      </div>
      <textarea
        placeholder="Share your research experience with this compound..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1.5px solid ${T.border}`, fontSize:16, fontFamily:"inherit", outline:"none", background:T.white, color:T.text, resize:"vertical", boxSizing:"border-box" }} />
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <button onClick={() => { if (!name.trim() || !text.trim()) return; onSubmit({ name: name.trim(), rating, text: text.trim() }); }} style={{ ...btnPrimary({ padding:"9px 20px", fontSize:13 }) }}>Submit Review</button>
        <button onClick={onCancel} style={{ padding:"9px 16px", fontSize:13, borderRadius:9, border:`1.5px solid ${T.border}`, background:"none", color:T.muted, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

export default function App() {
  const mob = useIsMobile();
  const tab = useIsTablet();

  const [page, setPage] = useState("store"); // hash read moved to useEffect for SSR
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("default");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState(null);   // validated code
  const [promoDiscount, setPromoDiscount] = useState(0); // % off from promo
  const [promoStatus, setPromoStatus] = useState(""); // "valid" | "invalid" | "checking" | ""
  const [modal, setModal] = useState(null);
  const [mSi, setMSi] = useState(0);
  const [mQty, setMQty] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [stripeMsg, setStripeMsg] = useState("");
  const [inventory, setInventory] = useState({});
  const [paymentMsg, setPaymentMsg] = useState("");
  const [emailPopup, setEmailPopup] = useState(false);
  const [emailPopupDone, setEmailPopupDone] = useState(false);
  const [emailPopupVal, setEmailPopupVal] = useState("");
  const [emailPopupStatus, setEmailPopupStatus] = useState(""); // "sending"|"done"|"error"
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // ── AI Research Assistant ──
  const [chatOpen, setChatOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [widgetHidden, setWidgetHidden] = useState(false);

  // Open chat on desktop after hydration
  useEffect(() => {
    if (window.innerWidth >= 768) setChatOpen(true);
  }, []);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);

  const sendMessage = async (text) => {
    if (!text || !text.trim() || chatStreaming) return;
    const userMsg = { role: "user", content: text.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages([...newMessages, { role: "assistant", content: "" }]);
    setChatInput("");
    setChatStreaming(true);
    try {
      const res = await fetch("/api/peptide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      // If not streaming response, it's an error — show it
      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        setChatMessages(prev => { const u = [...prev]; u[u.length-1] = { role:"assistant", content:`⚠️ ${err.error || "API error. Check that GEMINI_API_KEY is set in Vercel environment variables."}` }; return u; });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotText = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              gotText = true;
              setChatMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: updated[updated.length - 1].content + parsed.text };
                return updated;
              });
            }
          } catch {}
        }
      }
      // If we streamed but got nothing, show helpful message
      if (!gotText) {
        setChatMessages(prev => { const u = [...prev]; u[u.length-1] = { role:"assistant", content:"⚠️ No response received. Please check that GEMINI_API_KEY is added to your Vercel environment variables and redeploy." }; return u; });
      }
    } catch (err) {
      setChatMessages(prev => { const u = [...prev]; u[u.length-1] = { role:"assistant", content:`⚠️ Connection error: ${err.message}` }; return u; });
    } finally {
      setChatStreaming(false);
    }
  };
  const [reviews, setReviews] = useState({});
  const [showReviewForm, setShowReviewForm] = useState(null); // productId
  const [abandonEmail, setAbandonEmail] = useState("");
  const [abandonPopup, setAbandonPopup] = useState(false);
  const [abandonStatus, setAbandonStatus] = useState("");
  const [user, setUser] = useState(null); // restored from session in useEffect (SSR-safe)
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Restore session (SSR-safe — runs client-side only)
    const sess = getSession();
    if (sess) setUser(sess);
    // Restore page from hash
    const hash = window.location.hash.replace("#", "");
    if (["contact","legal","admin","login","signup","account","about","faq","wholesale"].includes(hash)) setPage(hash);
    fetchInventory().then(inv => setInventory(inv));
    setAuthReady(true);
    // Load reviews from localStorage
    try { const r = JSON.parse(localStorage.getItem("aet_reviews") || "{}"); setReviews(r); } catch {}
    // Email popup: show after 30s if not already dismissed
    const popupDone = localStorage.getItem("aet_popup_v2");
    if (!popupDone) {
      setTimeout(() => setEmailPopup(true), 10000);
    } else {
      setEmailPopupDone(true);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentMsg("success");
      setCart([]);
      window.history.replaceState({}, "", "/");
    } else if (params.get("payment") === "cancelled") {
      setPaymentMsg("cancelled");
      window.history.replaceState({}, "", "/");
    }
  }, []);
  const [contactForm, setContactForm] = useState({ name:"", email:"", subject:"", message:"" });
  const [contactSent, setContactSent] = useState(false);

  // Cart abandonment: if cart has items and user doesn't checkout in 45min, show email prompt
  useEffect(() => {
    if (cart.length === 0) return;
    const abandonDone = localStorage.getItem("aet_abandon_done");
    if (abandonDone) return;
    const timer = setTimeout(() => {
      setAbandonPopup(true);
    }, 45 * 60 * 1000); // 45 minutes
    return () => clearTimeout(timer);
  }, [cart.length > 0]);

  const goTo = (p) => {
    window.history.pushState({ page: p }, "", `#${p}`);
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const open = (p, si = 0, qty = 1) => {
    window.history.pushState({ modal: p.id }, "", `#product-${p.id}`);
    setModal(p); setMSi(si); setMQty(qty);
  };

  useEffect(() => {
    const onPop = () => {
      setModal(prev => {
        if (prev) {
          // Modal was open — close it, stay on current page
          return null;
        }
        return prev;
      });
      // After modal check, handle page state from history
      const hash = window.location.hash.replace("#", "");
      if (["contact","legal","admin","login","signup","account"].includes(hash)) {
        setPage(hash);
      } else {
        setPage("store");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.history.replaceState({ page: "store" }, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // SEO: dynamic page title + meta description (via Next.js Head)
  // NOTE: title/meta now set via <Head> below in the JSX return.
  // Legacy setMeta retained as no-op guard during SSR
  useEffect(() => {
    const setMeta = (name, content) => {
      if (typeof document === "undefined") return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    if (page === "contact") {
      document.title = "Contact Us | Aeterion Peptides";
      setMeta("description", "Contact Aeterion Peptides for research compound inquiries, wholesale pricing, shipping questions, and COA requests.");
    } else if (page === "legal") {
      document.title = "Terms, Privacy & Disclaimer | Aeterion Peptides";
      setMeta("description", "Aeterion Peptides terms of service, privacy policy, return policy, and research-use-only disclaimer.");
    } else {
      document.title = "Buy Research Peptides Online | Aeterion Peptides — GLP-1, BPC-157, TB-500 & More";
      setMeta("description", "Shop 72+ research-grade peptides and analytical compounds at Aeterion Peptides. GLP-1 agonists, BPC-157, TB-500, NAD+, cognitive peptides and more. COA with every order. Fast USA dispatch.");
    }
  }, [page]);

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.lt, 0);

  const addCart = (p, v, qty, lt) => {
    const key = `${p.id}-${v.s}`;  // key WITHOUT qty so same item always merges
    setCart(prev => {
      const ex = prev.find(i => i.key === key);
      if (ex) return prev.map(i => i.key === key ? { ...i, qty: i.qty + qty, lt: i.lt + lt } : i);
      return [...prev, { key, id: p.id, name: p.name, img: p.img, size: v.s, qty, lt }];
    });
  };
  const addCartAndOpen = (p, v, qty, lt) => { addCart(p, v, qty, lt); setCartOpen(true); };
  const rm = key => setCart(p => p.filter(i => i.key !== key));


  const products = useMemo(() => {
    let list = PRODUCTS.filter(p => (cat === "all" || p.cat === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
    if (sort === "low") list = [...list].sort((a, b) => a.variants[0].p - b.variants[0].p);
    if (sort === "high") list = [...list].sort((a, b) => b.variants[0].p - a.variants[0].p);
    if (sort === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [cat, q, sort]);

  const grouped = useMemo(() => {
    if (cat !== "all" || q) return null;
    return CATS.map(c => ({ ...c, items: products.filter(p => p.cat === c.id) })).filter(c => c.items.length);
  }, [products, cat, q]);

  const closeModal = () => { window.history.back(); };
  const mv = modal ? modal.variants[mSi] : null;
  const mTotal = modal ? calcP(mv.p, mQty) : 0;
  const cols = mob ? "repeat(2,1fr)" : tab ? "repeat(3,1fr)" : "repeat(auto-fill,minmax(210px,1fr))";

  const checkout = async () => {
    if (!cart.length) return;
    setStripeMsg("Connecting to Stripe…");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({
            id:   i.id,
            name: i.name,
            size: i.size,
            qty:  i.qty,
            lt:   i.lt,
            p:    i.variant?.p || (i.lt / (i.qty >= 10 ? 0.82 : i.qty >= 5 ? 0.92 : 1) / i.qty),
          })),
          user_id:    user?.id || null,
          user_email: user?.email || null,
          promoCode:  promoCode || null,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStripeMsg("⚠️ " + (data.error || "Something went wrong. Please try again."));
      }
    } catch (err) {
      setStripeMsg("⚠️ Could not connect to payment server. Please try again.");
    }
  };

  /* ── PRODUCT MODAL ── */
  const ProductModal = () => {
    if (!modal) return null;
    const isFullscreen = mob;
    return (
      <div onClick={closeModal} style={{ position: "fixed", inset: 0, background: isFullscreen ? T.white : "rgba(0,0,0,0.4)", zIndex: 600, display: "flex", alignItems: isFullscreen ? "stretch" : "center", justifyContent: "center", padding: isFullscreen ? 0 : 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: T.white, borderRadius: isFullscreen ? 0 : 18, width: "100%", maxWidth: isFullscreen ? "100%" : 860, maxHeight: isFullscreen ? "100%" : "88vh", overflow: "auto", boxShadow: isFullscreen ? "none" : "0 24px 60px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
          {isFullscreen && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${T.border}`, background: T.white, position: "sticky", top: 0, zIndex: 10 }}>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: T.sub, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", fontWeight: 600 }}>← Back</button>
              <div style={{ fontSize: 10, color: T.blue, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{CATS.find(c => c.id === modal.cat)?.label}</div>
              <div style={{ width: 60 }} />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: isFullscreen ? "1fr" : "1fr 1.2fr", flex: 1 }}>
            <div style={{ background: "#eef3fb", borderRadius: isFullscreen ? 0 : "18px 0 0 18px", position: "relative", overflow: "hidden", minHeight: isFullscreen ? 260 : 340 }}>
              <img src={modal.img} alt={modal.name} style={{ width: "100%", height: isFullscreen ? 260 : "100%", objectFit: "cover", minHeight: isFullscreen ? 260 : 340, display: "block" }} />
              <Badge badge={modal.badge} isNew={modal.isNew} />
              {!isFullscreen && (
                <button onClick={closeModal} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)", border: "none", color: T.sub, fontSize: 14, cursor: "pointer", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</button>
              )}
            </div>
            <div style={{ padding: isFullscreen ? "20px 18px 24px" : "26px 28px 24px", overflow: "auto" }}>
              {!isFullscreen && <div style={{ fontSize: 10, color: T.blue, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{CATS.find(c => c.id === modal.cat)?.label}</div>}
              <h2 style={{ margin: "0 0 8px", fontSize: isFullscreen ? 22 : 22, fontWeight: 800, color: T.text }}>{modal.name}</h2>
              <p style={{ color: T.sub, fontSize: 13, lineHeight: 1.8, margin: "0 0 14px" }}>{modal.desc}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Key Research Highlights</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(modal.highlights || []).map((h, i) => (
                    <span key={i} style={{ background: T.blueSoft, color: T.blue, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, border: `1px solid ${T.border}` }}>{h}</span>
                  ))}
                </div>
              </div>

              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#92400e", fontWeight: 600 }}>⚠ For Research Use Only — Not for Human Consumption</div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>Size</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {modal.variants.map((v, i) => (
                    <button key={i} onClick={() => setMSi(i)} style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", borderColor: mSi === i ? T.blue : T.border, background: mSi === i ? T.blueSoft : "#fff", color: mSi === i ? T.blue : T.sub }}>{v.s} — {fmt(v.p)}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>Quantity</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 5, 10].map(qq => (
                    <button key={qq} onClick={() => setMQty(qq)} style={{ flex: 1, padding: "10px 4px", borderRadius: 9, border: "1.5px solid", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "center", fontFamily: "inherit", borderColor: mQty === qq ? T.blue : T.border, background: mQty === qq ? T.blueSoft : "#fff", color: mQty === qq ? T.blue : T.sub }}>
                      {qq} Vial{qq > 1 ? "s" : ""}
                      {qq > 1 && <div style={{ fontSize: 10, marginTop: 2, color: T.green, fontWeight: 700 }}>{qq === 5 ? "-8%" : "-18%"}</div>}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: T.blueSoft, border: "1px solid #c7dcf9", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.sub }}>
                  <span>{fmt(mv.p)} × {mQty} vial{mQty > 1 ? "s" : ""}</span>
                  {mQty > 1 && <span style={{ color: T.green, fontWeight: 700 }}>{mQty === 5 ? "Save 8%" : "Save 18%"}</span>}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text, marginTop: 4 }}>{fmt(mTotal)}</div>
              </div>

              <button onClick={() => { addCart(modal, mv, mQty, mTotal); setCartOpen(true); closeModal(); }}
                style={{ ...btnPrimary({ width: "100%", padding: "13px", fontSize: 14, boxShadow: "0 3px 10px rgba(26,110,216,0.25)",
                  ...(inventory[modal?.id] && (!inventory[modal.id].inStock || inventory[modal.id].stock === 0)
                    ? { background: "#e2e8f0", cursor: "not-allowed", boxShadow: "none" } : {})
                }) }}
                disabled={!!(inventory[modal?.id] && (!inventory[modal.id].inStock || inventory[modal.id].stock === 0))}
              >
                {inventory[modal?.id] && (!inventory[modal.id].inStock || inventory[modal.id].stock === 0)
                  ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
          </div>

          {/* ── FREQUENTLY BOUGHT TOGETHER ── */}
          {(() => {
            const pid = modal?.id;
            const fbtIds = FBT[pid];
            if (!fbtIds || fbtIds.length === 0) return null;
            const fbtProducts = fbtIds.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
            if (fbtProducts.length === 0) return null;
            return (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: isFullscreen ? "16px 18px 20px" : "22px 32px 24px", background: T.bg }}>
                <div style={{ fontSize:11, fontWeight:800, color:T.blue, letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>Frequently Bought Together</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {/* The current product */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, background:T.white, border:`1.5px solid ${T.blue}`, borderRadius:12, padding:"10px 14px", flex:"1 1 160px", minWidth:140 }}>
                    <img src={modal.img} alt={modal.name} style={{ width:40, height:40, borderRadius:8, objectFit:"cover" }} />
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{modal.name}</div>
                      <div style={{ fontSize:11, color:T.blue, fontWeight:600 }}>This item</div>
                    </div>
                  </div>
                  {fbtProducts.map((fp, i) => (
                    <div key={fp.id} style={{ display:"flex", alignItems:"center", gap:10, background:T.white, border:`1.5px solid ${T.border}`, borderRadius:12, padding:"10px 14px", flex:"1 1 160px", minWidth:140, cursor:"pointer", transition:"border-color .15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = T.blue}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                      onClick={() => { setModal(fp); setMSi(0); setMQty(1); }}>
                      <img src={fp.img} alt={fp.name} style={{ width:40, height:40, borderRadius:8, objectFit:"cover" }} />
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{fp.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{fmt(fp.variants[0].p)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    fbtProducts.forEach(fp => addCart(fp, fp.variants[0], 1, fp.variants[0].p));
                    addCart(modal, modal.variants[mSi], mQty, calcP(modal.variants[mSi].p, mQty));
                    setCartOpen(true);
                    setModal(null);
                  }}
                  style={{ marginTop:14, background: T.blueSoft, border:`1.5px solid ${T.blue}`, color:T.blue, fontWeight:700, fontSize:13, padding:"10px 20px", borderRadius:10, cursor:"pointer", fontFamily:"inherit" }}>
                  Add All {fbtProducts.length + 1} to Cart
                </button>
              </div>
            );
          })()}

          {/* Long-form research section — shown below the two-column layout for products with research data */}
          {RESEARCH[modal?.id] && (() => {
            const r = RESEARCH[modal.id];
            return (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: isFullscreen ? "20px 18px 32px" : "28px 32px 36px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.blue, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Research Profile</div>

                {/* Specs table */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 8, marginBottom: 24 }}>
                  {r.specs.map(([k,v]) => (
                    <div key={k} style={{ background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 3, wordBreak: "break-word" }}>{v}</div>
                    </div>
                  ))}
                </div>

                {[["Mechanism of Action", r.mechanism], ["Pharmacology", r.pharmacology], ["Research Overview", r.research], ["Storage & Reconstitution", r.storage]].map(([title, content]) => (
                  <div key={title} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.85 }}>{content}</div>
                  </div>
                ))}

                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600, lineHeight: 1.6 }}>
                    All information provided is for educational and research purposes only. This compound has not been approved by the FDA for human or veterinary use. References to clinical studies are provided for scientific context and do not imply therapeutic claims.
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── REVIEWS SECTION ── */}
          {(() => {
            const pid = modal?.id;
            const revList = reviews[pid] || [];
            const revCount = revList.length;
            const revAvg = revCount ? revList.reduce((s,r) => s + r.rating, 0) / revCount : 0;
            return (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: isFullscreen ? "16px 18px 28px" : "24px 32px 32px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:800, color:T.blue, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Researcher Reviews</div>
                    {revCount > 0
                      ? <StarRow avg={revAvg} count={revCount} />
                      : <div style={{ fontSize:12, color:T.muted }}>No reviews yet — be the first!</div>}
                  </div>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowReviewForm(showReviewForm === pid ? null : pid); setTimeout(() => { document.getElementById(`review-form-${pid}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 50); }}
                    style={{ background:T.blueSoft, border:`1.5px solid ${T.blue}`, color:T.blue, fontWeight:700, fontSize:12, padding:"8px 16px", borderRadius:10, cursor:"pointer", fontFamily:"inherit" }}>
                    {showReviewForm === pid ? "Cancel" : "+ Leave a Review"}
                  </button>
                </div>

                {showReviewForm === pid && (
                  <div id={`review-form-${pid}`}>
                  <ReviewForm
                    pid={pid}
                    T={T}
                    btnPrimary={btnPrimary}
                    onCancel={() => setShowReviewForm(null)}
                    onSubmit={({ name, rating, text }) => {
                      const newReview = { name, rating, text, date: new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}) };
                      const updated = { ...reviews, [pid]: [newReview, ...(reviews[pid]||[])] };
                      setReviews(updated);
                      try { localStorage.setItem("aet_reviews", JSON.stringify(updated)); } catch {}
                      setShowReviewForm(null);
                    }}
                  />
                  </div>
                )}

                {revList.slice(0,5).map((rev, i) => (
                  <div key={i} style={{ borderBottom: i < revList.length-1 ? `1px solid ${T.border}` : "none", paddingBottom:12, marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{rev.name}</div>
                      <div style={{ fontSize:10, color:T.muted }}>{rev.date}</div>
                    </div>
                    <div style={{ display:"flex", gap:2, marginBottom:5 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:11, color: s<=rev.rating ? "#f59e0b" : "#d1d5db" }}>★</span>)}
                    </div>
                    <div style={{ fontSize:13, color:T.sub, lineHeight:1.65 }}>{rev.text}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  /* ── CART DRAWER ── */
  const cartDrawerJSX = (
    <>
      {cartOpen && <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500 }} />}
      <div style={{ position: "fixed", top: 0, right: cartOpen ? 0 : (mob ? "-100%" : -420), width: mob ? "100%" : 400, height: "100%", background: T.white, zIndex: 510, display: "flex", flexDirection: "column", boxShadow: "-4px 0 32px rgba(0,0,0,0.12)", transition: "right .3s ease" }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>Your Cart {count > 0 && <span style={{ color: T.blue }}>({count})</span>}</div>
          <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: T.sub }}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.muted, gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff5ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 13, fontWeight: 800, color: "#1a6ed8" }}>CART</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Your cart is empty</div>
            <button onClick={() => setCartOpen(false)} style={{ ...btnPrimary({ padding: "10px 22px", fontSize: 13 }), marginTop: 4 }}>Browse Products</button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
              {cart.map(item => (
                <div key={item.key} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                  <img src={item.img} alt={item.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.border}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{item.size} · Qty {item.qty}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{fmt(item.lt)}</div>
                    <button onClick={() => rm(item.key)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 18px 20px", borderTop: `1px solid ${T.border}` }}>
              <div style={{ background: T.greenSoft, border: "1px solid #bbf7d0", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#15803d", fontWeight: 600 }}>Bulk savings applied automatically</div>

              {/* Promo Code Input */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value.toUpperCase()); if (promoStatus) { setPromoStatus(""); setPromoCode(null); setPromoDiscount(0); } }}
                    placeholder="Promo code"
                    maxLength={20}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${promoStatus === "valid" ? "#16a34a" : promoStatus === "invalid" ? "#dc2626" : T.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: T.white, color: T.text }}
                  />
                  <button
                    onClick={async () => {
                      if (!promoInput.trim()) return;
                      if (promoStatus === "valid") { setPromoCode(null); setPromoDiscount(0); setPromoStatus(""); setPromoInput(""); return; }
                      setPromoStatus("checking");
                      try {
                        const r = await fetch("/api/validate-promo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promoInput.trim() }) });
                        const d = await r.json();
                        if (d.valid) { setPromoCode(d.code); setPromoDiscount(d.discount || 10); setPromoStatus("valid"); }
                        else { setPromoCode(null); setPromoStatus("invalid"); }
                      } catch { setPromoCode(null); setPromoStatus("invalid"); }
                    }}
                    style={{ padding: "9px 14px", borderRadius: 9, border: "none", background: promoStatus === "valid" ? "#dc2626" : T.blue, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                  >
                    {promoStatus === "checking" ? "…" : promoStatus === "valid" ? "Remove" : "Apply"}
                  </button>
                </div>
                {promoStatus === "valid" && <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600, marginTop: 5 }}>✓ {promoCode} applied — {promoDiscount}% off at checkout!</div>}
                {promoStatus === "invalid" && <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginTop: 5 }}>✗ Invalid promo code.</div>}
              </div>

              {/* ── Order Summary Breakdown ── */}
              {(() => {
                // lt already has bulk discount applied (lt = unit_price * qty * DISC[qty])
                // Back-calculate undiscounted base: unit price = lt / qty / DISC[qty]
                const baseTotal = cart.reduce((s, i) => {
                  const discRate = i.qty >= 10 ? 0.82 : i.qty >= 5 ? 0.92 : 1;
                  return s + (i.lt / discRate);
                }, 0);
                const bulkSavings = baseTotal - total;
                const promoSavings = promoDiscount > 0 ? total * (promoDiscount / 100) : 0;
                const finalTotal = total - promoSavings;
                return (
                  <div style={{ background: T.bg, borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: T.sub, marginBottom: 6 }}>
                      <span>Subtotal</span><span>{fmt(baseTotal)}</span>
                    </div>
                    {bulkSavings > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d", fontWeight: 600, marginBottom: 6 }}>
                        <span>Bulk Discount</span><span>−{fmt(bulkSavings)}</span>
                      </div>
                    )}
                    {promoSavings > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d", fontWeight: 600, marginBottom: 6 }}>
                        <span>🎟 {promoCode} ({promoDiscount}% off)</span><span>−{fmt(promoSavings)}</span>
                      </div>
                    )}
                    <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15, color: T.text }}>
                      <span>Total</span><span>{fmt(finalTotal)}</span>
                    </div>
                    {total >= 250 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#15803d", fontWeight: 600 }}>Free shipping applied</div>
                    )}
                  </div>
                );
              })()}
              {stripeMsg && <div style={{ fontSize: 11, color: T.sub, marginBottom: 10, background: "#fffbeb", borderRadius: 8, padding: "8px 10px", border: "1px solid #fde68a" }}>{stripeMsg}</div>}
              {paymentMsg === "cancelled" && (
                <div style={{ marginBottom: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#854d0e" }}>
                  Checkout was cancelled — your cart is still saved.
                </div>
              )}
              <button onClick={checkout} style={{ ...btnPrimary({ width: "100%", padding: "14px", fontSize: 14, borderRadius: 12, boxShadow: "0 4px 14px rgba(26,110,216,0.28)" }) }}>Checkout</button>
            </div>
          </>
        )}
      </div>
    </>
  );

  /* ── MOBILE SIDE MENU ── */
  const MobileMenu = () => {
    if (!menuOpen) return null;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 490 }}>
        <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "80%", maxWidth: 300, height: "100%", background: T.white, boxShadow: "4px 0 24px rgba(0,0,0,0.12)", overflowY: "auto" }}>
          <div style={{ padding: "20px 20px 12px", borderBottom: `1px solid ${T.border}` }}>
            <AeterionLogo size={36} showText={true} textColor={T.text}/>
          </div>
          <div style={{ padding: "12px 12px" }}>
            {[{ id: "all", label: "All Products", icon: "" }, ...CATS].map(c => (
              <button key={c.id} onClick={() => { setCat(c.id); setQ(""); setMenuOpen(false); }} style={{ width: "100%", textAlign: "left", background: cat === c.id ? T.blueSoft : "none", border: "none", borderRadius: 10, padding: "11px 14px", cursor: "pointer", fontSize: 14, fontWeight: 600, color: cat === c.id ? T.blue : T.text, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                {c.icon} {c.label}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${T.border}`, margin: "12px 0" }} />
            {[["Contact Us","contact"],["Legal & Policies","legal"],["About Us","about"],["FAQ","faq"]].map(([lb,pg]) => (
              <button key={pg} onClick={() => { goTo(pg); setMenuOpen(false); }} style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderRadius: 10, padding: "11px 14px", cursor: "pointer", fontSize: 14, fontWeight: 600, color: T.text, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                {lb}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ════════════════════ ADMIN PAGE ════════════════════ */
  const AdminPage = ({ goTo }) => {
    const [authed, setAuthed] = useState(false);
    const [adminToken, setAdminToken] = useState("");
    const [pw, setPw] = useState("");
    const [pwErr, setPwErr] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState(null);
    const [trackingInputs, setTrackingInputs] = useState({});
    const [notesInputs, setNotesInputs] = useState({});

    // Restore session on refresh
    useEffect(() => {
      try {
        const saved = sessionStorage.getItem("aet_admin_token");
        if (saved) {
          setAdminToken(saved);
          setAuthed(true);
        }
      } catch {}
    }, []);

    // Load data once authed
    useEffect(() => {
      if (authed && adminToken) loadOrders();
    }, [authed, adminToken]);

    // ── Ambassador tab state ──
    const [adminTab, setAdminTab] = useState("orders"); // "orders" | "ambassadors" | "commissions" | "blog"
    const [commissions, setCommissions] = useState([]);

    // ── Blog state ──
    const [blogPosts, setBlogPosts] = useState([]);
    const [blogForm, setBlogForm] = useState({ title: "", excerpt: "", body: "", cover_url: "", tags: "", published: false });
    const [blogEditing, setBlogEditing] = useState(null); // post id being edited
    const [blogWorking, setBlogWorking] = useState(false);
    const [blogMsg, setBlogMsg] = useState("");
    const [blogPreview, setBlogPreview] = useState(false);

    const loadBlogPosts = async () => {
      try {
        const res = await fetch(`/api/blog?admin_token=${encodeURIComponent(adminToken)}`);
        const data = await res.json();
        if (data.posts) setBlogPosts(data.posts);
      } catch {}
    };

    const saveBlogPost = async () => {
      if (!blogForm.title.trim()) { setBlogMsg("✗ Title is required"); return; }
      setBlogWorking(true); setBlogMsg("");
      try {
        const payload = {
          admin_token: adminToken,
          title: blogForm.title.trim(),
          excerpt: blogForm.excerpt.trim() || blogForm.body.slice(0, 160),
          body: blogForm.body,
          cover_url: blogForm.cover_url.trim() || null,
          tags: blogForm.tags ? blogForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
          published: blogForm.published,
        };
        const method = blogEditing ? "PUT" : "POST";
        if (blogEditing) payload.id = blogEditing;
        const res = await fetch("/api/blog", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.post) {
          setBlogMsg(blogEditing ? "✓ Post updated" : "✓ Post published");
          setBlogForm({ title: "", excerpt: "", body: "", cover_url: "", tags: "", published: false });
          setBlogEditing(null);
          await loadBlogPosts();
        } else {
          setBlogMsg("✗ " + (data.error || "Failed"));
        }
      } catch { setBlogMsg("✗ Request failed"); }
      setBlogWorking(false);
    };

    const deleteBlogPost = async (id) => {
      if (!window.confirm("Delete this post permanently?")) return;
      await fetch("/api/blog", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_token: adminToken, id }) });
      await loadBlogPosts();
    };

    const editBlogPost = (post) => {
      setBlogEditing(post.id);
      setBlogForm({ title: post.title, excerpt: post.excerpt || "", body: post.body || "", cover_url: post.cover_url || "", tags: (post.tags || []).join(", "), published: post.published });
      setBlogMsg("");
    };

    const loadCommissions = async () => {
      try {
        const res = await fetch("/api/ambassador/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_token: adminToken, action: "list_commissions" }),
        });
        const data = await res.json();
        if (data.commissions) setCommissions(data.commissions);
      } catch {}
    };

    const deleteCommission = async (commissionId) => {
      if (!window.confirm("Delete this commission record? This will adjust the ambassador's total.")) return;
      const res = await fetch("/api/ambassador/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_token: adminToken, action: "delete_commission", commission_id: commissionId }),
      });
      const data = await res.json();
      if (data.success) await loadCommissions();
      else alert("Delete failed: " + data.error);
    };
    const [ambassadors, setAmbassadors] = useState([]);
    const [ambLoading, setAmbLoading] = useState(false);
    const [ambExpanded, setAmbExpanded] = useState(null);
    const [approveForm, setApproveForm] = useState({}); // { [id]: { code, password, commission } }
    const [ambWorking, setAmbWorking] = useState(null);
    const [ambMsg, setAmbMsg] = useState({});
    const [showCreateAmb, setShowCreateAmb] = useState(false);
    const [createAmbForm, setCreateAmbForm] = useState({ name: "", email: "", instagram: "", code: "", password: "", commission: "20" });
    const [createAmbWorking, setCreateAmbWorking] = useState(false);
    const [createAmbMsg, setCreateAmbMsg] = useState("");

    const loadAmbassadors = async () => {
      setAmbLoading(true);
      try {
        const res = await fetch("/api/ambassador/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_token: adminToken, action: "list" }),
        });
        const data = await res.json();
        setAmbassadors(data.ambassadors || []);
      } catch (e) { console.error(e); }
      setAmbLoading(false);
    };

    const createAmbassador = async () => {
      const { name, email, code, password, commission, instagram } = createAmbForm;
      if (!name || !email || !code || !password) { setCreateAmbMsg("✗ Name, email, code and password are required."); return; }
      setCreateAmbWorking(true);
      setCreateAmbMsg("");
      try {
        const res = await fetch("/api/ambassador/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            admin_token: adminToken,
            action: "create",
            name, email, instagram,
            promo_code: code.toUpperCase().trim(),
            password,
            commission_rate: Number(commission) || 20,
          }),
        });
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (data.success) {
          setCreateAmbMsg("✓ Ambassador created successfully!");
          setCreateAmbForm({ name: "", email: "", instagram: "", code: "", password: "", commission: "20" });
          setShowCreateAmb(false);
          await loadAmbassadors();
        } else {
          setCreateAmbMsg("✗ " + (data.error || `HTTP ${res.status}`));
        }
      } catch (e) { setCreateAmbMsg("✗ " + (e.message || "Request failed.")); }
      setCreateAmbWorking(false);
    };

    const ambAction = async (action, id, extra = {}) => {
      setAmbWorking(id);
      setAmbMsg(prev => ({ ...prev, [id]: "" }));
      try {
        const res = await fetch("/api/ambassador/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ admin_token: adminToken, action, ambassador_id: id, ...extra }),
        });
        const data = await res.json();
        if (data.success) {
          const successMsg = action === "mark_paid"
            ? `✓ Marked $${data.amount_paid?.toFixed(2)} as paid`
            : `✓ ${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`;
          setAmbMsg(prev => ({ ...prev, [id]: successMsg }));
          await loadAmbassadors();
        } else {
          setAmbMsg(prev => ({ ...prev, [id]: "✗ " + (data.error || "Error") }));
        }
      } catch (e) {
        setAmbMsg(prev => ({ ...prev, [id]: "✗ Request failed" }));
      }
      setAmbWorking(null);
    };

    const login = async () => {
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw }),
        });
        const data = await res.json();
        if (data.token) {
          setAdminToken(data.token);
          setAuthed(true);
          try { sessionStorage.setItem("aet_admin_token", data.token); } catch {}
          loadOrders();
        } else {
          setPwErr(true);
          setTimeout(() => setPwErr(false), 2000);
        }
      } catch {
        setPwErr(true);
        setTimeout(() => setPwErr(false), 2000);
      }
    };

    const loadOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${SB_URL}/rest/v1/orders?select=*&order=created_at.desc`, {
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
        });
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };

    const updateOrder = async (id, updates) => {
      setUpdating(id);
      try {
        await fetch("/api/update-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id, ...updates }),
        });
        await loadOrders();
      } catch (e) { console.error(e); }
      setUpdating(null);
    };

    const statusColors = { processing: ["#fff7ed","#f97316","#fed7aa"], shipped: ["#eff6ff","#1a6ed8","#bfdbfe"], delivered: ["#f0fdf4","#16a34a","#bbf7d0"], refunded: ["#fef2f2","#dc2626","#fecaca"] };
    const filtered = orders.filter(o => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchSearch = !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.customer_name?.toLowerCase().includes(search.toLowerCase()) || o.customer_email?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

    if (!authed) return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#0f172a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "#1e293b", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 380, boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#60a5fa", textTransform: "uppercase", marginBottom: 8 }}>AETERION LABS</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#f8fafc" }}>Admin Panel</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>Enter your admin password</div>
          </div>
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="Password"
            style={{ width: "100%", background: pwErr ? "#3b0000" : "#0f172a", border: `2px solid ${pwErr ? "#dc2626" : "#334155"}`, borderRadius: 12, padding: "14px 16px", fontSize: 16, color: "#f8fafc", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 14, transition: "border-color .2s" }}
          />
          {pwErr && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12, textAlign: "center" }}>Incorrect password</div>}
          <button onClick={login} style={{ ...btnPrimary({ width: "100%", padding: "14px", fontSize: 15, borderRadius: 12 }) }}>Sign In</button>
          <button onClick={() => goTo("store")} style={{ width: "100%", marginTop: 10, padding: "12px", background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Back to Store</button>
        </div>
      </div>
    );

    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#0f172a", minHeight: "100vh", color: "#f8fafc" }}>
        {/* Header */}
        <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#60a5fa", textTransform: "uppercase" }}>AETERION LABS</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>Admin Panel</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setAdminTab("orders"); loadOrders(); }} style={{ background: adminTab === "orders" ? "#1a6ed8" : "#334155", border: "none", color: adminTab === "orders" ? "#fff" : "#94a3b8", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 700 }}>📦 Orders</button>
            <button onClick={() => { setAdminTab("ambassadors"); loadAmbassadors(); }} style={{ background: adminTab === "ambassadors" ? "#1a6ed8" : "#334155", border: "none", color: adminTab === "ambassadors" ? "#fff" : "#94a3b8", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 700, position: "relative" }}>
              🤝 Ambassadors
              {ambassadors.filter(a => a.status === "pending").length > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, background: "#f97316", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {ambassadors.filter(a => a.status === "pending").length}
                </span>
              )}
            </button>
            <button onClick={() => { setAdminTab("commissions"); loadCommissions(); }} style={{ background: adminTab === "commissions" ? "#1a6ed8" : "#334155", border: "none", color: adminTab === "commissions" ? "#fff" : "#94a3b8", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 700 }}>💰 Commissions</button>
            <button onClick={() => { setAdminTab("blog"); loadBlogPosts(); }} style={{ background: adminTab === "blog" ? "#1a6ed8" : "#334155", border: "none", color: adminTab === "blog" ? "#fff" : "#94a3b8", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 700 }}>📝 Blog</button>
            <button onClick={() => adminTab === "orders" ? loadOrders() : adminTab === "commissions" ? loadCommissions() : adminTab === "blog" ? loadBlogPosts() : loadAmbassadors()} style={{ background: "#334155", border: "none", color: "#94a3b8", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>↻ Refresh</button>
            <button onClick={() => goTo("store")} style={{ ...btnPrimary({ padding: "8px 16px", fontSize: 13, borderRadius: 8 }) }}>← Store</button>
            <button onClick={() => { try { sessionStorage.removeItem("aet_admin_token"); } catch {} setAuthed(false); setAdminToken(""); }} style={{ background: "#3b0000", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
          </div>
        </div>

        <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>

          {/* ── AMBASSADORS TAB ── */}
          {adminTab === "ambassadors" && (
            <div>
              {/* Create Ambassador Button + Form */}
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => { setShowCreateAmb(v => !v); setCreateAmbMsg(""); }}
                  style={{ ...btnPrimary({ padding: "10px 20px", fontSize: 13, borderRadius: 10 }), background: showCreateAmb ? "#334155" : "#1a6ed8" }}
                >
                  {showCreateAmb ? "✕ Cancel" : "+ Create Ambassador"}
                </button>

                {showCreateAmb && (
                  <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: "24px", marginTop: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc", marginBottom: 16 }}>Create Ambassador Account</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      {[
                        ["Full Name *", "name", "text", "Jane Smith"],
                        ["Email Address *", "email", "email", "jane@example.com"],
                        ["Instagram / Platform", "instagram", "text", "@handle (optional)"],
                        ["Promo Code *", "code", "text", "e.g. JANE20"],
                        ["Temporary Password *", "password", "text", "They can change this later"],
                        ["Commission %", "commission", "number", "20"],
                      ].map(([label, field, type, placeholder]) => (
                        <div key={field}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
                          <input
                            type={type}
                            value={createAmbForm[field]}
                            onChange={e => setCreateAmbForm(prev => ({ ...prev, [field]: field === "code" ? e.target.value.toUpperCase() : e.target.value }))}
                            placeholder={placeholder}
                            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <button
                        onClick={createAmbassador}
                        disabled={createAmbWorking}
                        style={{ ...btnPrimary({ padding: "11px 24px", fontSize: 13, borderRadius: 9 }), opacity: createAmbWorking ? 0.5 : 1 }}
                      >
                        {createAmbWorking ? "Creating…" : "✓ Create Ambassador"}
                      </button>
                      {createAmbMsg && (
                        <span style={{ fontSize: 13, fontWeight: 600, color: createAmbMsg.startsWith("✓") ? "#4ade80" : "#f87171" }}>{createAmbMsg}</span>
                      )}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                      After creating, email the ambassador their login link: <strong style={{ color: "#94a3b8" }}>aeterionpeptides.com/ambassador</strong> along with their email and temporary password.
                    </div>
                  </div>
                )}
              </div>

              {/* Ambassador Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
                {[
                  ["⏳", "Pending", ambassadors.filter(a => a.status === "pending").length],
                  ["✅", "Approved", ambassadors.filter(a => a.status === "approved").length],
                  ["💰", "Total Commissions", `$${ambassadors.reduce((s, a) => s + Number(a.total_commission_earned || 0), 0).toFixed(2)}`],
                  ["💸", "Unpaid", `$${ambassadors.reduce((s, a) => s + Math.max(0, Number(a.total_commission_earned || 0) - Number(a.total_commission_paid || 0)), 0).toFixed(2)}`],
                ].map(([icon, label, value]) => (
                  <div key={label} style={{ background: "#1e293b", borderRadius: 14, padding: "18px 20px", border: "1px solid #334155" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#f8fafc", marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>

              {ambLoading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Loading ambassadors…</div>
              ) : ambassadors.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>No applications yet. Share <strong style={{ color: "#94a3b8" }}>aeterionpeptides.com/ambassador/apply</strong> to get started.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {ambassadors.map(amb => {
                    const isOpen = ambExpanded === amb.id;
                    const unpaid = Math.max(0, Number(amb.total_commission_earned || 0) - Number(amb.total_commission_paid || 0));
                    const statusColor = amb.status === "approved" ? "#16a34a" : amb.status === "pending" ? "#f97316" : "#dc2626";
                    const form = approveForm[amb.id] || { code: "", password: "", commission: "20" };
                    const msg = ambMsg[amb.id] || "";
                    return (
                      <div key={amb.id} style={{ background: "#1e293b", borderRadius: 14, border: "1px solid #334155", overflow: "hidden" }}>
                        {/* Row header */}
                        <div onClick={() => setAmbExpanded(isOpen ? null : amb.id)} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                              <span style={{ fontWeight: 800, fontSize: 15 }}>{amb.name}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + "22", borderRadius: 20, padding: "2px 10px" }}>{amb.status.toUpperCase()}</span>
                              {amb.promo_code && <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", background: "#1e3a5f", borderRadius: 6, padding: "2px 8px" }}>{amb.promo_code}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{amb.email}{amb.instagram ? ` · ${amb.instagram}` : ""}{amb.audience_size ? ` · ${amb.audience_size} followers` : ""}</div>
                          </div>
                          <div style={{ textAlign: "right", marginRight: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Earned: ${Number(amb.total_commission_earned || 0).toFixed(2)}</div>
                            {unpaid > 0 && <div style={{ fontSize: 11, color: "#f97316", fontWeight: 600 }}>Unpaid: ${unpaid.toFixed(2)}</div>}
                          </div>
                          <span style={{ color: "#64748b", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                        </div>

                        {/* Expanded panel */}
                        {isOpen && (
                          <div style={{ borderTop: "1px solid #334155", padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                            {/* Left: application details */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Application</div>
                              <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>
                                <div><strong style={{ color: "#cbd5e1" }}>Applied:</strong> {new Date(amb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                                {amb.instagram && <div><strong style={{ color: "#cbd5e1" }}>Platform:</strong> {amb.instagram}</div>}
                                {amb.audience_size && <div><strong style={{ color: "#cbd5e1" }}>Audience:</strong> {amb.audience_size}</div>}
                                {amb.why_aeterion && (
                                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #1e293b" }}>
                                    <strong style={{ color: "#cbd5e1" }}>Why Aeterion:</strong><br />
                                    <span style={{ fontStyle: "italic" }}>{amb.why_aeterion}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: actions */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Actions</div>

                              {amb.status === "pending" && (
                                <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px" }}>
                                  <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700, marginBottom: 10 }}>Approve Ambassador</div>
                                  <input
                                    placeholder="Promo code (e.g. NASH20)"
                                    value={form.code}
                                    onChange={e => setApproveForm(prev => ({ ...prev, [amb.id]: { ...form, code: e.target.value.toUpperCase() } }))}
                                    style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
                                  />
                                  <input
                                    placeholder="Temporary password for ambassador"
                                    type="text"
                                    value={form.password}
                                    onChange={e => setApproveForm(prev => ({ ...prev, [amb.id]: { ...form, password: e.target.value } }))}
                                    style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
                                  />
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                    <span style={{ fontSize: 12, color: "#64748b" }}>Commission %</span>
                                    <input
                                      type="number" min="1" max="100"
                                      value={form.commission}
                                      onChange={e => setApproveForm(prev => ({ ...prev, [amb.id]: { ...form, commission: e.target.value } }))}
                                      style={{ width: 70, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: "#f8fafc", outline: "none", fontFamily: "inherit" }}
                                    />
                                  </div>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                      disabled={!form.code || !form.password || ambWorking === amb.id}
                                      onClick={() => ambAction("approve", amb.id, { promo_code: form.code, password: form.password, commission_rate: Number(form.commission) || 20 })}
                                      style={{ flex: 1, ...btnPrimary({ padding: "10px", fontSize: 13, borderRadius: 8 }), opacity: (!form.code || !form.password || ambWorking === amb.id) ? 0.5 : 1 }}
                                    >
                                      {ambWorking === amb.id ? "Working…" : "✓ Approve"}
                                    </button>
                                    <button
                                      disabled={ambWorking === amb.id}
                                      onClick={() => ambAction("reject", amb.id)}
                                      style={{ flex: 1, padding: "10px", background: "#3b0000", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: ambWorking === amb.id ? 0.5 : 1 }}
                                    >
                                      ✗ Reject
                                    </button>
                                  </div>
                                </div>
                              )}

                              {amb.status === "approved" && (
                                <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px" }}>
                                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                                    Code: <strong style={{ color: "#60a5fa" }}>{amb.promo_code}</strong>
                                  </div>
                                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, lineHeight: 1.6 }}>
                                    Total earned: <strong style={{ color: "#4ade80" }}>${Number(amb.total_commission_earned || 0).toFixed(2)}</strong><br />
                                    Total paid: <strong style={{ color: "#f8fafc" }}>${Number(amb.total_commission_paid || 0).toFixed(2)}</strong><br />
                                    {unpaid > 0 && <>Awaiting payout: <strong style={{ color: "#f97316" }}>${unpaid.toFixed(2)}</strong></>}
                                  </div>

                                  {/* Commission % editor */}
                                  <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #1e293b" }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Commission Rate</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <input
                                        type="number" min="1" max="100"
                                        value={approveForm[amb.id]?.commission ?? amb.commission_rate}
                                        onChange={e => setApproveForm(prev => ({ ...prev, [amb.id]: { ...(prev[amb.id] || {}), commission: e.target.value } }))}
                                        style={{ width: 70, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", fontSize: 14, fontWeight: 700, color: "#4ade80", outline: "none", fontFamily: "inherit", textAlign: "center" }}
                                      />
                                      <span style={{ fontSize: 13, color: "#64748b" }}>%  commission per sale</span>
                                      <button
                                        disabled={ambWorking === amb.id}
                                        onClick={() => ambAction("update_commission", amb.id, { commission_rate: Number(approveForm[amb.id]?.commission ?? amb.commission_rate) })}
                                        style={{ ...btnPrimary({ padding: "8px 14px", fontSize: 12, borderRadius: 8 }), marginLeft: "auto", opacity: ambWorking === amb.id ? 0.5 : 1 }}
                                      >
                                        {ambWorking === amb.id ? "Saving…" : "Save"}
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {unpaid > 0 && (
                                      <button
                                        disabled={ambWorking === amb.id}
                                        onClick={() => ambAction("mark_paid", amb.id)}
                                        style={{ ...btnPrimary({ padding: "9px 14px", fontSize: 12, borderRadius: 8 }), background: "#16a34a", opacity: ambWorking === amb.id ? 0.5 : 1 }}
                                      >
                                        {ambWorking === amb.id ? "Working…" : `✓ Mark $${unpaid.toFixed(2)} as Paid`}
                                      </button>
                                    )}
                                    <button
                                      disabled={ambWorking === amb.id}
                                      onClick={() => ambAction("suspend", amb.id)}
                                      style={{ padding: "9px 14px", background: "#3b0000", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: ambWorking === amb.id ? 0.5 : 1 }}
                                    >
                                      Suspend
                                    </button>
                                    <button
                                      disabled={ambWorking === amb.id}
                                      onClick={() => { if (window.confirm(`Permanently delete ${amb.name}? This also deletes all their commissions.`)) ambAction("delete_ambassador", amb.id); }}
                                      style={{ padding: "9px 14px", background: "#1a0000", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: ambWorking === amb.id ? 0.5 : 1 }}
                                    >
                                      🗑 Delete
                                    </button>
                                  </div>
                                </div>
                              )}

                              {amb.status === "suspended" && (
                                <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px 16px" }}>
                                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
                                    This ambassador is suspended.
                                  </div>
                                  <button
                                    disabled={ambWorking === amb.id}
                                    onClick={() => ambAction("reactivate", amb.id)}
                                    style={{ ...btnPrimary({ padding: "9px 14px", fontSize: 12, borderRadius: 8 }), background: "#16a34a", opacity: ambWorking === amb.id ? 0.5 : 1 }}
                                  >
                                    {ambWorking === amb.id ? "Working…" : "↺ Reactivate"}
                                  </button>
                                </div>
                              )}

                              {msg && (
                                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: msg.startsWith("✓") ? "#4ade80" : "#f87171" }}>{msg}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ORDERS TAB ── */}
          {adminTab === "orders" && (<div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
            {[
              ["📦", "Total Orders", orders.length],
              ["💰", "Total Revenue", `$${(totalRevenue/100).toFixed(2)}`],
              ["🔬", "Processing", orders.filter(o=>o.status==="processing").length],
              ["🚚", "Shipped", orders.filter(o=>o.status==="shipped").length],
              ["✅", "Delivered", orders.filter(o=>o.status==="delivered").length],
            ].map(([icon, label, value]) => (
              <div key={label} style={{ background: "#1e293b", borderRadius: 14, padding: "18px 20px", border: "1px solid #334155" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#f8fafc", marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders, customers…"
              style={{ flex: 1, minWidth: 200, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#f8fafc", outline: "none", fontFamily: "inherit" }} />
            {["all","processing","shipped","delivered","refunded"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: "10px 16px", borderRadius: 10, border: "1px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
                background: statusFilter === s ? "#1a6ed8" : "#1e293b",
                color: statusFilter === s ? "#fff" : "#64748b",
                borderColor: statusFilter === s ? "#1a6ed8" : "#334155",
              }}>{s}</button>
            ))}
          </div>

          {/* Orders */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontSize: 16 }}>Loading orders…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontSize: 16 }}>No orders found</div>
          ) : filtered.map(order => {
            const isOpen = expanded === order.id;
            const [sbg, scol, sborder] = statusColors[order.status] || statusColors.processing;
            const addr = order.shipping_address;
            const addressStr = addr ? `${addr.line1}${addr.line2?", "+addr.line2:""}, ${addr.city}, ${addr.state} ${addr.postal_code}` : "N/A";
            return (
              <div key={order.id} style={{ background: "#1e293b", borderRadius: 14, border: "1px solid #334155", marginBottom: 12, overflow: "hidden" }}>
                {/* Row */}
                <div onClick={() => setExpanded(isOpen ? null : order.id)}
                  style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#60a5fa" }}>{order.order_number}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div style={{ flex: 2, minWidth: 160 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{order.customer_name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{order.customer_email}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#4ade80", minWidth: 80, textAlign: "right" }}>${(order.total/100).toFixed(2)}</div>
                  <div style={{ background: sbg, color: scol, border: `1px solid ${sborder}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800, textTransform: "capitalize" }}>{order.status}</div>
                  <div style={{ color: "#64748b", fontSize: 18 }}>{isOpen ? "▲" : "▼"}</div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #334155", padding: "20px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {/* Left: customer + items */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Customer Info</div>
                      <div style={{ background: "#0f172a", borderRadius: 10, padding: "14px", marginBottom: 16, fontSize: 13, lineHeight: 1.8 }}>
                        <div><span style={{ color: "#64748b" }}>📱 </span>{order.customer_phone || "N/A"}</div>
                        <div><span style={{ color: "#64748b" }}>📧 </span><a href={`mailto:${order.customer_email}`} style={{ color: "#60a5fa", textDecoration: "none" }}>{order.customer_email}</a></div>
                        <div><span style={{ color: "#64748b" }}>📦 </span>{addressStr}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Items</div>
                      <div style={{ background: "#0f172a", borderRadius: 10, overflow: "hidden" }}>
                        {(order.items || []).map((item, i) => (
                          <div key={i} style={{ padding: "10px 14px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span>{item.description} × {item.quantity}</span>
                            <span style={{ color: "#4ade80", fontWeight: 700 }}>${(item.amount_total/100).toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800 }}>
                          <span>Total</span>
                          <span style={{ color: "#4ade80" }}>${(order.total/100).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: status + tracking + notes */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Update Status</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                        {["processing","shipped","delivered","refunded"].map(s => (
                          <button key={s} onClick={() => updateOrder(order.id, { status: s })}
                            disabled={updating === order.id}
                            style={{
                              padding: "10px", borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
                              background: order.status === s ? "#1a6ed8" : "#0f172a",
                              color: order.status === s ? "#fff" : "#94a3b8",
                              borderColor: order.status === s ? "#1a6ed8" : "#334155",
                              opacity: updating === order.id ? 0.5 : 1,
                            }}>{s}</button>
                        ))}
                      </div>

                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Tracking Number</div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <input
                          value={trackingInputs[order.id] !== undefined ? trackingInputs[order.id] : (order.tracking || "")}
                          onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                          placeholder="Enter tracking number…"
                          style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#f8fafc", outline: "none", fontFamily: "inherit" }}
                        />
                        <button onClick={() => updateOrder(order.id, { tracking: trackingInputs[order.id] || order.tracking })}
                          disabled={updating === order.id}
                          style={{ ...btnPrimary({ padding: "10px 14px", fontSize: 12, borderRadius: 8 }), opacity: updating === order.id ? 0.5 : 1 }}>Save</button>
                      </div>

                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Admin Notes</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <textarea
                          value={notesInputs[order.id] !== undefined ? notesInputs[order.id] : (order.notes || "")}
                          onChange={e => setNotesInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                          placeholder="Internal notes…"
                          rows={3}
                          style={{ flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#f8fafc", outline: "none", fontFamily: "inherit", resize: "vertical" }}
                        />
                        <button onClick={() => updateOrder(order.id, { notes: notesInputs[order.id] || order.notes })}
                          disabled={updating === order.id}
                          style={{ ...btnPrimary({ padding: "10px 14px", fontSize: 12, borderRadius: 8, alignSelf: "flex-start" }), opacity: updating === order.id ? 0.5 : 1 }}>Save</button>
                      </div>

                      <button
                        style={{ marginTop: 16, width: "100%", padding: "10px", background: "#1a0000", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                        onClick={async () => {
                          if (!window.confirm(`Delete order ${order.order_number}? This cannot be undone.`)) return;
                          const r = await fetch("/api/ambassador/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_token: adminToken, action: "delete_order", order_id: order.id }) });
                          const d = await r.json();
                          if (d.success) { await loadOrders(); } else { alert("Delete failed: " + d.error); }
                        }}
                      >🗑 Delete Order</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
        </div>

      {/* ── COMMISSIONS TAB ── */}
      {adminTab === "commissions" && (
        <div style={{ padding: "0 24px 24px" }}>
          {commissions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>No commission records found.</div>
          ) : (
            <div style={{ background: "#1e293b", borderRadius: 12, overflow: "hidden", border: "1px solid #334155" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#0f172a" }}>
                    {["Date", "Ambassador", "Customer", "Order Value", "Commission", "Code", "Status", ""].map(h => (
                      <th key={h} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textAlign: "left", textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: "1px solid #334155", background: i % 2 === 0 ? "#1e293b" : "#0f172a" }}>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700 }}>{c.ambassadors?.name || c.ambassador_id?.slice(0,8)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#94a3b8" }}>{c.customer_email}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700 }}>${Number(c.order_subtotal).toFixed(2)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 800, color: "#4ade80" }}>${Number(c.commission_amount).toFixed(2)}</td>
                      <td style={{ padding: "12px 14px" }}><span style={{ background: "#1e3a5f", color: "#60a5fa", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{c.promo_code}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ background: c.status === "paid" ? "#14532d" : "#422006", color: c.status === "paid" ? "#4ade80" : "#fb923c", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{c.status}</span></td>
                      <td style={{ padding: "12px 14px" }}>
                        <button onClick={() => deleteCommission(c.id)} style={{ background: "#1a0000", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── BLOG TAB ── */}
      {adminTab === "blog" && (
        <div style={{ padding: "0 24px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

            {/* ── Editor ── */}
            <div style={{ background: "#1e293b", borderRadius: 14, border: "1px solid #334155", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>{blogEditing ? "✏️ Edit Post" : "✏️ New Post"}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setBlogPreview(p => !p)} style={{ background: blogPreview ? "#1a6ed8" : "#334155", border: "none", color: blogPreview ? "#fff" : "#94a3b8", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {blogPreview ? "✏️ Edit" : "👁 Preview"}
                  </button>
                  {blogEditing && (
                    <button onClick={() => { setBlogEditing(null); setBlogForm({ title: "", excerpt: "", body: "", cover_url: "", tags: "", published: false }); setBlogMsg(""); }}
                      style={{ background: "#334155", border: "none", color: "#94a3b8", padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✕ Cancel</button>
                  )}
                </div>
              </div>

              {blogPreview ? (
                <div style={{ padding: "24px", minHeight: 400 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Preview</div>
                  {blogForm.cover_url && <img src={blogForm.cover_url} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 10, marginBottom: 20 }} />}
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#f8fafc", marginBottom: 10, letterSpacing: "-0.5px" }}>{blogForm.title || "Untitled"}</div>
                  {blogForm.tags && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>{blogForm.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => <span key={t} style={{ fontSize: 10, fontWeight: 800, color: "#60a5fa", background: "rgba(26,110,216,0.12)", border: "1px solid rgba(26,110,216,0.25)", borderRadius: 20, padding: "3px 10px", textTransform: "uppercase", letterSpacing: 1 }}>{t}</span>)}</div>}
                  <div style={{ fontSize: 14, color: "#94a3b8", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{blogForm.body || "No content yet…"}</div>
                </div>
              ) : (
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Title *</div>
                    <input value={blogForm.title} onChange={e => setBlogForm(f => ({...f, title: e.target.value}))}
                      placeholder="e.g. BPC-157: The Complete Research Guide"
                      style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "11px 14px", fontSize: 16, color: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Excerpt <span style={{ color: "#475569", fontWeight: 400, textTransform: "none" }}>(shown on blog card)</span></div>
                    <input value={blogForm.excerpt} onChange={e => setBlogForm(f => ({...f, excerpt: e.target.value}))}
                      placeholder="Short description for the blog listing…"
                      style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "11px 14px", fontSize: 16, color: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Body *</div>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>Supports: # H1, ## H2, ### H3, - bullet lists, {">"} blockquote, blank line = new paragraph</div>
                    <textarea value={blogForm.body} onChange={e => setBlogForm(f => ({...f, body: e.target.value}))}
                      placeholder={"## Introduction\n\nBPC-157 is one of the most researched peptides...\n\n## Mechanism of Action\n\n- Upregulates growth factor receptors\n- Promotes angiogenesis\n- Modulates nitric oxide production"}
                      rows={14}
                      style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "11px 14px", fontSize: 13, color: "#f8fafc", outline: "none", fontFamily: "monospace", boxSizing: "border-box", resize: "vertical", lineHeight: 1.7 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Cover Image URL</div>
                      <input value={blogForm.cover_url} onChange={e => setBlogForm(f => ({...f, cover_url: e.target.value}))}
                        placeholder="https://..."
                        style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "11px 14px", fontSize: 16, color: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Tags <span style={{ color: "#475569", fontWeight: 400, textTransform: "none" }}>(comma separated)</span></div>
                      <input value={blogForm.tags} onChange={e => setBlogForm(f => ({...f, tags: e.target.value}))}
                        placeholder="BPC-157, Recovery, Healing"
                        style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "11px 14px", fontSize: 16, color: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <div onClick={() => setBlogForm(f => ({...f, published: !f.published}))}
                        style={{ width: 44, height: 24, borderRadius: 99, background: blogForm.published ? "#16a34a" : "#334155", position: "relative", transition: "background .2s", cursor: "pointer" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: blogForm.published ? 23 : 3, transition: "left .2s" }}/>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: blogForm.published ? "#4ade80" : "#64748b" }}>{blogForm.published ? "Published" : "Draft"}</span>
                    </label>
                    <div style={{ flex: 1 }}/>
                    <button onClick={saveBlogPost} disabled={blogWorking}
                      style={{ background: "linear-gradient(135deg,#1a6ed8,#2563eb)", border: "none", color: "#fff", padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: blogWorking ? 0.6 : 1 }}>
                      {blogWorking ? "Saving…" : blogEditing ? "Update Post" : "Publish Post"}
                    </button>
                  </div>
                  {blogMsg && <div style={{ fontSize: 13, fontWeight: 700, color: blogMsg.startsWith("✓") ? "#4ade80" : "#f87171" }}>{blogMsg}</div>}
                </div>
              )}
            </div>

            {/* ── Post list ── */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Published Posts ({blogPosts.length})</div>
              {blogPosts.length === 0 ? (
                <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 24, textAlign: "center", color: "#475569", fontSize: 13 }}>No posts yet. Write your first one!</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {blogPosts.map(post => (
                    <div key={post.id} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 20, padding: "2px 8px", background: post.published ? "#14532d" : "#422006", color: post.published ? "#4ade80" : "#fb923c" }}>{post.published ? "Live" : "Draft"}</span>
                            <span style={{ fontSize: 11, color: "#475569" }}>{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => editBlogPost(post)} style={{ background: "#334155", border: "none", color: "#94a3b8", padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                          <button onClick={() => window.open(`/blog/${post.slug}`, '_blank')} style={{ background: "#1e3a5f", border: "none", color: "#60a5fa", padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>View</button>
                          <button onClick={() => deleteBlogPost(post.id)} style={{ background: "#1a0000", border: "1px solid #7f1d1d", color: "#f87171", padding: "6px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Blog link */}
              <div style={{ marginTop: 16, padding: "12px 16px", background: "#0f172a", borderRadius: 10, border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#475569" }}>Public blog</span>
                <a href="/blog" target="_blank" style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700, textDecoration: "none" }}>aeterionpeptides.com/blog →</a>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    );
  };

  /* ════════════════════ AUTH PAGES ════════════════════ */
  const AuthInput = ({ label, type="text", value, onChange, placeholder, onKeyDown }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
        style={{ width: "100%", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "13px 16px", fontSize: 15, color: T.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .15s, box-shadow .15s" }}
        onFocus={e => { e.target.style.borderColor = T.blue; e.target.style.boxShadow = "0 0 0 3px rgba(26,110,216,0.1)"; }}
        onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
      />
    </div>
  );

  const AuthLayout = ({ children, wide }) => (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100vh", display: "flex", background: "#f8fafc" }}>
      {/* Left panel — branding (desktop only) */}
      {!mob && (
        <div style={{ width: 420, background: "linear-gradient(145deg,#0f4fa8 0%,#1a6ed8 60%,#3b82f6 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 44px", flexShrink: 0 }}>
          <div onClick={() => goTo("store")} style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>AETERION</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: 0.5 }}>LABS</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>Research-grade peptides delivered to your door.</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>Create an account to track your orders, save your shipping address, and view your purchase history.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[["COA with every order"],["Cold-packed shipping"],["79 research compounds"],["Free shipping over $250"]].map(([text]) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#60a5fa", flexShrink: 0, display: "inline-block" }} /><span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Right panel — form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: mob ? "32px 20px" : "48px 40px" }}>
        <div style={{ width: "100%", maxWidth: wide ? 520 : 420 }}>
          {mob && (
            <div onClick={() => goTo("store")} style={{ cursor: "pointer", marginBottom: 32, textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: T.blue, textTransform: "uppercase" }}>AETERION</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>LABS</div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );

  const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
      if (!email || !password) { setErr("Please fill in all fields."); return; }
      setLoading(true); setErr("");
      const data = await sbSignIn({ email, password });
      if (data.access_token) {
        const session = { access_token: data.access_token, id: data.user.id, email: data.user.email, full_name: data.user.user_metadata?.full_name || email.split("@")[0] };
        saveSession(session);
        setUser(session);
        goTo("store");
      } else {
        setErr(data.error_description || data.message || "Invalid email or password.");
      }
      setLoading(false);
    };

    return (
      <AuthLayout>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: T.text, marginBottom: 6 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: T.sub }}>Sign in to your Aeterion account</div>
        </div>
        <AuthInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        <AuthInput label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
          onKeyDown={e => e.key === "Enter" && handleLogin()} />
        {err && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#dc2626", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ {err}
          </div>
        )}
        <button onClick={handleLogin} disabled={loading}
          style={{ ...btnPrimary({ width: "100%", padding: "15px", fontSize: 15, borderRadius: 12, boxShadow: "0 4px 14px rgba(26,110,216,0.3)" }), opacity: loading ? 0.7 : 1, marginBottom: 20 }}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>
        <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 14, color: T.sub }}>Don't have an account? </span>
          <span onClick={() => goTo("signup")} style={{ color: T.blue, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Create one</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <span onClick={() => goTo("store")} style={{ fontSize: 13, color: T.muted, cursor: "pointer" }}>← Continue as guest</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 12, color: T.muted }}>Are you an ambassador? </span>
          <a href="/ambassador" style={{ fontSize: 12, color: T.blue, fontWeight: 600, textDecoration: "none" }}>Sign in to your portal →</a>
        </div>
      </AuthLayout>
    );
  };

  const SignupPage = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
      if (!fullName || !email || !password) { setErr("Please fill in all fields."); return; }
      if (password !== confirm) { setErr("Passwords do not match."); return; }
      if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
      setLoading(true); setErr("");
      const data = await sbSignUp({ email, password, fullName });
      if (data.id || data.user?.id) {
        setSuccess(true);
      } else {
        setErr(data.error_description || data.message || "Something went wrong. Please try again.");
      }
      setLoading(false);
    };

    if (success) return (
      <AuthLayout>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 72, height: 72, background: "#f0fdf4", border: "3px solid #86efac", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#16a34a", margin: "0 auto 24px" }}>SENT</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: T.text, marginBottom: 10 }}>Check your email</div>
          <div style={{ fontSize: 14, color: T.sub, lineHeight: 1.7, marginBottom: 32 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and sign in.
          </div>
          <button onClick={() => goTo("login")} style={{ ...btnPrimary({ width: "100%", padding: "15px", fontSize: 15, borderRadius: 12 }) }}>Go to Sign In →</button>
        </div>
      </AuthLayout>
    );

    return (
      <AuthLayout>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: T.text, marginBottom: 6 }}>Create account</div>
          <div style={{ fontSize: 14, color: T.sub }}>Track orders, save your address, and more</div>
        </div>
        <AuthInput label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" />
        <AuthInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <AuthInput label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 chars" />
          <AuthInput label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat" />
        </div>
        {err && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#dc2626", marginBottom: 18 }}>
            ⚠️ {err}
          </div>
        )}
        <button onClick={handleSignup} disabled={loading}
          style={{ ...btnPrimary({ width: "100%", padding: "15px", fontSize: 15, borderRadius: 12, boxShadow: "0 4px 14px rgba(26,110,216,0.3)" }), opacity: loading ? 0.7 : 1, marginBottom: 20 }}>
          {loading ? "Creating account…" : "Create Account →"}
        </button>
        <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 14, color: T.sub }}>Already have an account? </span>
          <span onClick={() => goTo("login")} style={{ color: T.blue, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Sign In</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <span onClick={() => goTo("store")} style={{ fontSize: 13, color: T.muted, cursor: "pointer" }}>← Continue as guest</span>
        </div>
      </AuthLayout>
    );
  };

  const AccountPage = () => {
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState({ full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [tab, setTab] = useState("orders");
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
      if (!authReady) return;
      if (!user) { goTo("login"); return; }
      Promise.all([
        sbGetMyOrders(user.access_token, user.id),
        sbGetProfile(user.access_token),
      ]).then(([ords, prof]) => {
        setOrders(Array.isArray(ords) ? ords : []);
        if (prof) setProfile(prev => ({ ...prev, ...prof }));
        setLoading(false);
      });
    }, []);

    const saveProfile = async () => {
      setSaving(true);
      await sbSaveProfile(user.access_token, user.id, profile);
      setSaving(false); setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    };

    const logout = async () => {
      await sbSignOut(user.access_token);
      clearSession(); setUser(null); goTo("store");
    };

    const statusColors = { processing: ["#fff7ed","#f97316"], shipped: ["#eff6ff","#1a6ed8"], delivered: ["#f0fdf4","#16a34a"], refunded: ["#fef2f2","#dc2626"] };

    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
        {/* Header */}
        <div style={{ background: T.blue, padding: "9px 24px", fontSize: 11.5, color: "rgba(255,255,255,0.9)", textAlign: "center", fontWeight: 500 }}>
          Free shipping on orders over $250 · COA with every order
        </div>
        <div style={{ background: "#fff", borderBottom: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => goTo("store")} style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2.5, color: T.blue, textTransform: "uppercase" }}>AETERION</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.text, letterSpacing: 0.5 }}>LABS</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: T.sub }}>Hi, {user?.full_name?.split(" ")[0] || "there"}</span>
            <button onClick={logout} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: T.sub, fontFamily: "inherit" }}>Sign Out</button>
            <button onClick={() => goTo("store")} style={{ ...btnPrimary({ padding: "8px 16px", fontSize: 13, borderRadius: 10 }) }}>← Store</button>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: mob ? "24px 16px" : "36px 24px" }}>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>My Account</div>
          <div style={{ fontSize: 13, color: T.sub, marginBottom: 28 }}>{user?.email}</div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#f1f5f9", borderRadius: 12, padding: 4 }}>
            {[["orders","Orders"],["profile","Profile & Address"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                background: tab === id ? "#fff" : "transparent",
                color: tab === id ? T.blue : T.sub,
                boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>{label}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: T.sub }}>Loading…</div>
          ) : tab === "orders" ? (
            <div>
              {orders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>ORDERS</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No orders yet</div>
                  <div style={{ fontSize: 13, color: T.sub, marginBottom: 20 }}>Your order history will appear here.</div>
                  <button onClick={() => goTo("store")} style={{ ...btnPrimary({ padding: "12px 28px", fontSize: 14, borderRadius: 10 }) }}>Start Shopping</button>
                </div>
              ) : orders.map(order => {
                const isOpen = expanded === order.id;
                const [sbg, scol] = statusColors[order.status] || statusColors.processing;
                return (
                  <div key={order.id} style={{ background: "#fff", borderRadius: 14, border: `1px solid ${T.border}`, marginBottom: 12, overflow: "hidden" }}>
                    <div onClick={() => setExpanded(isOpen ? null : order.id)} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: T.blue }}>{order.order_number}</div>
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900 }}>${(order.total/100).toFixed(2)}</div>
                      <div style={{ background: sbg, color: scol, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800, textTransform: "capitalize" }}>{order.status}</div>
                      <div style={{ color: T.muted }}>{isOpen ? "▲" : "▼"}</div>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px 20px" }}>
                        {order.tracking && (
                          <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 16px", marginBottom: 14, border: "1px solid #bbf7d0" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", marginBottom: 4 }}>Tracking Number</div>
                            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "monospace" }}>{order.tracking}</div>
                          </div>
                        )}
                        {(order.items || []).map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                            <span>{item.description} × {item.quantity}</span>
                            <span style={{ fontWeight: 700 }}>${(item.amount_total/100).toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 15, fontWeight: 800 }}>
                          <span>Total</span><span style={{ color: T.blue }}>${(order.total/100).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${T.border}`, padding: "28px 28px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>Shipping Address</div>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
                {[
                  ["Full Name","full_name","text","John Smith"],
                  ["Phone","phone","tel","(123) 456-7890"],
                  ["Address Line 1","address_line1","text","123 Main St"],
                  ["Address Line 2","address_line2","text","Apt 4B (optional)"],
                  ["City","city","text","Houston"],
                  ["State","state","text","TX"],
                  ["ZIP Code","postal_code","text","77001"],
                ].map(([label, key, type, placeholder]) => (
                  <div key={key} style={key === "address_line1" || key === "full_name" ? { gridColumn: mob ? "1" : "1 / -1" } : {}}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6 }}>{label}</div>
                    <input type={type} value={profile[key] || ""} onChange={e => setProfile(prev => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder}
                      style={{ width: "100%", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, color: T.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                      onFocus={e => e.target.style.borderColor = T.blue}
                      onBlur={e => e.target.style.borderColor = T.border}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={saveProfile} disabled={saving} style={{ ...btnPrimary({ padding: "12px 28px", fontSize: 14, borderRadius: 10 }), opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving…" : "Save Address"}
                </button>
                {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>Saved!</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ════════════════════ CONTACT PAGE ════════════════════ */
  const ContactPage = () => (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
      <div style={{ background: T.blue, padding: "9px 24px", fontSize: 11.5, color: "rgba(255,255,255,0.9)", textAlign: "center", fontWeight: 500 }}>
        Free shipping on orders over $250 · COA with every order
      </div>
      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 300, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "13px 24px", display: "flex", alignItems: "center", gap: 20 }}>
          <div onClick={() => goTo("store")} style={{ cursor: "pointer" }}>
            <AeterionLogo size={40} showText={!mob} textColor={T.text}/>
          </div>
          <button onClick={() => goTo("store")} style={{ ...btnOutline({ marginLeft: "auto", padding: "8px 18px", fontSize: 13, borderRadius: 10 }) }}>← Back to Store</button>
        </div>
      </header>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: mob ? "32px 20px 60px" : "56px 24px 80px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: T.blue, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Get in Touch</div>
          <h1 style={{ fontSize: mob ? 32 : 40, fontWeight: 900, margin: "0 0 12px", color: T.text, letterSpacing: -1 }}>Contact Us</h1>
          <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.75, margin: 0 }}>Questions about orders, wholesale pricing, or research protocols? Our team typically responds within 24 hours.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 32 }}>
          {[["Email","info@aeterionpeptides.com"],["Response Time","Within 24 hours"],["Location","USA Domestic"],["Hours","Mon–Fri, 9am–6pm EST"]].map(([label,value]) => (
            <div key={label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: T.shadow }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginTop: 2 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, padding: mob ? "24px 20px" : "36px 40px", boxShadow: T.shadow }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 22px", color: T.text }}>Send a Message</h2>
          {contactSent ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "3px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontWeight: 900, fontSize: 28, color: "#16a34a" }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>Message Sent!</div>
              <div style={{ fontSize: 14, color: T.sub, marginBottom: 24 }}>We'll get back to you within 24 hours.</div>
              <button onClick={() => setContactSent(false)} style={{ ...btnOutline({ padding: "10px 24px", fontSize: 13, borderRadius: 10 }) }}>Send Another</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 14 }}>
                {[["name","Your Name","text"],["email","Email Address","email"]].map(([field, ph, type]) => (
                  <div key={field}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{ph}</label>
                    <input type={type} value={contactForm[field]} onChange={e => setContactForm(f => ({...f, [field]: e.target.value}))} placeholder={ph}
                      style={{ width: "100%", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", color: T.text, fontFamily: "inherit", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = T.blue}
                      onBlur={e => e.target.style.borderColor = T.border} />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Subject</label>
                <select value={contactForm.subject} onChange={e => setContactForm(f => ({...f, subject: e.target.value}))}
                  style={{ width: "100%", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", color: contactForm.subject ? T.text : T.muted, fontFamily: "inherit", cursor: "pointer" }}>
                  <option value="">Select a subject…</option>
                  <option>Order Inquiry</option>
                  <option>Wholesale / Bulk Pricing</option>
                  <option>Product / Research Question</option>
                  <option>Shipping Question</option>
                  <option>COA / Lab Report</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Message</label>
                <textarea value={contactForm.message} onChange={e => setContactForm(f => ({...f, message: e.target.value}))} placeholder="Describe your inquiry…" rows={5}
                  style={{ width: "100%", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", color: T.text, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = T.blue}
                  onBlur={e => e.target.style.borderColor = T.border} />
              </div>
              <button onClick={() => { if (contactForm.name && contactForm.email && contactForm.message) setContactSent(true); }}
                style={{ ...btnPrimary({ padding: "14px", fontSize: 14, borderRadius: 12, boxShadow: "0 4px 14px rgba(26,110,216,0.28)" }) }}>
                Send Message →
              </button>
              <p style={{ fontSize: 11, color: T.muted, textAlign: "center", margin: 0 }}>By submitting, you confirm you are 18+ and purchasing for research purposes only.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ════════════════════ LEGAL / DISCLAIMER PAGE ════════════════════ */
  const LegalPage = () => {
    const sections = [
      { id: "disclaimer", title: "Research Use Disclaimer", icon: "⚠️", content: [
        "All products sold by Aeterion Peptides are strictly intended for laboratory and in vitro research purposes only. These compounds are not approved by the U.S. Food and Drug Administration (FDA) or any other regulatory authority for human or veterinary use, consumption, or therapeutic application.",
        "By purchasing any product from aeterionpeptides.com, you affirm that you are a qualified researcher, scientist, or laboratory professional purchasing these compounds solely for scientific research purposes. You must be at least 18 years of age to purchase.",
        "Aeterion Peptides makes no claims that any of its products are safe, effective, or appropriate for use in humans or animals. We expressly disclaim any responsibility for any harm, injury, or adverse outcome resulting from misuse of our products.",
      ]},
      { id: "terms", title: "Terms of Service", icon: "", content: [
        "By accessing and using aeterionpeptides.com, you agree to be bound by these Terms of Service. All sales are final. Orders cannot be cancelled once processed. We reserve the right to refuse service to anyone for any reason.",
        "All pricing is in USD and subject to change without notice. Bulk discount tiers (5 units: 8% off; 10 units: 18% off) are applied automatically at checkout and cannot be combined with other promotional offers.",
        "Aeterion Peptides reserves the right to modify these terms at any time. Continued use of the website constitutes acceptance of the modified terms. We reserve the right to limit quantities per order at our discretion.",
      ]},
      { id: "shipping", title: "Shipping Policy", icon: "", content: [
        "We ship domestically within the USA only. Orders are processed within 1–2 business days of payment confirmation, Monday through Friday. Delivery typically takes 1–2 weeks. Free shipping is offered on orders exceeding $250.00 USD before taxes.",
        "Aeterion Peptides is not responsible for delays caused by carrier issues, weather events, or customs processing. Tracking information will be provided via email once your order ships. We do not ship to PO boxes.",
        "All peptide compounds are shipped with appropriate cold-packing to preserve integrity during transit. Lyophilized (freeze-dried) compounds are stable at room temperature for short transit periods but should be stored at -20°C upon receipt.",
      ]},
      { id: "returns", title: "Return Policy", icon: "↩️", content: [
        "Due to the nature of research chemicals and the importance of maintaining chain of custody, all sales are considered final. We do not accept returns or exchanges on any products once shipped.",
        "If you receive a product that is damaged, incorrect, or does not match the Certificate of Analysis, please contact info@aeterionpeptides.com within 48 hours of delivery with photographic evidence and your order number.",
        "Aeterion Peptides will investigate all legitimate claims and may, at its sole discretion, offer replacement product or store credit. We reserve the right to request the return of allegedly defective product before issuing any remedy.",
      ]},
      { id: "privacy", title: "Privacy Policy", icon: "", content: [
        "We collect personal information (name, email, shipping address, payment data) solely for the purpose of processing and fulfilling your order. We do not sell, rent, or share your personal information with third parties, except as necessary to complete your transaction (e.g., payment processors, shipping carriers).",
        "Payment processing is handled by Stripe, a PCI-DSS compliant payment processor. Aeterion Peptides does not store your full credit card information on our servers. All transactions are encrypted via TLS/SSL.",
        "We may retain your order history and contact information for customer service purposes. You may request deletion of your data by contacting info@aeterionpeptides.com. We comply with applicable U.S. privacy laws.",
      ]},
      { id: "coa", title: "Certificate of Analysis", icon: "", content: [
        "Every product sold by Aeterion Peptides is independently tested by a third-party laboratory using High Performance Liquid Chromatography (HPLC) and/or Mass Spectrometry (MS). A Certificate of Analysis (COA) confirming purity, identity, and batch number is included with every order.",
        "Our standard minimum purity threshold for all research peptides is ≥98%. Many compounds meet or exceed ≥99% purity. COA documents are batch-specific and reflect the actual product shipped with your order.",
        "If you require a copy of the COA for a previous order, please contact info@aeterionpeptides.com with your order number and we will provide the relevant documentation within 24 hours.",
      ]},
    ];

    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
        <div style={{ background: T.blue, padding: "9px 24px", fontSize: 11.5, color: "rgba(255,255,255,0.9)", textAlign: "center", fontWeight: 500 }}>
          Free shipping on orders over $250 · COA with every order
        </div>
        <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 300, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "13px 24px", display: "flex", alignItems: "center", gap: 20 }}>
            <div onClick={() => goTo("store")} style={{ cursor: "pointer" }}>
              <AeterionLogo size={40} showText={!mob} textColor={T.text}/>
            </div>
            <button onClick={() => goTo("store")} style={{ ...btnOutline({ marginLeft: "auto", padding: "8px 18px", fontSize: 13, borderRadius: 10 }) }}>← Back to Store</button>
          </div>
        </header>

        <div style={{ background: "linear-gradient(135deg,#1a6ed8 0%,#2563eb 60%,#3b82f6 100%)", padding: mob ? "36px 20px 32px" : "56px 24px 48px", textAlign: "center" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Legal & Compliance</div>
            <h1 style={{ fontSize: mob ? 28 : 38, fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: -1 }}>Policies & Disclaimer</h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", lineHeight: 1.75, margin: 0 }}>Last updated: March 2026. All products are for research use only.</p>
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: mob ? "28px 16px 60px" : "44px 24px 80px" }}>
          {/* Table of contents */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 32, boxShadow: T.shadow }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>Contents</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} style={{ background: T.blueSoft, color: T.blue, border: `1px solid #c7dcf9`, borderRadius: 20, padding: "5px 13px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>{s.icon} {s.title}</a>
              ))}
            </div>
          </div>

          {/* Big disclaimer banner */}
          <div style={{ background: "#fffbeb", border: "2px solid #fbbf24", borderRadius: 14, padding: "18px 22px", marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#92400e", marginBottom: 5 }}>FOR RESEARCH USE ONLY — NOT FOR HUMAN CONSUMPTION</div>
                <div style={{ fontSize: 13, color: "#a16207", lineHeight: 1.7 }}>All compounds sold by Aeterion Peptides are intended solely for in vitro research and laboratory use. They are not drugs, supplements, or food products. They have not been approved by the FDA. You must be 18 or older to purchase.</div>
              </div>
            </div>
          </div>

          {sections.map(s => (
            <section key={s.id} id={s.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: mob ? "22px 18px" : "28px 32px", marginBottom: 18, boxShadow: T.shadow, scrollMarginTop: 80 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{s.icon}</span> {s.title}
              </h2>
              {s.content.map((para, i) => (
                <p key={i} style={{ fontSize: 14, color: T.sub, lineHeight: 1.85, margin: i < s.content.length-1 ? "0 0 12px" : 0 }}>{para}</p>
              ))}
            </section>
          ))}

          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: T.muted, margin: "0 0 10px", lineHeight: 1.7 }}>Questions about our policies? Contact us at <strong style={{ color: T.text }}>info@aeterionpeptides.com</strong></p>
            <button onClick={() => goTo("contact")} style={{ ...btnOutline({ padding: "9px 22px", fontSize: 13, borderRadius: 10 }) }}>Contact Us</button>
          </div>
        </div>
      </div>
    );
  };


  /* ════════════════════ ABOUT PAGE ════════════════════ */
  const AboutPage = ({ goTo }) => (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 300, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => goTo("store")} style={{ cursor: "pointer" }}><AeterionLogo size={36} showText={true} textColor={T.text}/></div>
          <button onClick={() => goTo("store")} style={{ ...btnOutline({ padding: "8px 18px", fontSize: 13, borderRadius: 10 }) }}>← Back to Store</button>
        </div>
      </header>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: mob ? "32px 20px 60px" : "56px 40px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", background: T.blueSoft, borderRadius: 24, padding: "6px 20px", fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>About Aeterion Labs</div>
          <h1 style={{ fontSize: mob ? 30 : 42, fontWeight: 900, margin: "0 0 16px", color: T.text, letterSpacing: -1 }}>Research-Grade Peptides.<br/>Uncompromising Standards.</h1>
          <p style={{ fontSize: 16, color: T.sub, lineHeight: 1.8, margin: "0 auto", maxWidth: 600 }}>Aeterion Labs was founded with a single mission: give serious researchers access to the highest-purity peptides on the market — with full transparency, every time.</p>
        </div>

        {[
          { icon: "", title: "Who We Are", body: "Aeterion Labs is a US-based supplier of research-grade peptides, GLP-1 compounds, SARMs, nootropics, and analytical compounds. We serve independent researchers, university laboratory teams, and life science professionals who require consistent, verified-purity compounds for their work. Every product in our catalog has been independently tested by a third-party laboratory before being offered for sale." },
          { icon: "", title: "Our Quality Standard", body: "Every batch undergoes HPLC purity testing to ≥98–99% and mass spectrometry identity confirmation before it reaches our inventory. We provide a batch-specific Certificate of Analysis (COA) with every order — not a generic product COA, but documentation tied to the exact lot you receive. We don't ship compounds that don't meet our purity threshold. Full stop." },
          { icon: "", title: "Cold-Chain Fulfillment", body: "Lyophilized peptides are temperature-sensitive. Our fulfillment process uses cold-pack shipping for all peptide orders to preserve compound integrity from our facility to your lab. Orders are processed within 1–2 business days of confirmed payment, with tracking provided automatically via email. Delivery typically takes 1–2 weeks." },
          { icon: "", title: "Research Use Only", body: "All Aeterion Labs products are sold strictly for laboratory research purposes only. They are not intended for human consumption, medical treatment, or diagnostic use, and have not been evaluated by the FDA for these purposes. Our customers are researchers and scientists using these compounds to advance scientific understanding — not for personal use." },
          { icon: "", title: "Get in Touch", body: "Questions about a specific compound, wholesale pricing, bulk orders, or COA documentation? Our team responds within 24 hours. Email us at info@aeterionpeptides.com — or use the contact form on our site." },
        ].map(({ icon, title, body }) => (
          <div key={title} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: "28px 32px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 28 }}>{icon}</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>{title}</h2>
            </div>
            <p style={{ margin: 0, fontSize: 15, color: T.sub, lineHeight: 1.85 }}>{body}</p>
          </div>
        ))}

        <div style={{ background: "linear-gradient(135deg, #1B3A6B 0%, #2563eb 100%)", borderRadius: 20, padding: "36px 32px", textAlign: "center", marginTop: 16 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 900, color: "#fff" }}>Ready to Order?</h3>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.7 }}>Browse 79 research compounds with fast dispatch and COA included.</p>
          <button onClick={() => goTo("store")} style={{ ...btnPrimary({ padding: "13px 32px", fontSize: 15, borderRadius: 12, background: "#fff", color: "#1B3A6B" }) }}>Browse All Products →</button>
        </div>
      </div>
      <footer style={{ background: "#111827", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: 12 }}>
        <p style={{ margin: "0 0 6px" }}>© 2025 Aeterion Peptides. All Rights Reserved.</p>
        <p style={{ margin: 0 }}>All products for laboratory research purposes only. Not for human consumption. Must be 18+.</p>
      </footer>
    </div>
  );

  /* ════════════════════ FAQ PAGE ════════════════════ */
  const FAQPage = ({ goTo }) => {
    const [open, setOpen] = useState(null);
    const faqs = [
      { q: "Are these products legal to purchase?", a: "Yes. Research peptides are legal to purchase in the United States for laboratory research purposes. They are sold strictly as research chemicals — not for human consumption or therapeutic use. FDA-approved compounds (like semaglutide and tirzepatide) are provided for research use only, consistent with the research chemical market. Always ensure your use complies with local regulations." },
      { q: "What purity level are your peptides?", a: "All Aeterion Labs compounds are independently HPLC-tested to ≥98–99% purity with mass spectrometry identity confirmation. A batch-specific Certificate of Analysis (COA) is included with every order, tied to the exact lot number you receive — not a generic product-level COA." },
      { q: "How are peptides shipped?", a: "Lyophilized peptides are shipped cold-packed using insulated packaging to protect compound integrity during transit. All orders include full tracking. Orders are processed within 1–2 business days. We ship domestically from within the USA." },
      { q: "What is your shipping cost?", a: "Standard shipping is $15 per order. Orders over $250 qualify for free shipping, applied automatically at checkout. We do not currently offer international shipping." },
      { q: "Do you offer bulk or wholesale pricing?", a: "Yes — bulk discounts are applied automatically at checkout. 5 vials of any product receives an 8% discount. 10 vials receives an 18% discount. These apply across mixed products in the same category. For larger institutional or wholesale orders, contact us at info@aeterionpeptides.com." },
      { q: "What is bacteriostatic water and do I need it?", a: "Bacteriostatic water (BW) is the standard diluent for reconstituting lyophilized peptides in a research setting. It contains 0.9% benzyl alcohol which inhibits bacterial growth in multi-dose vials. We carry bacteriostatic water in our Ancillaries category. It is required for reconstituting all lyophilized peptide compounds." },
      { q: "How should I store my peptides?", a: "Lyophilized (un-reconstituted) peptides should be stored at -20°C in a sealed vial away from light. Under these conditions, most compounds maintain stability for 12–24 months. After reconstitution with bacteriostatic water, store at 2–8°C (refrigerated) and use within 28 days. Do not freeze reconstituted peptides." },
      { q: "Can I return or exchange an order?", a: "Due to the nature of research chemicals and cold-chain shipping requirements, we do not accept returns on opened products. If your order arrives damaged, contains the wrong product, or has a purity issue supported by your own third-party testing, contact us within 7 days of delivery at info@aeterionpeptides.com and we will resolve it." },
      { q: "How long does delivery take?", a: "Orders are processed within 1–2 business days of payment confirmation. Delivery typically takes 1–2 weeks. You will receive a tracking number by email as soon as your order ships." },
      { q: "Do you have a Certificate of Analysis for every product?", a: "Yes — every product in our catalog has been independently tested, and a COA is included with your order. Your COA will match the batch number on your product vial. If you need a COA before ordering, email info@aeterionpeptides.com with the product name and we can provide it in advance." },
      { q: "What payment methods do you accept?", a: "We accept all major credit and debit cards through our secure Stripe-powered checkout. Payments are encrypted and processed securely. We do not store payment information." },
      { q: "Do you offer military or first responder discounts?", a: "We recognize the service of military personnel, veterans, and first responders. Contact us at info@aeterionpeptides.com with verification and we will apply a discount to your order." },
    ];
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>
        <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 300, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div onClick={() => goTo("store")} style={{ cursor: "pointer" }}><AeterionLogo size={36} showText={true} textColor={T.text}/></div>
            <button onClick={() => goTo("store")} style={{ ...btnOutline({ padding: "8px 18px", fontSize: 13, borderRadius: 10 }) }}>← Back to Store</button>
          </div>
        </header>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: mob ? "32px 20px 60px" : "56px 40px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ display: "inline-flex", background: T.blueSoft, borderRadius: 24, padding: "6px 20px", fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>Help Center</div>
            <h1 style={{ fontSize: mob ? 30 : 40, fontWeight: 900, margin: "0 0 14px", color: T.text, letterSpacing: -1 }}>Frequently Asked Questions</h1>
            <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.8, margin: "0 auto", maxWidth: 520 }}>Everything you need to know about ordering, shipping, storage, and our quality standards.</p>
          </div>
          {faqs.map(({ q, a }, i) => (
            <div key={i} style={{ background: T.white, border: `1px solid ${open === i ? T.blue : T.border}`, borderRadius: 14, marginBottom: 12, overflow: "hidden", transition: "border-color 0.2s" }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, fontFamily: "inherit" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{q}</span>
                <span style={{ fontSize: 20, color: T.blue, flexShrink: 0, transition: "transform 0.2s", transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: "0 24px 22px", fontSize: 14, color: T.sub, lineHeight: 1.9, borderTop: `1px solid ${T.border}`, paddingTop: 18 }}>
                  {a}
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop: 36, background: T.blueSoft, borderRadius: 16, padding: "28px 32px", textAlign: "center", border: `1px solid ${T.blue}22` }}>
            
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: T.text }}>Still have questions?</h3>
            <p style={{ margin: "0 0 18px", fontSize: 14, color: T.sub }}>Our team responds within 24 hours.</p>
            <button onClick={() => goTo("contact")} style={{ ...btnPrimary({ padding: "11px 28px", fontSize: 14, borderRadius: 10 }) }}>Contact Us →</button>
          </div>
        </div>
        <footer style={{ background: "#111827", color: "rgba(255,255,255,0.5)", padding: "24px", textAlign: "center", fontSize: 12 }}>
          <p style={{ margin: "0 0 6px" }}>© 2025 Aeterion Peptides. All Rights Reserved.</p>
          <p style={{ margin: 0 }}>All products for laboratory research purposes only. Not for human consumption. Must be 18+.</p>
        </footer>
      </div>
    );
  };

  /* ════════ WHOLESALE PAGE ════════ */
  const WholesalePage = ({ goTo }) => {
    const [form, setForm] = useState({ name:"", email:"", company:"", type:"", monthly:"", compounds:"", message:"" });
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [err, setErr] = useState("");

    const tiers = [
      { name:"Starter", min:"$500", disc:"25%", perks:["Dedicated account manager","Priority dispatch","COA digital vault access"] },
      { name:"Professional", min:"$1,500", disc:"32%", perks:["Everything in Starter","Custom labelling available","Net-30 payment terms","Monthly new compound previews"] },
      { name:"Enterprise", min:"$5,000", disc:"40%", perks:["Everything in Professional","White-label packaging","Dedicated cold-chain logistics","Quarterly pricing reviews"] },
    ];

    const submit = async () => {
      if (!form.name || !form.email || !form.company || !form.type) { setErr("Please fill in all required fields."); return; }
      setSending(true); setErr("");
      try {
        await fetch("/api/contact", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: `Wholesale Application — ${form.company}`,
          message: `Company: ${form.company}\nType: ${form.type}\nMonthly Volume: ${form.monthly}\nCompounds of Interest: ${form.compounds}\n\nMessage:\n${form.message}`,
        })});
        setSent(true);
      } catch { setErr("Something went wrong. Please email info@aeterionpeptides.com directly."); }
      setSending(false);
    };

    const inp = (label, key, type="text", placeholder="", required=false) => (
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:6 }}>{label}{required && <span style={{ color:"#dc2626" }}>*</span>}</div>
        <input type={type} value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder}
          style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${T.border}`, fontSize:14, fontFamily:"inherit", outline:"none", background:T.white, color:T.text, boxSizing:"border-box" }} />
      </div>
    );

    return (
      <div style={{ fontFamily:"'DM Sans', system-ui, sans-serif", background:T.bg, minHeight:"100vh" }}>
        {/* Header */}
        <div style={{ background:"#0f172a", padding: mob ? "40px 24px 48px" : "56px 24px 64px", textAlign:"center" }}>
          <div style={{ maxWidth:700, margin:"0 auto" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.1)", borderRadius:20, padding:"5px 14px", fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:16 }}>🏥 B2B Wholesale Program</div>
            <h1 style={{ fontSize: mob ? 28 : 40, fontWeight:900, color:"#f8fafc", margin:"0 0 14px", lineHeight:1.15 }}>Volume Pricing for Clinics & Researchers</h1>
            <p style={{ fontSize:15, color:"rgba(255,255,255,0.65)", lineHeight:1.7, margin:0 }}>
              Aeterion partners with medical clinics, research institutions, compounding pharmacies, and med spas. Unlock wholesale pricing, dedicated support, and priority fulfilment.
            </p>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:"0 auto", padding: mob ? "32px 16px 60px" : "52px 24px 80px" }}>

          {/* Tier cards */}
          <div style={{ textAlign:"center", marginBottom:8 }}>
            <div style={{ fontSize:11, color:T.blue, fontWeight:800, letterSpacing:2, textTransform:"uppercase" }}>PRICING TIERS</div>
            <div style={{ fontSize: mob ? 22 : 28, fontWeight:900, color:T.text, marginTop:8, marginBottom:6 }}>Save up to 40% on every order</div>
            <div style={{ fontSize:14, color:T.sub, marginBottom:32 }}>Based on monthly commitment volume</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns: mob ? "1fr" : "repeat(3,1fr)", gap:16, marginBottom:56 }}>
            {tiers.map((t,i) => (
              <div key={t.name} style={{ background:T.white, borderRadius:16, border:`2px solid ${i===1?T.blue:T.border}`, padding:"28px 24px", position:"relative", boxShadow: i===1 ? "0 8px 32px rgba(26,110,216,0.12)" : T.shadow }}>
                {i===1 && <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:T.blue, color:"#fff", fontSize:10, fontWeight:800, padding:"4px 14px", borderRadius:20, letterSpacing:1.5 }}>MOST POPULAR</div>}
                <div style={{ fontSize:11, fontWeight:800, color:i===1?T.blue:T.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>{t.name}</div>
                <div style={{ fontSize:36, fontWeight:900, color:T.text, marginBottom:2 }}>{t.disc}<span style={{ fontSize:18 }}> off</span></div>
                <div style={{ fontSize:13, color:T.muted, marginBottom:20 }}>On orders {t.min}+/month</div>
                <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:16 }}>
                  {t.perks.map(p => (
                    <div key={p} style={{ fontSize:13, color:T.sub, marginBottom:10, display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ color:"#16a34a", fontWeight:800, flexShrink:0 }}>✓</span>{p}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Application form */}
          <div style={{ display:"grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 24 : 48, alignItems:"start" }}>
            <div>
              <div style={{ fontSize:11, color:T.blue, fontWeight:800, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>APPLY NOW</div>
              <div style={{ fontSize: mob ? 22 : 28, fontWeight:900, color:T.text, marginBottom:10 }}>Start Your Wholesale Application</div>
              <div style={{ fontSize:14, color:T.sub, lineHeight:1.75, marginBottom:24 }}>
                Fill out the form and our team will reach out within 1 business day with your custom pricing agreement and onboarding details.
              </div>
              <div style={{ background:T.white, borderRadius:16, border:`1px solid ${T.border}`, padding:"22px 24px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:16 }}>What's included in your account:</div>
                {[
                  "Personalised pricing agreement",
                  "Dedicated account manager via email & phone",
                  "Same-day dispatch on orders placed before 2pm EST",
                  "Batch COAs emailed automatically on every order",
                  "Net-30 invoicing available (approved accounts)",
                  "Early access to new compound launches",
                ].map(item => (
                  <div key={item} style={{ fontSize:13, color:T.sub, marginBottom:9, display:"flex", gap:8 }}>
                    <span style={{ color:"#16a34a", fontWeight:800, flexShrink:0 }}>✓</span>{item}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:T.white, borderRadius:20, border:`1px solid ${T.border}`, padding: mob ? "24px 20px" : "32px 28px", boxShadow:T.shadow }}>
              {sent ? (
                <div style={{ textAlign:"center", padding:"40px 0" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", border: "3px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontWeight: 900, fontSize: 28, color: "#16a34a" }}>✓</div>
                  <div style={{ fontSize:22, fontWeight:900, color:T.text, marginBottom:10 }}>Application Received</div>
                  <div style={{ fontSize:14, color:T.sub, lineHeight:1.7, marginBottom:28 }}>
                    Thanks <strong>{form.name}</strong>! Our wholesale team will review your application and reach out within 1 business day.
                  </div>
                  <button onClick={() => goTo("store")} style={{ ...btnPrimary({ padding:"12px 28px", fontSize:14, borderRadius:12 }) }}>← Back to Store</button>
                </div>
              ) : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                    {inp("Full Name","name","text","Dr. Jane Smith",true)}
                    {inp("Email Address","email","email","jane@clinic.com",true)}
                  </div>
                  {inp("Company / Practice Name","company","text","Smith Aesthetics & Wellness",true)}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:6 }}>Account Type<span style={{ color:"#dc2626" }}>*</span></div>
                    <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}
                      style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${T.border}`, fontSize:14, fontFamily:"inherit", outline:"none", background:T.white, color: form.type ? T.text : T.muted, boxSizing:"border-box" }}>
                      <option value="">Select account type...</option>
                      <option>Medical Clinic / Practice</option>
                      <option>Med Spa / Aesthetics</option>
                      <option>Compounding Pharmacy</option>
                      <option>Research Institution / University</option>
                      <option>Wellness / Longevity Center</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 16px" }}>
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:6 }}>Est. Monthly Volume</div>
                      <select value={form.monthly} onChange={e => setForm(f=>({...f,monthly:e.target.value}))}
                        style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${T.border}`, fontSize:14, fontFamily:"inherit", outline:"none", background:T.white, color: form.monthly ? T.text : T.muted, boxSizing:"border-box" }}>
                        <option value="">Select range...</option>
                        <option>$500 – $1,499</option>
                        <option>$1,500 – $4,999</option>
                        <option>$5,000 – $14,999</option>
                        <option>$15,000+</option>
                      </select>
                    </div>
                    {inp("Compounds of Interest","compounds","text","BPC-157, Semaglutide...")}
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:6 }}>Additional Notes</div>
                    <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))}
                      placeholder="Tell us about your practice and any specific requirements..." rows={3}
                      style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${T.border}`, fontSize:14, fontFamily:"inherit", outline:"none", background:T.white, color:T.text, resize:"vertical", boxSizing:"border-box" }} />
                  </div>
                  {err && <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#dc2626", marginBottom:14 }}>⚠️ {err}</div>}
                  <button onClick={submit} disabled={sending} style={{ ...btnPrimary({ width:"100%", padding:"14px", fontSize:15, borderRadius:12, boxShadow:"0 4px 14px rgba(26,110,216,0.25)" }), opacity: sending ? 0.7 : 1 }}>
                    {sending ? "Submitting…" : "Submit Application →"}
                  </button>
                  <div style={{ fontSize:11, color:T.muted, textAlign:"center", marginTop:10 }}>We'll respond within 1 business day</div>
                </>
              )}
            </div>
          </div>
        </div>

        <footer style={{ background:"#111827", color:"rgba(255,255,255,0.5)", padding:"24px", textAlign:"center", fontSize:12 }}>
          <p style={{ margin:"0 0 6px" }}>© 2025 Aeterion Peptides. All Rights Reserved.</p>
          <p style={{ margin:0 }}>All products for laboratory research purposes only. Not for human consumption. Must be 18+.</p>
        </footer>
      </div>
    );
  };

  /* ════════════════════ PAGE ROUTING ════════════════════ */
  if (page === "contact") return <ContactPage />;
  if (page === "legal") return <LegalPage />;
  if (page === "admin") return <AdminPage goTo={goTo} />;
  if (page === "login") return <LoginPage />;
  if (page === "signup") return <SignupPage />;
  if (page === "account") return <AccountPage />;
  if (page === "about") return <AboutPage goTo={goTo} />;
  if (page === "faq") return <FAQPage goTo={goTo} />;
  if (page === "wholesale") return <WholesalePage goTo={goTo} />;

  /* ════════ THANK YOU PAGE ════════ */
  if (paymentMsg === "success") return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.1)", padding: mob ? "40px 24px" : "60px 64px", maxWidth: 560, width: "100%", textAlign: "center" }}>
        {/* Checkmark */}
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "3px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32, fontWeight: 900, color: "#16a34a" }}>✓</div>
        {/* Aeterion logo text */}
        <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Aeterion Labs</div>
        {/* Main message */}
        <div style={{ fontSize: mob ? 26 : 32, fontWeight: 900, color: T.text, marginBottom: 12, lineHeight: 1.2 }}>Thank You for Your Order!</div>
        <div style={{ fontSize: 15, color: T.sub, lineHeight: 1.7, marginBottom: 32 }}>
          Your order has been placed successfully. A confirmation email with your order details and tracking information will be sent to you shortly.<br/><br/>
          All orders include a Certificate of Analysis (COA). If you have any questions, contact us at <span style={{ color: T.blue, fontWeight: 600 }}>info@aeterionpeptides.com</span>
        </div>
        {/* Info boxes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
          {[
            { icon: "", label: "Processing Time", value: "1–2 business days" },
            { icon: "", label: "Shipping", value: "1–2 weeks" },
            { icon: "", label: "COA Included", value: "With every order" },
            { icon: "", label: "Storage", value: "Ships cold-packed" },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ background: T.bg, borderRadius: 12, padding: "14px 12px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
        {/* Back to store button */}
        <button
          onClick={() => setPaymentMsg("")}
          style={{ ...btnPrimary({ padding: "14px 40px", fontSize: 15, borderRadius: 12, boxShadow: "0 4px 14px rgba(26,110,216,0.28)" }) }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );

  /* ════════════════════ QUIZ MODAL (shared mobile + desktop) ════════════════════ */
  const QuizModal = () => {
    const closeQuiz = () => { setShowQuiz(false); setQuizStep(0); setQuizAnswers({}); setQuizResult(null); setQuizLoading(false); };
    const openedAt = React.useRef(Date.now()).current;
    const safeClose = (e) => { if (Date.now() - openedAt < 400) return; if (e.target === e.currentTarget) closeQuiz(); };

    const SECONDARY_OPTS = {
      fat: [
        { label: "GI & Gut Health", desc: "Gut motility, digestion, microbiome support", val: "gut" },
        { label: "Energy & Mitochondria", desc: "NAD+, AMPK, cellular energy output", val: "energy" },
        { label: "Inflammation Control", desc: "Systemic anti-inflammatory support", val: "inflammation" },
        { label: "Sleep & Recovery", desc: "Sleep quality, cortisol regulation", val: "sleep" },
        { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
      ],
      recovery: [
        { label: "Immune Modulation", desc: "Thymic peptides, immune resilience", val: "immune" },
        { label: "Collagen & Skin", desc: "GHK-Cu, wound repair, skin integrity", val: "collagen" },
        { label: "Gut Protection", desc: "GI lining, motility, permeability", val: "gut" },
        { label: "Sleep Optimization", desc: "Overnight recovery, sleep architecture", val: "sleep" },
        { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
      ],
      growth: [
        { label: "Fat Oxidation", desc: "Lipolysis, visceral fat reduction", val: "fat" },
        { label: "Joint & Tendon Health", desc: "Connective tissue support for heavy training", val: "joint" },
        { label: "Recovery Acceleration", desc: "Faster repair between sessions", val: "recovery" },
        { label: "Sleep & GH Pulse", desc: "Optimize overnight GH release", val: "sleep" },
        { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
      ],
      neuro: [
        { label: "Anxiety & Stress", desc: "Anxiolytic peptides, HPA regulation", val: "anxiety" },
        { label: "Neuroprotection", desc: "BDNF, neurodegeneration defense", val: "neuroProtect" },
        { label: "Sleep Architecture", desc: "REM quality, delta sleep peptides", val: "sleep" },
        { label: "Mood & Motivation", desc: "Dopaminergic pathways, drive", val: "mood" },
        { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
      ],
      longevity: [
        { label: "Metabolic Health", desc: "Insulin sensitivity, mitochondrial efficiency", val: "metabolic" },
        { label: "Immune Resilience", desc: "Thymic restoration, immune aging", val: "immune" },
        { label: "Cardiovascular", desc: "Cardioprotective peptides, heart health", val: "cardio" },
        { label: "Skin & Regeneration", desc: "Collagen, wound healing, GHK-Cu", val: "skin" },
        { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
      ],
      default: [
        { label: "Sleep & Recovery", desc: "Sleep quality, overnight repair", val: "sleep" },
        { label: "Joint & Tendon Health", desc: "Connective tissue, mobility", val: "joint" },
        { label: "Immune Support", desc: "Thymic peptides, immune modulation", val: "immune" },
        { label: "Metabolic Health", desc: "Insulin sensitivity, mitochondria", val: "metabolic" },
        { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
      ],
    };

    const questions = [
      { q: "What is your primary research goal?", sub: "Choose the area you want to focus on most.", key: "goal", opts: [
        { label: "Fat Loss & Metabolic", desc: "GLP-1s, fat oxidation, metabolic optimization", val: "fat" },
        { label: "Recovery & Healing", desc: "Tissue repair, injury recovery, inflammation", val: "recovery" },
        { label: "Muscle & Body Composition", desc: "GH axis, IGF-1, anabolism, body recomp", val: "growth" },
        { label: "Cognitive Enhancement", desc: "Focus, memory, neurogenesis, mood", val: "neuro" },
        { label: "Longevity & Anti-Aging", desc: "Cellular health, telomeres, senescence", val: "longevity" },
      ]},
      { q: "Any secondary focus?", sub: "Optional — helps fine-tune your protocol.", key: "secondary",
        opts: SECONDARY_OPTS[quizAnswers.goal] || SECONDARY_OPTS.default },
      { q: "What is your experience level?", sub: "Be honest — this shapes complexity and intensity.", key: "exp", opts: [
        { label: "First Protocol", desc: "New to research peptides, want to start simple", val: "beginner" },
        { label: "Intermediate", desc: "Some experience, comfortable with protocols", val: "mid" },
        { label: "Advanced Researcher", desc: "Extensive experience, want cutting-edge stacks", val: "advanced" },
      ]},
      { q: "How long is your research cycle?", sub: "Longer cycles allow more compounds and layering.", key: "cycle", opts: [
        { label: "8 Weeks", desc: "Short, focused protocol", val: "8wk" },
        { label: "12 Weeks", desc: "Standard research cycle", val: "12wk" },
        { label: "16 Weeks", desc: "Extended, comprehensive protocol", val: "16wk" },
      ]},
      { q: "What is your budget range?", sub: "We'll build the best stack within your range.", key: "budget", opts: [
        { label: "Essentials", desc: "$100 – $250 / cycle", val: "low" },
        { label: "Standard", desc: "$250 – $500 / cycle", val: "mid" },
        { label: "Premium", desc: "$500+ / cycle, no compromises", val: "high" },
      ]},
    ];

    const PRODUCT_CATALOG = PRODUCTS.map(p =>
      `${p.name} [sizes: ${p.variants.map(v => `${v.s}=$${v.p}`).join(", ")}]`
    ).join("\n");

    const generateStack = async (answers) => {
      setQuizLoading(true);
      const compoundCount = answers.exp === "beginner" ? "EXACTLY 2-3" : answers.exp === "mid" ? "EXACTLY 4" : "EXACTLY 5";
      const sizeRule = answers.exp === "beginner"
        ? "recommend the SMALLEST vial size available for each compound"
        : answers.exp === "mid"
        ? "recommend a MID-RANGE or LARGE vial size (e.g. 5mg, 10mg, 15mg) — NOT the smallest"
        : "ALWAYS recommend the LARGEST vial size available for each compound — never the smallest";
      try {
        const prompt = `You are the Aeterion Labs stack builder. Generate a premium personalized peptide research protocol.

Researcher Profile:
- Primary Goal: ${answers.goal}
- Secondary Focus: ${answers.secondary}
- Experience Level: ${answers.exp}
- Cycle Length: ${answers.cycle}
- Budget: ${answers.budget}

Available Aeterion Products (with ALL available sizes):
${PRODUCT_CATALOG}

STRICT RULES:
1. Compound count: ${compoundCount} — non-negotiable
2. Vial sizing: ${sizeRule}
3. Only use product names that exist EXACTLY in the catalog above
4. Match budget: low=cheaper compounds, high=premium/rare compounds and largest sizes
5. The recommendedSize field MUST match one of the actual listed sizes for that product

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "protocolName": "Dramatic 3-4 word protocol name",
  "tagline": "One compelling sentence for this stack",
  "compounds": [
    {
      "name": "EXACT product name from catalog",
      "recommendedSize": "EXACT size string from that product's size list above",
      "role": "2-4 word role (Foundation / Amplifier / Support / Optimizer)",
      "reason": "1-2 sentence scientific rationale",
      "researchNote": "Brief note on published research protocols"
    }
  ],
  "protocolTip": "One practical tip for this cycle"
}`;
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
        });
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        const clean = text.replace(/```json|```/g, "").trim();
        setQuizResult(JSON.parse(clean));
      } catch {
        setQuizResult({
          protocolName: "Foundation Protocol",
          tagline: "A solid starting point for your research goals.",
          compounds: [{ name: "BPC-157", recommendedSize: "5mg", role: "Foundation", reason: "Versatile healing peptide with broad research backing.", researchNote: "Well-tolerated in beginner protocols." }],
          protocolTip: "Start with the foundation compound and introduce others after the first 2 weeks.",
        });
      }
      setQuizLoading(false);
    };

    if (quizLoading) return (
      <div style={{ position:"fixed",inset:0,background:"rgba(2,8,23,0.97)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:48,marginBottom:24,animation:"spin 2s linear infinite" }}>⚗️</div>
          <div style={{ fontSize:22,fontWeight:900,color:"#f8fafc",marginBottom:10 }}>Analyzing your profile…</div>
          <div style={{ fontSize:14,color:"#64748b" }}>Building your personalized research protocol</div>
          <div style={{ marginTop:32,display:"flex",gap:8,justifyContent:"center" }}>
            {[0,1,2].map(i => <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"#1a6ed8",animation:`pulse 1.4s ease-in-out ${i*0.2}s infinite` }}/>)}
          </div>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    );

    if (quizResult) {
      const addAllToCart = () => {
        let added = 0;
        quizResult.compounds.forEach(c => {
          const prod = PRODUCTS.find(p => p.name.toLowerCase() === c.name.toLowerCase());
          if (prod) { addCart(prod, prod.variants[0], 1, prod.variants[0].p); added++; }
        });
        if (added > 0) { setCartOpen(true); closeQuiz(); }
      };
      return (
        <div style={{ position:"fixed",inset:0,background:"rgba(2,8,23,0.97)",zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",WebkitOverflowScrolling:"touch" }}
          onClick={safeClose}>
          <div style={{ maxWidth:600,width:"100%",position:"relative",padding:"48px 24px" }}>
            <button onClick={closeQuiz} style={{ position:"absolute",top:8,right:0,background:"none",border:"none",color:"#64748b",fontSize:24,cursor:"pointer" }}>×</button>
            <div style={{ marginBottom:6 }}><span style={{ fontSize:11,fontWeight:800,color:"#1a6ed8",letterSpacing:2,textTransform:"uppercase" }}>Your Protocol</span></div>
            <div style={{ fontSize:32,fontWeight:900,color:"#f8fafc",marginBottom:8,letterSpacing:"-1px",lineHeight:1.1 }}>{quizResult.protocolName}</div>
            <div style={{ fontSize:15,color:"#94a3b8",marginBottom:32,lineHeight:1.6 }}>{quizResult.tagline}</div>
            <div style={{ display:"flex",flexDirection:"column",gap:14,marginBottom:24 }}>
              {quizResult.compounds?.map((c, i) => {
                const prod = PRODUCTS.find(p => p.name.toLowerCase() === c.name.toLowerCase());
                return (
                  <div key={i} style={{ background:"#0f172a",border:"1px solid #1e293b",borderRadius:16,padding:"20px 22px",display:"flex",gap:16,alignItems:"flex-start" }}>
                    <div style={{ background:"#1a6ed8",color:"#fff",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,flexShrink:0,marginTop:2 }}>{i+1}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6 }}>
                        <span style={{ fontSize:16,fontWeight:800,color:"#f8fafc" }}>{c.name}</span>
                        <span style={{ fontSize:10,fontWeight:800,color:"#1a6ed8",background:"rgba(26,110,216,0.12)",border:"1px solid rgba(26,110,216,0.3)",borderRadius:20,padding:"3px 10px",textTransform:"uppercase",letterSpacing:1 }}>{c.role}</span>
                        {c.recommendedSize && <span style={{ fontSize:11,fontWeight:800,color:"#f59e0b",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:20,padding:"3px 10px" }}>{c.recommendedSize}</span>}
                        {prod && <span style={{ fontSize:12,color:"#4ade80",fontWeight:700 }}>from ${prod.variants[0].p}</span>}
                      </div>
                      <div style={{ fontSize:13,color:"#94a3b8",lineHeight:1.6,marginBottom:6 }}>{c.reason}</div>
                      <div style={{ fontSize:12,color:"#475569",fontStyle:"italic" }}>{c.researchNote}</div>
                    </div>
                    {prod && (
                      <button onClick={()=>{ addCart(prod, prod.variants[0], 1, prod.variants[0].p); setCartOpen(true); }}
                        style={{ background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",fontSize:11,fontWeight:700,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0 }}>
                        + Cart
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {quizResult.protocolTip && (
              <div style={{ background:"rgba(26,110,216,0.08)",border:"1px solid rgba(26,110,216,0.2)",borderRadius:12,padding:"14px 18px",marginBottom:24,fontSize:13,color:"#94a3b8",lineHeight:1.6 }}>
                <strong style={{ color:"#60a5fa" }}>Protocol Tip:</strong> {quizResult.protocolTip}
              </div>
            )}
            <div style={{ fontSize:11,color:"#475569",marginBottom:24,lineHeight:1.6 }}>For research use only. Not intended for human use.</div>
            <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
              <button onClick={addAllToCart} style={{ flex:1,minWidth:200,background:"linear-gradient(135deg,#1a6ed8,#2563eb)",border:"none",color:"#fff",fontSize:15,fontWeight:800,padding:"16px 24px",borderRadius:12,cursor:"pointer",fontFamily:"inherit" }}>Add Full Stack to Cart</button>
              <button onClick={()=>{ setQuizStep(0); setQuizAnswers({}); setQuizResult(null); }} style={{ background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",fontSize:13,fontWeight:700,padding:"16px 20px",borderRadius:12,cursor:"pointer",fontFamily:"inherit" }}>↺ Rebuild</button>
            </div>
          </div>
        </div>
      );
    }

    const q = questions[quizStep];
    const totalSteps = questions.length;
    return (
      <div style={{ position:"fixed",inset:0,background:"rgba(2,8,23,0.97)",zIndex:9000,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",WebkitOverflowScrolling:"touch" }}
        onClick={safeClose}>
        <div style={{ maxWidth:560,width:"100%",position:"relative",padding:"48px 24px" }}>
          <button onClick={closeQuiz} style={{ position:"absolute",top:8,right:0,background:"none",border:"none",color:"#64748b",fontSize:24,cursor:"pointer" }}>×</button>
          <div style={{ marginBottom:32 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
              <span style={{ fontSize:11,fontWeight:800,color:"#1a6ed8",letterSpacing:2,textTransform:"uppercase" }}>Build Your Stack</span>
              <span style={{ fontSize:11,color:"#475569",fontWeight:700 }}>{quizStep+1} / {totalSteps}</span>
            </div>
            <div style={{ background:"#1e293b",borderRadius:99,height:3 }}>
              <div style={{ background:"linear-gradient(90deg,#1a6ed8,#60a5fa)",borderRadius:99,height:3,width:`${(quizStep/totalSteps)*100}%`,transition:"width .4s cubic-bezier(.4,0,.2,1)" }}/>
            </div>
          </div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:26,fontWeight:900,color:"#f8fafc",letterSpacing:"-0.5px",lineHeight:1.2,marginBottom:8 }}>{q.q}</div>
            <div style={{ fontSize:14,color:"#64748b" }}>{q.sub}</div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:24 }}>
            {q.opts.map(opt => (
              <button key={opt.val}
                onClick={()=>{
                  const newA = {...quizAnswers, [q.key]: opt.val};
                  setQuizAnswers(newA);
                  if (quizStep + 1 >= totalSteps) { generateStack(newA); }
                  else { setQuizStep(quizStep + 1); }
                }}
                style={{ background:"#0f172a",border:"1.5px solid #1e293b",color:"#f8fafc",fontSize:14,fontWeight:600,padding:"16px 20px",borderRadius:14,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"border-color .15s,background .15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#1a6ed8"; e.currentTarget.style.background="#0f1f3d"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#1e293b"; e.currentTarget.style.background="#0f172a"; }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:"#1a6ed8",flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:700,marginBottom:2 }}>{opt.label}</div>
                  <div style={{ fontSize:12,color:"#64748b",fontWeight:400 }}>{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
          {quizStep > 0 && (
            <button onClick={()=>setQuizStep(quizStep-1)} style={{ marginTop:20,background:"none",border:"none",color:"#475569",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>← Back</button>
          )}
        </div>
      </div>
    );
  };

  if (mob) return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text, paddingBottom: 70 }}>
      <Head>
        <title>Buy Research Peptides Online | GLP-1, BPC-157, TB-500 & More | Aeterion Labs</title>
        <meta name="description" content="Shop 79 research-grade peptides and compounds. GLP-1 agonists, BPC-157, TB-500, NAD+, cognitive peptides and more. COA with every order. USA shipping." />
        <link rel="canonical" href="https://aeterionpeptides.com" />
        {HOMEPAGE_SCHEMA.map((s, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />)}
        <style>{`
          @keyframes ticker-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .review-ticker { display:flex; animation: ticker-scroll 45s linear infinite; width:max-content; }
          .review-ticker:hover { animation-play-state: paused; }
        `}</style>
      </Head>
      <div style={{ background: T.blue, padding: "8px 16px", fontSize: 11, color: "rgba(255,255,255,0.9)", textAlign: "center" }}>
        Free shipping $250+ · COA with every order · 1–2 day processing
      </div>

      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 300, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 20, color: T.text }}>☰</button>
        <div onClick={() => { setCat("all"); setQ(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ cursor: "pointer", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <AeterionLogo size={32} showText={false} textColor={T.text}/>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2.5, color: "#1B3A6B", lineHeight: 1, marginTop: 1 }}>AETERION</div>
        </div>
        <button onClick={() => setSearchOpen(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 18, color: T.sub }}>🔍</button>
        <button onClick={() => setCartOpen(true)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 18, color: T.sub }}>
          Cart
          {count > 0 && <span style={{ position: "absolute", top: -2, right: -2, background: T.blue, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{count}</span>}
        </button>
      </header>

      {searchOpen && (
        <div style={{ background: T.white, padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
          <input autoFocus value={q} onChange={e => { setQ(e.target.value); setCat("all"); }} placeholder="Search 72 compounds…"
            style={{ width: "100%", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 24, padding: "10px 16px", fontSize: 16, outline: "none", fontFamily: "inherit", color: T.text, boxSizing: "border-box" }} />
        </div>
      )}

      {cat === "all" && !q && (
        <div style={{ background: "linear-gradient(145deg,#0f4fa8 0%,#1a6ed8 55%,#3b82f6 100%)", padding: "36px 20px 32px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.16)", borderRadius: 24, padding: "5px 16px", fontSize: 10, color: "rgba(255,255,255,0.95)", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16, border: "1px solid rgba(255,255,255,0.2)" }}>72 Research Compounds · COA Included</div>
            <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 900, margin: "0 0 10px", lineHeight: 1.15, letterSpacing: -0.5 }}>Buy Research Peptides Online<br />GLP-1, BPC-157, TB-500 & More</h1>
            <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 1.75, margin: "0 0 22px" }}>GLP-1s · SARMs · Nootropics · Longevity<br />Every order ships with a Certificate of Analysis.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
              <button onClick={() => document.getElementById("mob-cat")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "#fff", color: T.blue, border: "none", borderRadius: 24, padding: "12px 26px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(0,0,0,0.18)" }}>Shop Now</button>
              <button onClick={() => setCat("metabolic")} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 24, padding: "12px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>GLP-1 →</button>
              <button onClick={() => setShowQuiz(true)} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 24, padding: "12px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(8px)" }}>Build My Stack</button>
            </div>
            <div style={{ display: "flex", gap: 0, justifyContent: "center", background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "12px 0", border: "1px solid rgba(255,255,255,0.12)" }}>
              {[["72","Products"],["≥99%","Purity"],["1-2d","Processing"],["COA","Included"],["USA","Ships"]].map(([v,l], idx, arr) => (
                <div key={l} style={{ flex: 1, textAlign: "center", borderRight: idx < arr.length-1 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>{v}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ background: T.greenSoft, borderBottom: "1px solid #bbf7d0", padding: "9px 16px", display: "flex", gap: 16, justifyContent: "center", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>BULK SAVINGS</span>
        <span style={{ fontSize: 11, color: "#15803d" }}>5 vials <b>-8%</b></span>
        <span style={{ fontSize: 11, color: "#15803d" }}>10 vials <b>-18%</b></span>
      </div>

      {/* ── TRUST BAR (mobile) ── */}
      <div style={{ background:"#0f172a", borderBottom:"1px solid #1e293b", overflow:"hidden", height:34 }}>
        <style>{`
          @keyframes trust-scroll { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
          .trust-ticker { display:flex; animation:trust-scroll 35s linear infinite; width:max-content; }
          .trust-ticker:hover { animation-play-state:paused; }
        `}</style>
        <div style={{ display:"flex", alignItems:"center", height:"100%" }}>
          <div className="trust-ticker">
            {[...Array(2)].flatMap(() => [
              "COA with every order",
              "Cold-chain shipping",
              "≥99% HPLC purity",
              "Same-day dispatch",
              "Secure checkout",
              "Discreet packaging",
              "Research grade only",
              "New store — be our first reviewer and get 10% off your next order",
            ]).map((text, i) => (
              <div key={i} style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"0 20px", borderRight:"1px solid rgba(255,255,255,0.07)", whiteSpace:"nowrap", height:34 }}>
                <span style={{ width:4, height:4, borderRadius:"50%", background:"#1a6ed8", flexShrink:0, display:"inline-block" }} />
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600, letterSpacing:"0.2px" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mob-cat" style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "10px 14px 12px", overflowX: "auto", display: "flex", gap: 8, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {[{id:"all",label:"All",icon:""}, ...CATS].map(c => (
          <button key={c.id} onClick={() => { setCat(c.id); setQ(""); }} style={{
            flexShrink: 0, padding: "8px 15px", borderRadius: 24, border: "1.5px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
            borderColor: cat === c.id ? T.blue : T.border,
            background: cat === c.id ? T.blue : T.white,
            color: cat === c.id ? "#fff" : T.sub,
            boxShadow: cat === c.id ? "0 2px 8px rgba(26,110,216,0.25)" : "none",
            transition: "all .15s",
          }}>{c.icon} {c.label}</button>
        ))}
      </div>

      <main>
      <div style={{ padding: "14px 12px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: T.muted }}>{products.length} products</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label htmlFor="mob-sort-select" style={{ fontSize: 12, color: T.muted }}>Sort:</label>
            <select id="mob-sort-select" value={sort} onChange={e => setSort(e.target.value)} style={{ background: T.white, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <option value="default">Default</option><option value="low">Price ↑</option><option value="high">Price ↓</option><option value="az">A–Z</option>
            </select>
          </div>
        </div>

        {grouped ? grouped.map(g => (
          <section key={g.id} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                {g.icon} {g.label}
                <span style={{ background: T.blueSoft, color: T.blue, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>{g.items.length}</span>
              </div>
              <button onClick={() => setCat(g.id)} style={{ ...btnOutline({ padding: "4px 10px", fontSize: 11, borderRadius: 8 }) }}>All →</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              {g.items.map(p => <Card key={p.id} p={p} onOpen={open} onAdd={addCartAndOpen} mob={true} inv={inventory[p.id]} productReviews={reviews[p.id]} />)}
            </div>
          </section>
        )) : (
          products.length === 0 ?
            <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg,#1a6ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>AI</div>
              <div style={{ marginTop: 12, fontSize: 14 }}>No products found</div>
              <button onClick={() => { setQ(""); setCat("all"); }} style={{ ...btnPrimary({ marginTop: 12, padding: "9px 20px", fontSize: 13 }) }}>Clear</button>
            </div> :
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              {products.map(p => <Card key={p.id} p={p} onOpen={open} onAdd={addCartAndOpen} mob={true} inv={inventory[p.id]} productReviews={reviews[p.id]} />)}
            </div>
        )}
      </div>

      </main>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.white, borderTop: `1px solid ${T.border}`, display: "flex", zIndex: 400, boxShadow: "0 -4px 24px rgba(0,0,0,0.09)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {[
          { lb: "Home",    fn: ()=>{setCat("all");setQ("");window.scrollTo({top:0,behavior:"smooth"});}, active: cat==="all"&&!q,
            svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { lb: "Browse",  fn: ()=>setMenuOpen(true), active: false,
            svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
          { lb: "My Stack", fn: ()=>setShowQuiz(true), active: false, highlight: true,
            svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
          { lb: user ? "Account" : "Sign In", fn: ()=>goTo(user?"account":"login"), active: false,
            svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
          { lb: "Cart",    fn: ()=>setCartOpen(true), active: count>0, badge: count > 0 ? count : null,
            svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
        ].map(({ lb, fn, active, highlight, badge, svg }) => (
          <button key={lb} onClick={fn} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            padding: "8px 2px 9px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            fontFamily: "inherit",
            color: active ? T.blue : highlight ? T.blue : "#94a3b8",
            position: "relative",
          }}>
            {/* Active pill indicator */}
            {active && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 3, background: T.blue, borderRadius: "0 0 4px 4px" }} />}
            {/* Icon wrapper — filled blue bg for highlight (Stack) */}
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: highlight ? 36 : "auto", height: highlight ? 28 : "auto",
              background: highlight ? "linear-gradient(135deg,#1a6ed8,#3b82f6)" : "none",
              borderRadius: highlight ? 10 : 0,
              color: highlight ? "#fff" : "inherit",
              position: "relative",
            }}>
              {svg}
              {badge && (
                <span style={{ position: "absolute", top: -5, right: -6, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff" }}>{badge}</span>
              )}
            </span>
            <span style={{ fontSize: 10, fontWeight: active || highlight ? 700 : 500, lineHeight: 1, color: active ? T.blue : highlight ? T.blue : "#94a3b8" }}>{lb}</span>
          </button>
        ))}
      </nav>

      <MobileMenu /><ProductModal />{cartDrawerJSX}


      {/* ══════════ AI RESEARCH ASSISTANT ══════════ */}
      {(() => {
        const SUGGESTIONS = [
          "Best stack for fat loss?",
          "GLP-1 comparison — Sema vs Tirze vs Retatra?",
          "Recovery stack for joint repair?",
          "Best nootropic peptides for focus?",
          "GH axis stack for beginners?",
          "What's the difference between BPC-157 and TB-500?",
        ];

        return (
          <>
            {/* Floating button */}
            {(!mob || !widgetHidden) && <button
              onClick={() => setChatOpen(o => !o)}
              style={{
                position: "fixed", bottom: mob ? 82 : 28, right: 24, zIndex: 8000,
                width: 56, height: 56, borderRadius: "50%",
                background: chatOpen ? "#0f172a" : "linear-gradient(135deg,#1a6ed8,#2563eb)",
                border: chatOpen ? "2px solid #334155" : "none",
                color: "#fff", fontSize: 22, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(26,110,216,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s",
              }}
              title="AI Research Assistant"
            >
              "AI"
            </button>}

            {/* Mobile pull tab — always visible on mobile, hides/shows entire widget */}
            {mob && (
              <div
                onClick={() => { setWidgetHidden(h => !h); if (!widgetHidden) { setChatOpen(false); } }}
                style={{
                  position: "fixed", right: 0, bottom: 140, zIndex: 8002,
                  background: "linear-gradient(135deg,#1a6ed8,#2563eb)",
                  color: "#fff", fontSize: 11, fontWeight: 700,
                  padding: "10px 6px", borderRadius: "10px 0 0 10px",
                  cursor: "pointer", writingMode: "vertical-rl",
                  textOrientation: "mixed", letterSpacing: 1,
                  boxShadow: "-3px 0 12px rgba(26,110,216,0.35)",
                  userSelect: "none", display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {widgetHidden ? "◀ AI" : "▶ AI"}
              </div>
            )}

            {/* Speech bubble — mobile only, when closed */}
            {mob && !widgetHidden && !chatOpen && !bubbleDismissed && (
              <div style={{
                position: "fixed", bottom: 148, right: 18, zIndex: 8001,
                background: "#1a6ed8", color: "#fff",
                fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                padding: "8px 14px", borderRadius: "14px 14px 4px 14px",
                boxShadow: "0 4px 14px rgba(26,110,216,0.45)",
                pointerEvents: "none",
                animation: "bubble-bounce 2.5s ease-in-out infinite",
              }}>
                <span>AI Research Assistant</span>
                <button onClick={() => setBubbleDismissed(true)} style={{ marginLeft: 8, background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 0 0 4px" }}>✕</button>
                <div style={{ position: "absolute", bottom: -6, right: 16, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #1a6ed8" }} />
              </div>
            )}
            <style>{`@keyframes bubble-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>

            {/* Chat panel */}
            {chatOpen && (!mob || !widgetHidden) && (
              <div style={{
                position: "fixed", bottom: mob ? 150 : 96, right: 24, zIndex: 7999,
                width: mob ? "calc(100vw - 32px)" : 380,
                maxHeight: mob ? "65vh" : 540,
                background: "#0f172a", borderRadius: 20,
                border: "1px solid #1e293b",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}>

                {/* Header */}
                <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid #1e293b", background: "#0f172a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1a6ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>AI</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>Research Assistant</div>
                      <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                        Powered by Gemini · Aeterion Catalog
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}
                  ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>

                  {chatMessages.length === 0 && (
                    <div>
                      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 14 }}>
                        Ask me anything about research compounds, stacks, mechanisms, or protocols. I know the full Aeterion catalog.
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {SUGGESTIONS.map((s, i) => (
                          <button key={i} onClick={() => sendMessage(s)}
                            style={{ textAlign: "left", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "9px 13px", fontSize: 12, color: "#cbd5e1", cursor: "pointer", fontFamily: "inherit", transition: "border-color .15s" }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "#1a6ed8"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "#334155"}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatMessages.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "85%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: m.role === "user" ? "#1a6ed8" : "#1e293b",
                        fontSize: 13, color: m.role === "user" ? "#fff" : "#e2e8f0",
                        lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word",
                      }}>
                        {m.content}
                        {m.role === "assistant" && chatStreaming && i === chatMessages.length - 1 && (
                          <span style={{ display: "inline-block", width: 8, height: 13, background: "#4ade80", borderRadius: 2, marginLeft: 3, animation: "blink 1s infinite" }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div style={{ padding: "12px 14px", borderTop: "1px solid #1e293b", display: "flex", gap: 8 }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
                    placeholder="Ask about compounds, stacks, protocols…"
                    disabled={chatStreaming}
                    autoComplete="off"
                    style={{ flex: 1, background: "#1e293b", border: "1.5px solid #334155", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", outline: "none", fontFamily: "inherit", resize: "none" }}
                    onFocus={e => e.target.style.borderColor = "#1a6ed8"}
                    onBlur={e => e.target.style.borderColor = "#334155"}
                  />
                  <button
                    onClick={() => sendMessage(chatInput)}
                    disabled={chatStreaming || !chatInput.trim()}
                    style={{ background: chatStreaming || !chatInput.trim() ? "#1e293b" : "#1a6ed8", border: "none", borderRadius: 10, width: 40, height: 40, cursor: chatStreaming ? "wait" : "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
                    {chatStreaming ? "⏳" : "↑"}
                  </button>
                </div>

                <div style={{ padding: "6px 14px 10px", fontSize: 10, color: "#334155", textAlign: "center" }}>
                  For research purposes only · Not medical advice
                </div>
              </div>
            )}

            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
          </>
        );
      })()}

      {/* ══════════ EMAIL CAPTURE POPUP (mobile) ══════════ */}
      {emailPopup && !emailPopupDone && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
          onClick={e => { if (e.target===e.currentTarget){ setEmailPopup(false); localStorage.setItem("aet_popup_v2","1"); setEmailPopupDone(true); }}}>
          <div style={{ background:"#0f172a",borderRadius:20,padding:"36px 28px",maxWidth:420,width:"100%",position:"relative",border:"1px solid #1e293b",textAlign:"center" }}>
            <button onClick={()=>{ setEmailPopup(false); localStorage.setItem("aet_popup_v2","1"); setEmailPopupDone(true); }}
              style={{ position:"absolute",top:14,right:16,background:"none",border:"none",color:"#64748b",fontSize:24,cursor:"pointer",lineHeight:1 }}>×</button>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#1a6ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 11, fontWeight: 800, color: "#fff" }}>STACK</div>
            <div style={{ fontSize:20,fontWeight:900,color:"#f8fafc",marginBottom:8 }}>10% Off Your First Order</div>
            <div style={{ fontSize:13,color:"#94a3b8",marginBottom:22,lineHeight:1.6 }}>
              Join thousands of researchers. Get exclusive access to new compounds, lab notes, and a <strong style={{ color:"#4ade80" }}>10% discount</strong> on your first order.
            </div>
            {emailPopupStatus==="done" ? (
              <div style={{ background:"#14532d",borderRadius:12,padding:"16px",fontSize:14,fontWeight:700,color:"#4ade80" }}>
                ✓ Check your inbox! Your code is on its way.
              </div>
            ) : (
              <>
                <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:12 }}>
                  <input type="email" placeholder="your@email.com" value={emailPopupVal}
                    onChange={e=>setEmailPopupVal(e.target.value)}
                    style={{ width:"100%",boxSizing:"border-box",background:"#1e293b",border:"1.5px solid #334155",borderRadius:10,padding:"13px 16px",fontSize:14,color:"#f8fafc",outline:"none",fontFamily:"inherit" }}
                  />
                  <button disabled={emailPopupStatus==="sending"}
                    onClick={()=>{
                      if(!emailPopupVal.includes("@")) return;
                      setEmailPopupStatus("sending");
                      fetch("/api/email-capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:emailPopupVal})})
                        .then(()=>setEmailPopupStatus("done")).catch(()=>setEmailPopupStatus("done"));
                    }}
                    style={{ background:"#1a6ed8",border:"none",color:"#fff",fontWeight:700,fontSize:14,padding:"13px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",width:"100%" }}>
                    {emailPopupStatus==="sending"?"...":"Get 10% Off →"}
                  </button>
                </div>
                <div style={{ fontSize:11,color:"#475569" }}>No spam. Unsubscribe anytime.</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════ BUILD YOUR STACK (mobile) ══════════ */}
      {showQuiz && <QuizModal />}

    </div>
  );

  /* ════════════════════ DESKTOP RENDER ════════════════════ */
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: "100vh", color: T.text, width: "100%" }}>
      <Head>
        <title>Buy Research Peptides Online | GLP-1, BPC-157, TB-500 & More | Aeterion Labs</title>
        <meta name="description" content="Shop 79 research-grade peptides and compounds. GLP-1 agonists, BPC-157, TB-500, NAD+, cognitive peptides and more. COA with every order. USA shipping." />
        <link rel="canonical" href="https://aeterionpeptides.com" />
        {HOMEPAGE_SCHEMA.map((s, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />)}
        <style>{`
          @keyframes ticker-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .review-ticker { display:flex; animation: ticker-scroll 45s linear infinite; width:max-content; }
          .review-ticker:hover { animation-play-state: paused; }
        `}</style>
      </Head>
      <div style={{ background: T.blue, padding: "9px 24px", fontSize: 11.5, color: "rgba(255,255,255,0.9)", textAlign: "center", fontWeight: 500 }}>
        Free shipping on orders over $250 · COA with every order &nbsp;·&nbsp; Third-party tested · Ships from USA
      </div>

      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 300, boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "13px 24px", display: "flex", alignItems: "center", gap: 20 }}>
          <div onClick={() => { setCat("all"); setQ(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0, overflow: "visible", minWidth: 180 }}>
            <AeterionLogo size={40} showText={true} textColor={T.text}/>
          </div>

          <div style={{ flex: 1, maxWidth: 500, position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 14 }}>🔍</span>
            <input value={q} onChange={e => { setQ(e.target.value); setCat("all"); }} placeholder="Search for products…"
              style={{ width: "100%", background: T.bg, border: `1.5px solid ${T.border}`, borderRadius: 28, padding: "10px 18px 10px 40px", fontSize: 16, outline: "none", color: T.text, boxSizing: "border-box", fontFamily: "inherit" }}
              onFocus={e => e.target.style.borderColor = T.blue}
              onBlur={e => e.target.style.borderColor = T.border} />
          </div>

          {user ? (
            <button onClick={() => goTo("account")} style={{ background: T.blueSoft, border: `1.5px solid ${T.blue}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: T.blue, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
              {user.full_name?.split(" ")[0] || "Account"}
            </button>
          ) : (
            <button onClick={() => goTo("login")} style={{ background: T.blueSoft, border: `1.5px solid ${T.blue}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: T.blue, fontFamily: "inherit" }}>
              Sign In
            </button>
          )}
          <button onClick={() => setCartOpen(true)} style={{ ...btnPrimary({ marginLeft: "auto", padding: "10px 20px", fontSize: 14, borderRadius: 12, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 3px 10px rgba(26,110,216,0.22)" }) }}>
            Cart
            {count > 0 && <span style={{ background: "#fff", color: T.blue, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{count}</span>}
            {count > 0 && <span style={{ fontWeight: 700 }}>{fmt(total)}</span>}
          </button>
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, maxWidth: 1400, margin: "0 auto", padding: "0 24px", display: "flex", overflowX: "auto" }}>
          <button onClick={() => { setCat("all"); setQ(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ background: "none", border: "none", padding: "11px 16px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "inherit", color: cat === "all" ? T.blue : T.sub, borderBottom: cat === "all" ? `2.5px solid ${T.blue}` : "2.5px solid transparent" }}>All Products</button>
          {CATS.map(c => (
            <button key={c.id} onClick={() => { setCat(c.id); setQ(""); }} style={{ background: "none", border: "none", padding: "11px 16px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "inherit", color: cat === c.id ? T.blue : T.sub, borderBottom: cat === c.id ? `2.5px solid ${T.blue}` : "2.5px solid transparent", display: "flex", alignItems: "center", gap: 5 }}>{c.icon} {c.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <a href="/blog" style={{ padding: "11px 16px", fontSize: 12.5, fontWeight: 700, color: T.blue, textDecoration: "none", whiteSpace: "nowrap", borderBottom: "2.5px solid transparent", display: "flex", alignItems: "center", gap: 5 }}>📝 Blog</a>
          <button onClick={() => goTo("about")} style={{ background: "none", border: "none", padding: "11px 16px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "inherit", color: T.sub, borderBottom: "2.5px solid transparent" }}>About</button>
          <button onClick={() => goTo("faq")} style={{ background: "none", border: "none", padding: "11px 16px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "inherit", color: T.sub, borderBottom: "2.5px solid transparent" }}>FAQ</button>
        </div>
      </header>

      <main>
      {cat === "all" && !q && (
        <div style={{ background: "linear-gradient(135deg,#1a6ed8 0%,#2563eb 60%,#3b82f6 100%)", padding: "68px 24px 56px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.18)", borderRadius: 24, padding: "6px 22px", fontSize: 11, color: "rgba(255,255,255,0.95)", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 22 }}>72 Research Compounds · Third-Party Tested · COA Included</div>
            <h1 style={{ fontSize: 52, fontWeight: 900, margin: "0 0 16px", lineHeight: 1.04, color: "#fff", letterSpacing: -1.5 }}>Buy Research Peptides Online<br /><span style={{ opacity: 0.85 }}>GLP-1, BPC-157, TB-500 & More</span></h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.82)", lineHeight: 1.75, margin: "0 0 32px", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>Aeterion supplies <strong style={{ color: "#fff" }}>research-grade peptides, GLP-1 agonists, SARMs, and analytical compounds</strong>. Every order ships with a Certificate of Analysis.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 44 }}>
              <button onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "#fff", color: T.blue, border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 18px rgba(0,0,0,0.15)", fontFamily: "inherit" }}>Shop All Products</button>
              <a href="#cat-metabolic" onClick={e => { e.preventDefault(); setCat("metabolic"); window.scrollTo({top:0,behavior:"smooth"}); }} style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.45)", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>GLP-1 / Metabolic →</a>
              <button onClick={() => setShowQuiz(true)} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "2px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(8px)" }}>Build My Stack</button>
            </div>
            <div style={{ display: "flex", gap: 48, justifyContent: "center", flexWrap: "wrap" }}>
              {[["72","Compounds"],["≥99%","Avg Purity"],["1-2d","Processing"],["COA","Every Order"],["8–18%","Bulk Savings"]].map(([v,l]) => (
                <div key={l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{v}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {cat === "all" && !q && (
        <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "14px 24px" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 8 }}>
            {[["Lowest Prices","Competitive research pricing"],["Free Shipping","Orders over $250"],["3rd-Party Tested","Independent HPLC"],["COA Included","With every order"],["Ships USA","1–2 day processing"],["24/7 Support","Expert assistance"]].map(([t,s]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.blue, flexShrink: 0 }} />
                <div><div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{t}</div><div style={{ fontSize: 10, color: T.muted }}>{s}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: T.greenSoft, borderBottom: "1px solid #bbf7d0", padding: "10px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 28, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#15803d", fontWeight: 700 }}>BULK SAVINGS</span>
          <span style={{ fontSize: 12, color: "#166534" }}>Buy 5 vials → <b>8% off</b></span>
          <span style={{ fontSize: 12, color: "#166534" }}>Buy 10 vials → <b>18% off</b></span>
          <span style={{ fontSize: 11, color: T.green }}>Applied automatically at checkout</span>
        </div>
      </div>

      {/* ── TRUST BAR (desktop) ── */}
      <div style={{ background:"#0f172a", borderBottom:"1px solid #1e293b", overflow:"hidden", position:"relative", height:38 }}>
        <style>{`
          @keyframes trust-scroll-d { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
          .trust-ticker-d { display:flex; animation:trust-scroll-d 40s linear infinite; width:max-content; }
          .trust-ticker-d:hover { animation-play-state:paused; }
        `}</style>
        <div style={{ display:"flex", alignItems:"center", height:"100%" }}>
          <div className="trust-ticker-d">
            {[...Array(2)].flatMap(() => [
              "Certificate of Analysis with every order",
              "Cold-chain shipping on all peptides",
              "≥99% purity verified by HPLC",
              "Same-day dispatch on orders before 2pm",
              "256-bit encrypted checkout",
              "Discreet, unmarked packaging",
              "Research grade compounds only",
              "New store — be our first reviewer and get 10% off your next order",
              "Free shipping on orders over $150",
            ]).map((text, i) => (
              <div key={i} style={{ display:"inline-flex", alignItems:"center", gap:12, padding:"0 28px", borderRight:"1px solid rgba(255,255,255,0.07)", whiteSpace:"nowrap", height:38 }}>
                <span style={{ width:4, height:4, borderRadius:"50%", background:"#1a6ed8", flexShrink:0, display:"inline-block" }} />
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.75)", fontWeight:600, letterSpacing:"0.2px" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="catalog" style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px", display: "flex", gap: 28, alignItems: "flex-start" }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width: 210, flexShrink: 0, position: "sticky", top: 80, alignSelf: "flex-start" }}>
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: T.shadow }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Categories</div>
            </div>
            <div style={{ padding: "6px 0 8px" }}>
              <button onClick={() => { setCat("all"); setQ(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ width: "100%", textAlign: "left", background: cat === "all" ? T.blueSoft : "none", border: "none", padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: cat === "all" ? 700 : 500, color: cat === "all" ? T.blue : T.text, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, transition: "background .12s" }}
                onMouseEnter={e => { if (cat !== "all") e.currentTarget.style.background = T.bg; }}
                onMouseLeave={e => { if (cat !== "all") e.currentTarget.style.background = "none"; }}>
                <span>All Products</span>
                <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{PRODUCTS.length}</span>
              </button>
              {CATS.map(c => {
                const count = PRODUCTS.filter(p => p.cat === c.id).length;
                const active = cat === c.id;
                return (
                  <button key={c.id} onClick={() => { setCat(c.id); setQ(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    style={{ width: "100%", textAlign: "left", background: active ? T.blueSoft : "none", border: "none", padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.blue : T.text, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, transition: "background .12s" }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.bg; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "none"; }}>
                    <span>{c.icon} {c.label}</span>
                    <span style={{ fontSize: 11, color: active ? T.blue : T.muted, fontWeight: 600 }}>{count}</span>
                  </button>
                );
              })}
            </div>
            {/* Sort */}
            <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Sort By</div>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "8px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
                <option value="default">Default</option>
                <option value="low">Price: Low → High</option>
                <option value="high">Price: High → Low</option>
                <option value="az">A → Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: T.sub }}><b style={{ color: T.text }}>{products.length}</b> products</div>
        </div>

        {cat !== "all" && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: "0 0 4px" }}>{CATS.find(c => c.id === cat)?.icon} {CATS.find(c => c.id === cat)?.label}</h2>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{products.length} products</p>
          </div>
        )}

        {grouped ? grouped.map(g => (
          <section key={g.id} id={`cat-${g.id}`} style={{ marginBottom: 52 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>{g.label}</h2>
                <span style={{ background: T.blueSoft, border: "1px solid #c7dcf9", borderRadius: 12, padding: "2px 9px", fontSize: 10, color: T.blue, fontWeight: 700 }}>{g.items.length}</span>
              </div>
              <button onClick={() => setCat(g.id)} style={{ ...btnOutline({ padding: "6px 14px", fontSize: 11, borderRadius: 8 }) }}>View All →</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: 14 }}>
              {g.items.map(p => <Card key={p.id} p={p} onOpen={open} onAdd={addCartAndOpen} mob={false} inv={inventory[p.id]} productReviews={reviews[p.id]} />)}
            </div>
          </section>
        )) : (
          products.length === 0 ?
            <div style={{ textAlign: "center", padding: "80px 0", color: T.muted }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg,#1a6ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 13, fontWeight: 800, color: "#fff" }}>AI</div>
              <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600 }}>No results found</div>
              <button onClick={() => { setQ(""); setCat("all"); }} style={{ ...btnPrimary({ marginTop: 14, padding: "9px 20px", fontSize: 13 }) }}>Clear search</button>
            </div> :
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: 14 }}>
              {products.map(p => <Card key={p.id} p={p} onOpen={open} onAdd={addCartAndOpen} mob={false} inv={inventory[p.id]} productReviews={reviews[p.id]} />)}
            </div>
        )}

        {cat === "all" && !q && (
          <section style={{ marginTop: 64, background: T.white, borderRadius: 20, padding: "44px 40px", border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ fontSize: 11, color: T.blue, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Why Researchers Choose Aeterion</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: T.text, margin: "0 0 10px" }}>The Standard for Research Peptides</h2>
              <p style={{ fontSize: 14, color: T.sub, maxWidth: 500, margin: "0 auto", lineHeight: 1.8 }}>Every batch independently tested. Every order ships with a Certificate of Analysis. No exceptions.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
              {[["Third-Party Lab Tested","Every compound undergoes independent HPLC testing before shipment."],["Cold-Chain Shipping","Lyophilized peptides shipped cold-packed to preserve integrity."],["≥98–99% Purity","No fillers, no underdosing. Every compound at stated concentration."],["USA Domestic Shipping","All orders ship from within the USA. Processing 1–2 business days."],["COA with Every Order","Batch numbers and full COA documents with every shipment."],["24/7 Research Support","Protocol questions? Our expert team is always available."]].map(([t,b]) => (
                <div key={t} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: "22px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.blue, marginBottom: 14 }} />
                  <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: T.text }}>{t}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: T.sub, lineHeight: 1.75 }}>{b}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        </div> {/* end main content */}
      </div> {/* end catalog flex */}

      </main>

      <ProductModal />{cartDrawerJSX}

      <footer style={{ background: "#111827", color: "rgba(255,255,255,0.6)", padding: "48px 24px 28px", marginTop: 60 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 36 }}>
            <div>
              <div style={{ marginBottom: 14 }}>
                <AeterionLogo size={38} showText={true} dark={true}/>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.9, margin: "0 0 12px", maxWidth: 280, color: "rgba(255,255,255,0.5)" }}>Premium supplier of research peptides, SARMs, and analytical compounds. COA with every order.</p>
              <a href="mailto:info@aeterionpeptides.com" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>info@aeterionpeptides.com</a>
            </div>
            {[["Products",CATS.map(c=>c.label)],["Company",["About","Contact","FAQ","Wholesale","Military Discounts","Become an Ambassador"]],["Legal",["Terms of Service","Privacy Policy","Return Policy","Disclaimer"]]].map(([t,links]) => (
              <div key={t}>
                <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>{t}</div>
              {links.map(l => {
                  const dest = l === "Contact" ? "contact" : l === "About" ? "about" : l === "FAQ" ? "faq" : l === "Wholesale" ? "wholesale" : (l === "Terms of Service" || l === "Privacy Policy" || l === "Return Policy" || l === "Disclaimer") ? "legal" : null;
                  if (l === "Become an Ambassador") return (
                    <a key={l} href="/ambassador/apply" style={{ display: "block", color: "#60a5fa", fontSize: 12, marginBottom: 9, textDecoration: "none", fontWeight: 600 }}>✦ Become an Ambassador</a>
                  );
                  return dest
                    ? <a key={l} href={`#${dest}`} onClick={e => { e.preventDefault(); goTo(dest); }} style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 9, textDecoration: "none" }} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}>{l}</a>
                    : <div key={l} style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 9, cursor: "default" }}>{l}</div>;
                })}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>© 2025 Aeterion Peptides. All Rights Reserved.</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", maxWidth: 500, textAlign: "right", lineHeight: 1.7 }}>All products are for laboratory research purposes only. Not for human consumption. Must be 18+. Not evaluated by the FDA.</div>
          </div>
        </div>
      </footer>


      {/* ══════════ AI RESEARCH ASSISTANT ══════════ */}
      {(() => {
        const SUGGESTIONS = [
          "Best stack for fat loss?",
          "GLP-1 comparison — Sema vs Tirze vs Retatra?",
          "Recovery stack for joint repair?",
          "Best nootropic peptides for focus?",
          "GH axis stack for beginners?",
          "What's the difference between BPC-157 and TB-500?",
        ];

        return (
          <>
            {/* Floating button */}
            {(!mob || !widgetHidden) && <button
              onClick={() => setChatOpen(o => !o)}
              style={{
                position: "fixed", bottom: mob ? 82 : 28, right: 24, zIndex: 8000,
                width: 56, height: 56, borderRadius: "50%",
                background: chatOpen ? "#0f172a" : "linear-gradient(135deg,#1a6ed8,#2563eb)",
                border: chatOpen ? "2px solid #334155" : "none",
                color: "#fff", fontSize: 22, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(26,110,216,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s",
              }}
              title="AI Research Assistant"
            >
              "AI"
            </button>}

            {/* Mobile pull tab — always visible on mobile, hides/shows entire widget */}
            {mob && (
              <div
                onClick={() => { setWidgetHidden(h => !h); if (!widgetHidden) { setChatOpen(false); } }}
                style={{
                  position: "fixed", right: 0, bottom: 140, zIndex: 8002,
                  background: "linear-gradient(135deg,#1a6ed8,#2563eb)",
                  color: "#fff", fontSize: 11, fontWeight: 700,
                  padding: "10px 6px", borderRadius: "10px 0 0 10px",
                  cursor: "pointer", writingMode: "vertical-rl",
                  textOrientation: "mixed", letterSpacing: 1,
                  boxShadow: "-3px 0 12px rgba(26,110,216,0.35)",
                  userSelect: "none", display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {widgetHidden ? "◀ AI" : "▶ AI"}
              </div>
            )}

            {/* Speech bubble — mobile only, when closed */}
            {mob && !widgetHidden && !chatOpen && !bubbleDismissed && (
              <div style={{
                position: "fixed", bottom: 148, right: 18, zIndex: 8001,
                background: "#1a6ed8", color: "#fff",
                fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                padding: "8px 14px", borderRadius: "14px 14px 4px 14px",
                boxShadow: "0 4px 14px rgba(26,110,216,0.45)",
                pointerEvents: "none",
                animation: "bubble-bounce 2.5s ease-in-out infinite",
              }}>
                <span>AI Research Assistant</span>
                <button onClick={() => setBubbleDismissed(true)} style={{ marginLeft: 8, background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 0 0 4px" }}>✕</button>
                <div style={{ position: "absolute", bottom: -6, right: 16, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #1a6ed8" }} />
              </div>
            )}
            <style>{`@keyframes bubble-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>

            {/* Chat panel */}
            {chatOpen && (!mob || !widgetHidden) && (
              <div style={{
                position: "fixed", bottom: mob ? 150 : 96, right: 24, zIndex: 7999,
                width: mob ? "calc(100vw - 32px)" : 380,
                maxHeight: mob ? "65vh" : 540,
                background: "#0f172a", borderRadius: 20,
                border: "1px solid #1e293b",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                display: "flex", flexDirection: "column", overflow: "hidden",
              }}>

                {/* Header */}
                <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid #1e293b", background: "#0f172a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1a6ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>AI</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>Research Assistant</div>
                      <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                        Powered by Gemini · Aeterion Catalog
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}
                  ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>

                  {chatMessages.length === 0 && (
                    <div>
                      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 14 }}>
                        Ask me anything about research compounds, stacks, mechanisms, or protocols. I know the full Aeterion catalog.
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {SUGGESTIONS.map((s, i) => (
                          <button key={i} onClick={() => sendMessage(s)}
                            style={{ textAlign: "left", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "9px 13px", fontSize: 12, color: "#cbd5e1", cursor: "pointer", fontFamily: "inherit", transition: "border-color .15s" }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = "#1a6ed8"}
                            onMouseLeave={e => e.currentTarget.style.borderColor = "#334155"}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {chatMessages.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "85%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: m.role === "user" ? "#1a6ed8" : "#1e293b",
                        fontSize: 13, color: m.role === "user" ? "#fff" : "#e2e8f0",
                        lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word",
                      }}>
                        {m.content}
                        {m.role === "assistant" && chatStreaming && i === chatMessages.length - 1 && (
                          <span style={{ display: "inline-block", width: 8, height: 13, background: "#4ade80", borderRadius: 2, marginLeft: 3, animation: "blink 1s infinite" }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div style={{ padding: "12px 14px", borderTop: "1px solid #1e293b", display: "flex", gap: 8 }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
                    placeholder="Ask about compounds, stacks, protocols…"
                    disabled={chatStreaming}
                    autoComplete="off"
                    style={{ flex: 1, background: "#1e293b", border: "1.5px solid #334155", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#f1f5f9", outline: "none", fontFamily: "inherit", resize: "none" }}
                    onFocus={e => e.target.style.borderColor = "#1a6ed8"}
                    onBlur={e => e.target.style.borderColor = "#334155"}
                  />
                  <button
                    onClick={() => sendMessage(chatInput)}
                    disabled={chatStreaming || !chatInput.trim()}
                    style={{ background: chatStreaming || !chatInput.trim() ? "#1e293b" : "#1a6ed8", border: "none", borderRadius: 10, width: 40, height: 40, cursor: chatStreaming ? "wait" : "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s" }}>
                    {chatStreaming ? "⏳" : "↑"}
                  </button>
                </div>

                <div style={{ padding: "6px 14px 10px", fontSize: 10, color: "#334155", textAlign: "center" }}>
                  For research purposes only · Not medical advice
                </div>
              </div>
            )}

            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
          </>
        );
      })()}

      {/* ══════════ EMAIL CAPTURE POPUP ══════════ */}
      {emailPopup && !emailPopupDone && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
          onClick={e => { if (e.target===e.currentTarget){ setEmailPopup(false); localStorage.setItem("aet_popup_v2","1"); setEmailPopupDone(true); }}}>
          <div style={{ background:"#0f172a",borderRadius:20,padding:"40px 36px",maxWidth:460,width:"100%",position:"relative",border:"1px solid #1e293b",textAlign:"center" }}>
            <button onClick={()=>{ setEmailPopup(false); localStorage.setItem("aet_popup_v2","1"); setEmailPopupDone(true); }}
              style={{ position:"absolute",top:16,right:18,background:"none",border:"none",color:"#64748b",fontSize:22,cursor:"pointer",lineHeight:1 }}>×</button>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#1a6ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 11, fontWeight: 800, color: "#fff" }}>STACK</div>
            <div style={{ fontSize:22,fontWeight:900,color:"#f8fafc",marginBottom:8 }}>10% Off Your First Order</div>
            <div style={{ fontSize:14,color:"#94a3b8",marginBottom:24,lineHeight:1.6 }}>
              Join thousands of researchers. Get exclusive access to new compounds, lab notes, and a <strong style={{ color:"#4ade80" }}>10% discount</strong> on your first order.
            </div>
            {emailPopupStatus==="done" ? (
              <div style={{ background:"#14532d",borderRadius:12,padding:"18px",fontSize:15,fontWeight:700,color:"#4ade80" }}>
                ✓ Check your inbox! Your code is on its way.
              </div>
            ) : (
              <>
                <div style={{ display:"flex",gap:8,marginBottom:12 }}>
                  <input type="email" placeholder="your@email.com" value={emailPopupVal}
                    onChange={e=>setEmailPopupVal(e.target.value)}
                    style={{ flex:1,background:"#1e293b",border:"1.5px solid #334155",borderRadius:10,padding:"12px 16px",fontSize:14,color:"#f8fafc",outline:"none",fontFamily:"inherit" }}
                  />
                  <button disabled={emailPopupStatus==="sending"}
                    onClick={()=>{
                      if(!emailPopupVal.includes("@")) return;
                      setEmailPopupStatus("sending");
                      fetch("/api/email-capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:emailPopupVal})})
                        .then(()=>setEmailPopupStatus("done")).catch(()=>setEmailPopupStatus("done"));
                    }}
                    style={{ background:"#1a6ed8",border:"none",color:"#fff",fontWeight:700,fontSize:14,padding:"12px 20px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>
                    {emailPopupStatus==="sending"?"...":"Get 10% Off"}
                  </button>
                </div>
                <div style={{ fontSize:11,color:"#475569" }}>No spam. Unsubscribe anytime.</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════ CART ABANDONMENT POPUP ══════════ */}
      {abandonPopup && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9001,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}
          onClick={e=>{ if(e.target===e.currentTarget){ setAbandonPopup(false); localStorage.setItem("aet_abandon_done","1"); }}}>
          <div style={{ background:"#0f172a",borderRadius:20,padding:"36px 32px",maxWidth:440,width:"100%",position:"relative",border:"1px solid #1e293b",textAlign:"center" }}>
            <button onClick={()=>{ setAbandonPopup(false); localStorage.setItem("aet_abandon_done","1"); }}
              style={{ position:"absolute",top:16,right:18,background:"none",border:"none",color:"#64748b",fontSize:22,cursor:"pointer",lineHeight:1 }}>×</button>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Your cart is empty</div>
            <div style={{ fontSize:20,fontWeight:900,color:"#f8fafc",marginBottom:8 }}>Still thinking it over?</div>
            <div style={{ fontSize:14,color:"#94a3b8",marginBottom:20,lineHeight:1.6 }}>
              You have <strong style={{ color:"#f8fafc" }}>{cart.length} item{cart.length!==1?"s":""}</strong> in your cart. Enter your email and we'll send you a reminder — plus an <strong style={{ color:"#4ade80" }}>extra 5% off</strong>.
            </div>
            {abandonStatus==="done" ? (
              <div style={{ background:"#14532d",borderRadius:12,padding:"16px",fontSize:14,fontWeight:700,color:"#4ade80" }}>
                ✓ Cart saved! Check your inbox for your discount.
              </div>
            ) : (
              <>
                <div style={{ display:"flex",gap:8,marginBottom:10 }}>
                  <input type="email" placeholder="your@email.com" value={abandonEmail}
                    onChange={e=>setAbandonEmail(e.target.value)}
                    style={{ flex:1,background:"#1e293b",border:"1.5px solid #334155",borderRadius:10,padding:"12px 14px",fontSize:14,color:"#f8fafc",outline:"none",fontFamily:"inherit" }}
                  />
                  <button disabled={abandonStatus==="sending"}
                    onClick={()=>{
                      if(!abandonEmail.includes("@")) return;
                      setAbandonStatus("sending");
                      fetch("/api/email-capture",{ method:"POST",headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({ email:abandonEmail, source:"abandon", cartItems: cart.map(i=>i.name), discountCode:"SAVE5" })
                      }).then(()=>{ setAbandonStatus("done"); localStorage.setItem("aet_abandon_done","1"); }).catch(()=>setAbandonStatus("done"));
                    }}
                    style={{ background:"#1a6ed8",border:"none",color:"#fff",fontWeight:700,fontSize:13,padding:"12px 16px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>
                    {abandonStatus==="sending"?"...":"Save Cart"}
                  </button>
                </div>
                <button onClick={()=>{ setAbandonPopup(false); localStorage.setItem("aet_abandon_done","1"); setCartOpen(true); }}
                  style={{ background:"none",border:"none",color:"#4ade80",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
                  Complete my order now →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════ BUILD YOUR STACK ══════════ */}
      {showQuiz && <QuizModal />}

    </div>
  );
}

/**
 * getStaticProps — runs at build time on the server.
 * Fetches product list from Supabase so the HTML Google receives
 * contains ALL 79 product names, descriptions, and categories.
 * Even if this fetch fails, the component falls back to the embedded PRODUCTS array.
 */
export async function getStaticProps() {
  try {
    const SB_URL = "https://kafwkhbzdtpsxkufmkmm.supabase.co";
    const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZndraGJ6ZHRwc3hrdWZta21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDEyODAsImV4cCI6MjA4ODQ3NzI4MH0.sa4_CFHQpBkWVc02et_pSsu35wqPLQpD8g4WIxYRCIA";
    const res = await fetch(`${SB_URL}/rest/v1/products?select=id,stock,in_stock`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const inventory = res.ok ? await res.json() : [];
    return {
      props: { serverInventory: inventory },
      revalidate: 300, // ISR: rebuild page every 5 minutes
    };
  } catch {
    return { props: { serverInventory: [] }, revalidate: 60 };
  }
}
