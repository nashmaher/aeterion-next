// lib/stackIntelligence.js
// Product intelligence system for the Build My Stack feature.
// All tags are grounded in real product descriptions and categories from products.js.
// No fabricated data, benefits, or medical claims.

const { PRODUCTS } = require('./products');

// ──────────────────────────────────────────────────────────────
// GOAL TAGS — relevance scores (0-10) for each product by goal
// Derived from actual product descriptions, categories, and
// published research references already in the codebase.
// ──────────────────────────────────────────────────────────────

const PRODUCT_TAGS = {
  // ── METABOLIC / GLP-1 ──
  1:  { goals: { fatLoss: 10, muscle: 3, longevity: 4 }, exp: "beginner", budgetTier: "mid", purpose: "glp1-agonist", role: "foundation", notes: "GLP-1 receptor agonist; well-studied for metabolic research" },
  2:  { goals: { fatLoss: 10, muscle: 4, longevity: 4 }, exp: "beginner", budgetTier: "mid", purpose: "glp1-gip-agonist", role: "foundation", notes: "Dual GIP/GLP-1 agonist; superior metabolic response in trials" },
  3:  { goals: { fatLoss: 10, muscle: 4, longevity: 5 }, exp: "advanced", budgetTier: "premium", purpose: "triple-agonist", role: "foundation", notes: "Triple agonist (GLP-1/GIP/glucagon); emerging compound" },
  4:  { goals: { fatLoss: 8, muscle: 2, longevity: 3 }, exp: "beginner", budgetTier: "mid", purpose: "glp1-agonist", role: "foundation", notes: "Daily GLP-1 analogue; well-characterized research tool" },
  5:  { goals: { fatLoss: 7, muscle: 2, longevity: 3 }, exp: "beginner", budgetTier: "mid", purpose: "glp1-agonist", role: "foundation", notes: "Once-weekly GLP-1; Fc-fused for extended action" },
  6:  { goals: { fatLoss: 9, muscle: 3, longevity: 4 }, exp: "advanced", budgetTier: "premium", purpose: "glp1-glucagon-agonist", role: "foundation", notes: "Dual GLP-1/glucagon agonist; thermogenic properties" },
  7:  { goals: { fatLoss: 9, muscle: 3, longevity: 4 }, exp: "advanced", budgetTier: "premium", purpose: "glp1-glucagon-agonist", role: "foundation", notes: "GLP-1/glucagon co-agonist; liver health research" },
  8:  { goals: { fatLoss: 8, muscle: 2, longevity: 3 }, exp: "intermediate", budgetTier: "mid", purpose: "amylin-agonist", role: "amplifier", notes: "Long-acting amylin analogue; complementary to GLP-1" },
  9:  { goals: { fatLoss: 10, muscle: 3, longevity: 4 }, exp: "intermediate", budgetTier: "mid", purpose: "combo-metabolic", role: "foundation", notes: "Cagrilintide + Semaglutide combo; dual mechanism" },

  // ── GROWTH HORMONE ──
  11: { goals: { muscle: 8, recovery: 5, fatLoss: 4, longevity: 5, sleep: 4 }, exp: "beginner", budgetTier: "budget", purpose: "gh-secretagogue", role: "foundation", notes: "Selective GH secretagogue; clean profile, no cortisol spike" },
  12: { goals: { muscle: 7, recovery: 4, fatLoss: 3, longevity: 4, sleep: 3 }, exp: "beginner", budgetTier: "budget", purpose: "ghrh-analogue", role: "amplifier", notes: "Pulsatile GHRH analogue; physiological GH pattern" },
  13: { goals: { muscle: 8, recovery: 5, fatLoss: 4, longevity: 5, sleep: 4 }, exp: "intermediate", budgetTier: "mid", purpose: "ghrh-dac", role: "foundation", notes: "Long-acting GHRH with DAC; ~8-day half-life" },
  14: { goals: { muscle: 8, recovery: 5, fatLoss: 4 }, exp: "intermediate", budgetTier: "budget", purpose: "gh-secretagogue", role: "amplifier", notes: "Potent GH stimulator via ghrelin receptor" },
  15: { goals: { muscle: 7, recovery: 4, fatLoss: 3 }, exp: "intermediate", budgetTier: "budget", purpose: "gh-secretagogue", role: "amplifier", notes: "Original GHRP; notable appetite stimulation" },
  16: { goals: { muscle: 8, recovery: 5, fatLoss: 4 }, exp: "advanced", budgetTier: "mid", purpose: "gh-secretagogue", role: "amplifier", notes: "Strongest GHRP; also studied for cardioprotection" },
  17: { goals: { muscle: 7, recovery: 4, fatLoss: 3, longevity: 4 }, exp: "beginner", budgetTier: "budget", purpose: "ghrh-analogue", role: "foundation", notes: "GHRH(1-29) analogue; pituitary stimulation" },
  19: { goals: { muscle: 7, fatLoss: 7, recovery: 4, longevity: 4 }, exp: "intermediate", budgetTier: "mid", purpose: "ghrh-analogue", role: "foundation", notes: "Stabilized GHRH analogue; visceral fat research" },
  20: { goals: { muscle: 10, recovery: 5, fatLoss: 3 }, exp: "advanced", budgetTier: "premium", purpose: "igf1-signaling", role: "amplifier", notes: "Recombinant IGF-1 LR3; extended half-life, potent anabolic signaling" },
  21: { goals: { muscle: 10, fatLoss: 4 }, exp: "advanced", budgetTier: "premium", purpose: "myostatin-inhibitor", role: "amplifier", notes: "Myostatin/activin antagonist; advanced muscle research" },

  // ── RECOVERY & HEALING ──
  22: { goals: { recovery: 10, muscle: 4, fatLoss: 2, longevity: 4 }, exp: "beginner", budgetTier: "budget", purpose: "tissue-repair", role: "foundation", notes: "Most studied healing peptide; tendon, ligament, GI repair" },
  23: { goals: { recovery: 9, muscle: 4, longevity: 3 }, exp: "beginner", budgetTier: "budget", purpose: "tissue-repair-systemic", role: "amplifier", notes: "Systemic anti-inflammatory; cell migration and differentiation" },
  24: { goals: { recovery: 10, muscle: 5, longevity: 4 }, exp: "beginner", budgetTier: "mid", purpose: "tissue-repair-blend", role: "foundation", notes: "BPC-157 + TB-500 synergistic blend; local + systemic repair" },
  25: { goals: { recovery: 10, skin: 8, longevity: 5 }, exp: "intermediate", budgetTier: "mid", purpose: "multi-repair-blend", role: "foundation", notes: "BPC-157 + GHK-Cu + TB-500 blend; comprehensive recovery" },
  26: { goals: { recovery: 7, immune: 5 }, exp: "intermediate", budgetTier: "mid", purpose: "anti-inflammatory-gut", role: "support", notes: "Alpha-MSH tripeptide; gut inflammation research" },
  27: { goals: { recovery: 6, immune: 7 }, exp: "intermediate", budgetTier: "mid", purpose: "antimicrobial", role: "support", notes: "Human cathelicidin; antimicrobial and wound healing" },
  28: { goals: { recovery: 7, skin: 9, longevity: 6 }, exp: "beginner", budgetTier: "budget", purpose: "collagen-repair", role: "support", notes: "Copper-binding tripeptide; collagen synthesis and antioxidant" },
  29: { goals: { immune: 9, longevity: 7, recovery: 5 }, exp: "intermediate", budgetTier: "mid", purpose: "immune-modulator", role: "support", notes: "T-cell enhancement; antiviral and immunotherapy research" },
  31: { goals: { longevity: 8, recovery: 6, muscle: 3 }, exp: "advanced", budgetTier: "premium", purpose: "mitochondrial-support", role: "optimizer", notes: "Mitochondria-targeted; oxidative stress and energy metabolism" },
  32: { goals: { recovery: 6, immune: 6, cognitive: 4 }, exp: "advanced", budgetTier: "mid", purpose: "neuropeptide-anti-inflammatory", role: "support", notes: "VIP neuropeptide; anti-inflammatory and bronchodilatory" },

  // ── LONGEVITY ──
  33: { goals: { longevity: 10, sleep: 5, immune: 4 }, exp: "intermediate", budgetTier: "mid", purpose: "telomerase-activator", role: "foundation", notes: "Telomerase activation; circadian regulation" },
  34: { goals: { longevity: 9, recovery: 5, cognitive: 5, muscle: 3 }, exp: "beginner", budgetTier: "budget", purpose: "cellular-energy", role: "foundation", notes: "Critical coenzyme; mitochondrial function and DNA repair" },
  37: { goals: { longevity: 8, cognitive: 5, recovery: 4 }, exp: "advanced", budgetTier: "mid", purpose: "mito-derived-peptide", role: "support", notes: "Mitochondria-derived; neuroprotective and cardioprotective" },
  38: { goals: { longevity: 8, fatLoss: 5, muscle: 5 }, exp: "intermediate", budgetTier: "mid", purpose: "mito-derived-peptide", role: "amplifier", notes: "Mitochondrial peptide; metabolic homeostasis and exercise capacity" },
  41: { goals: { longevity: 7, immune: 8 }, exp: "intermediate", budgetTier: "budget", purpose: "thymic-peptide", role: "support", notes: "Thymic extract; T-cell restoration and immune function" },

  // ── COGNITIVE & NEURO ──
  42: { goals: { cognitive: 10, recovery: 3, longevity: 3 }, exp: "beginner", budgetTier: "mid", purpose: "nootropic-bdnf", role: "foundation", notes: "ACTH analogue; BDNF upregulation and neuroprotection" },
  43: { goals: { cognitive: 8, immune: 4, sleep: 4 }, exp: "beginner", budgetTier: "mid", purpose: "anxiolytic-nootropic", role: "amplifier", notes: "Tuftsin analogue; anxiolytic without sedation or tolerance" },
  44: { goals: { cognitive: 10, longevity: 4 }, exp: "advanced", budgetTier: "premium", purpose: "nootropic-synaptogenesis", role: "amplifier", notes: "Angiotensin IV derivative; potent synaptogenesis" },
  45: { goals: { cognitive: 8, recovery: 5 }, exp: "intermediate", budgetTier: "mid", purpose: "neurotrophic-mix", role: "foundation", notes: "Neuropeptide mix; neuroplasticity and TBI research" },
  50: { goals: { sleep: 10, cognitive: 5, recovery: 4 }, exp: "beginner", budgetTier: "budget", purpose: "sleep-peptide", role: "support", notes: "Sleep architecture research; stress and GH modulation" },
  51: { goals: { cognitive: 9, longevity: 3 }, exp: "advanced", budgetTier: "premium", purpose: "nootropic-advanced", role: "amplifier", notes: "Enhanced BBB penetration; memory consolidation" },
  52: { goals: { cognitive: 7, sleep: 3 }, exp: "advanced", budgetTier: "mid", purpose: "antidepressant-peptide", role: "support", notes: "TREK-1 modulator; rapid-onset antidepressant research" },

  // ── BODY COMPOSITION ──
  53: { goals: { fatLoss: 8, muscle: 3 }, exp: "beginner", budgetTier: "budget", purpose: "lipolytic-fragment", role: "amplifier", notes: "hGH fragment 176-191; lipolytic without insulin effects" },
  54: { goals: { fatLoss: 8, muscle: 3 }, exp: "beginner", budgetTier: "budget", purpose: "lipolytic-fragment", role: "amplifier", notes: "C-terminal hGH fragment; selective lipolysis" },
  55: { goals: { fatLoss: 7, muscle: 2 }, exp: "advanced", budgetTier: "mid", purpose: "adipose-targeting", role: "amplifier", notes: "Proapoptotic; selectively targets adipose vasculature" },
  56: { goals: { fatLoss: 7, muscle: 3, longevity: 4 }, exp: "intermediate", budgetTier: "mid", purpose: "nnmt-inhibitor", role: "support", notes: "NNMT inhibitor; NAD+ restoration in adipose tissue" },
  57: { goals: { fatLoss: 6, muscle: 6, longevity: 5 }, exp: "advanced", budgetTier: "mid", purpose: "exercise-mimetic", role: "amplifier", notes: "ERR agonist; exercise mimetic and mitochondrial biogenesis" },
  58: { goals: { muscle: 9, fatLoss: 3 }, exp: "advanced", budgetTier: "premium", purpose: "myostatin-inhibitor", role: "amplifier", notes: "ActRIIB fusion protein; myostatin trap" },
  59: { goals: { fatLoss: 5, muscle: 4, recovery: 3 }, exp: "beginner", budgetTier: "budget", purpose: "fat-transport", role: "support", notes: "Fatty acid transport to mitochondria; exercise performance" },
  60: { goals: { fatLoss: 6, muscle: 2 }, exp: "beginner", budgetTier: "budget", purpose: "lipotropic-blend", role: "support", notes: "Lipotropic compound blend; fat metabolism support" },
  61: { goals: { fatLoss: 6, muscle: 2, cognitive: 2 }, exp: "beginner", budgetTier: "budget", purpose: "lipotropic-b12", role: "support", notes: "MIC + B12; lipotropic with energy metabolism" },
  62: { goals: { fatLoss: 5, skin: 3 }, exp: "beginner", budgetTier: "budget", purpose: "lipolytic-topical", role: "support", notes: "Riboflavin-based lipolytic; adipocyte metabolism" },
  63: { goals: { fatLoss: 7, muscle: 5, longevity: 5 }, exp: "advanced", budgetTier: "mid", purpose: "ampk-activator", role: "amplifier", notes: "AMPK activator; exercise-like metabolic effects" },
  64: { goals: { recovery: 6, cognitive: 4, immune: 4 }, exp: "advanced", budgetTier: "mid", purpose: "epo-derived", role: "support", notes: "EPO-derived; innate repair receptor activation" },

  // ── HORMONAL ──
  65: { goals: { muscle: 6, recovery: 4 }, exp: "intermediate", budgetTier: "mid", purpose: "gonadotropin", role: "support", notes: "LH-like activity; testosterone stimulation research" },
  66: { goals: { muscle: 5, recovery: 3 }, exp: "advanced", budgetTier: "mid", purpose: "gonadotropin-combo", role: "support", notes: "FSH + LH activity; reproductive research" },
  67: { goals: { muscle: 5, recovery: 3 }, exp: "intermediate", budgetTier: "budget", purpose: "gnrh-agonist", role: "support", notes: "Synthetic GnRH; HPG axis research" },
  68: { goals: { cognitive: 4, sleep: 3, recovery: 3 }, exp: "intermediate", budgetTier: "budget", purpose: "neuropeptide-social", role: "support", notes: "Hypothalamic peptide; social bonding and anxiety research" },
  69: { goals: { muscle: 5, recovery: 3 }, exp: "advanced", budgetTier: "mid", purpose: "hpg-regulator", role: "support", notes: "HPG axis regulator; GnRH stimulation" },
  70: { goals: { muscle: 4, recovery: 2 }, exp: "advanced", budgetTier: "mid", purpose: "gnrh-agonist-potent", role: "support", notes: "Potent GnRH agonist; HPG axis modulation" },
  71: { goals: { recovery: 2, cognitive: 3 }, exp: "intermediate", budgetTier: "mid", purpose: "melanocortin-cns", role: "support", notes: "Melanocortin agonist; central CNS pathway research" },
  72: { goals: { recovery: 3 }, exp: "advanced", budgetTier: "mid", purpose: "opioid-research", role: "support", notes: "Endogenous opioid; pain pathway research" },
  73: { goals: { longevity: 9, recovery: 4 }, exp: "advanced", budgetTier: "mid", purpose: "senolytic", role: "amplifier", notes: "FOXO4-DRI; senescent cell clearance" },

  // ── COSMETIC ──
  74: { goals: { skin: 7, longevity: 2 }, exp: "beginner", budgetTier: "budget", purpose: "melanogenesis", role: "support", notes: "Alpha-MSH analogue; melanogenesis via MC1R" },
  75: { goals: { skin: 7, longevity: 2 }, exp: "intermediate", budgetTier: "budget", purpose: "melanogenesis-broad", role: "support", notes: "Broad melanocortin receptor binding; CNS effects" },
  76: { goals: { skin: 8, longevity: 5, immune: 4 }, exp: "beginner", budgetTier: "mid", purpose: "antioxidant", role: "support", notes: "Master antioxidant; oxidative stress and melanin modulation" },
  77: { goals: { skin: 8, longevity: 2 }, exp: "intermediate", budgetTier: "mid", purpose: "cosmetic-peptide", role: "support", notes: "SNAP-25 analogue; neuromuscular modulation for expression lines" },

  // ── BLENDS & SPECIAL ──
  80: { goals: { muscle: 9, fatLoss: 5, recovery: 5, longevity: 5 }, exp: "intermediate", budgetTier: "premium", purpose: "full-hgh", role: "foundation", notes: "Full 191aa recombinant hGH; IGF-1 stimulation" },
  81: { goals: { muscle: 8, recovery: 5, fatLoss: 4, longevity: 5, sleep: 5 }, exp: "beginner", budgetTier: "budget", purpose: "gh-blend", role: "foundation", notes: "CJC-1295 + Ipamorelin pre-combined; synergistic GH release" },
  82: { goals: { recovery: 10, skin: 7, immune: 5, longevity: 5 }, exp: "intermediate", budgetTier: "mid", purpose: "quad-recovery-blend", role: "foundation", notes: "BPC+GHK-Cu+TB500+KPV quad blend; comprehensive recovery" },
  83: { goals: { fatLoss: 7, muscle: 2 }, exp: "advanced", budgetTier: "mid", purpose: "adipose-targeting", role: "amplifier", notes: "FTPP Adipotide; visceral fat research in primate models" },
};

// Map goal keywords from quiz to tag keys
const GOAL_MAP = {
  fat: "fatLoss",
  recovery: "recovery",
  growth: "muscle",
  neuro: "cognitive",
  longevity: "longevity",
};

// Secondary focus mapping to supplementary goal boosts
const SECONDARY_BOOST = {
  gut: { recovery: 3, immune: 2 },
  energy: { fatLoss: 2, longevity: 2 },
  inflammation: { recovery: 3, immune: 2 },
  sleep: { sleep: 5, recovery: 2 },
  immune: { immune: 5, longevity: 2 },
  collagen: { skin: 5, recovery: 2 },
  neuroprotection: { cognitive: 3, longevity: 2 },
  mood: { cognitive: 3 },
  metabolic: { fatLoss: 3, longevity: 2 },
  cardio: { longevity: 3, recovery: 2 },
  skin: { skin: 5, recovery: 2 },
  joint: { recovery: 4 },
  fatox: { fatLoss: 4 },
  ghpulse: { muscle: 3, sleep: 3 },
  anxiety: { cognitive: 3, sleep: 2 },
  none: {},
};

// Products to EXCLUDE from stacks (ancillaries, reconstitution supplies)
const EXCLUDED_IDS = new Set([78, 79]);

// Avoid pairing products with same purpose (prevents duplicate-purpose items)
// Products sharing a purpose compete for the same slot
// purposeGroup → only pick ONE from each group
const PURPOSE_GROUPS = {
  "glp1": [1, 2, 3, 4, 5, 6, 7, 9],
  "gh-secretagogue": [11, 14, 15, 16],
  "ghrh": [12, 13, 17, 19],
  "lipolytic-fragment": [53, 54],
  "adipose-targeting": [55, 83],
  "tissue-repair-single": [22, 24, 25, 82],
  "melanogenesis": [74, 75],
  "gonadotropin": [65, 66],
  "gnrh": [67, 69, 70],
  "lipotropic": [60, 61],
};

// Known complementary pairings (product ID pairs that work well together)
const COMPLEMENTS = [
  [11, 12],  // Ipamorelin + CJC-1295 (GHRP + GHRH synergy)
  [22, 23],  // BPC-157 + TB-500 (local + systemic repair)
  [22, 28],  // BPC-157 + GHK-Cu (repair + collagen)
  [42, 43],  // Semax + Selank (cognitive + anxiolytic)
  [1, 8],    // Semaglutide + Cagrilintide (GLP-1 + amylin)
  [33, 34],  // Epitalon + NAD+ (telomerase + cellular energy)
  [33, 29],  // Epitalon + Thymosin Alpha-1 (longevity + immune)
  [34, 38],  // NAD+ + MOTS-c (cellular energy + mitochondrial)
  [11, 22],  // Ipamorelin + BPC-157 (GH + repair)
  [42, 50],  // Semax + DSIP (daytime focus + sleep)
  [53, 59],  // AOD9604 + L-Carnitine (lipolysis + fat transport)
  [1, 53],   // Semaglutide + AOD9604 (appetite + lipolysis)
  [29, 41],  // Thymosin Alpha-1 + Thymalin (immune stack)
  [22, 29],  // BPC-157 + Thymosin Alpha-1 (repair + immune)
  [76, 28],  // Glutathione + GHK-Cu (antioxidant + collagen)
  [80, 22],  // HGH + BPC-157 (growth + repair)
];

// Experience level ordering for filtering
const EXP_LEVELS = { beginner: 0, intermediate: 1, advanced: 2 };

// Stack size targets
const STACK_SIZES = {
  beginner: { min: 2, max: 3 },
  intermediate: { min: 3, max: 4 },
  advanced: { min: 4, max: 5 },
};

// ──────────────────────────────────────────────────────────────
// RECOMMENDATION ENGINE
// ──────────────────────────────────────────────────────────────

function recommendStack(answers) {
  const { goal, secondary, exp, budget, cycle } = answers;
  const primaryGoalKey = GOAL_MAP[goal] || "recovery";
  const secondaryBoosts = SECONDARY_BOOST[secondary] || {};
  const userExpLevel = EXP_LEVELS[exp] || 0;
  const stackSize = STACK_SIZES[exp] || STACK_SIZES.beginner;

  // Budget price ranges per compound (approximate)
  const budgetRanges = {
    low:  { max: 80 },
    mid:  { max: 160 },
    high: { max: 999 },
  };
  const budgetConfig = budgetRanges[budget] || budgetRanges.mid;

  // Step 1: Score every product
  const scored = [];
  for (const product of PRODUCTS) {
    if (EXCLUDED_IDS.has(product.id)) continue;
    const tags = PRODUCT_TAGS[product.id];
    if (!tags) continue;

    // Experience filter: don't suggest advanced products to beginners
    const productExp = EXP_LEVELS[tags.exp] || 0;
    if (productExp > userExpLevel) continue;

    // Budget filter: check cheapest variant
    const cheapest = Math.min(...product.variants.map(v => v.p));
    if (budget === "low" && cheapest > budgetConfig.max) continue;

    // Primary goal score
    let score = (tags.goals[primaryGoalKey] || 0) * 10;

    // Secondary goal boosts
    for (const [boostGoal, boostVal] of Object.entries(secondaryBoosts)) {
      score += (tags.goals[boostGoal] || 0) * boostVal * 0.5;
    }

    // Budget alignment bonus
    if (budget === "low" && tags.budgetTier === "budget") score += 5;
    if (budget === "mid" && tags.budgetTier !== "premium") score += 3;
    if (budget === "high" && tags.budgetTier === "premium") score += 5;

    // Badge bonus (popular/best seller items have proven demand)
    if (product.badge === "Best Seller") score += 4;
    if (product.badge === "Popular") score += 3;

    // Blend bonus for beginners (convenience)
    if (exp === "beginner" && tags.purpose.includes("blend")) score += 6;

    // Longer cycles allow more complex compounds
    if (cycle === "16wk" && productExp >= 1) score += 2;
    if (cycle === "8wk" && tags.budgetTier === "premium") score -= 3;

    scored.push({ product, tags, score, cheapest });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Step 2: Select products avoiding duplicates and respecting purpose groups
  const selected = [];
  const usedPurposeGroups = new Set();
  const usedIds = new Set();

  function getPurposeGroup(id) {
    for (const [group, ids] of Object.entries(PURPOSE_GROUPS)) {
      if (ids.includes(id)) return group;
    }
    return null;
  }

  // First pass: pick foundation
  for (const item of scored) {
    if (selected.length >= 1) break;
    if (item.tags.role === "foundation" && item.score > 30) {
      selected.push(item);
      usedIds.add(item.product.id);
      const pg = getPurposeGroup(item.product.id);
      if (pg) usedPurposeGroups.add(pg);
    }
  }

  // Second pass: fill remaining slots with best-scoring non-conflicting products
  for (const item of scored) {
    if (selected.length >= stackSize.max) break;
    if (usedIds.has(item.product.id)) continue;

    // Check purpose group conflicts
    const pg = getPurposeGroup(item.product.id);
    if (pg && usedPurposeGroups.has(pg)) continue;

    // Check if this adds diversity (not too many of same cat)
    const catCount = selected.filter(s => s.product.cat === item.product.cat).length;
    if (catCount >= 2) continue;

    selected.push(item);
    usedIds.add(item.product.id);
    if (pg) usedPurposeGroups.add(pg);
  }

  // Step 3: Check complement bonus — if two selected items are known complements, boost confidence
  let complementCount = 0;
  for (const [a, b] of COMPLEMENTS) {
    if (usedIds.has(a) && usedIds.has(b)) complementCount++;
  }

  // Step 4: Pick recommended sizes based on experience
  const compounds = selected.map((item, idx) => {
    const variants = item.product.variants;
    let variant;
    if (exp === "beginner") {
      variant = variants[0]; // smallest
    } else if (exp === "advanced") {
      variant = variants[variants.length - 1]; // largest
    } else {
      // mid-range
      variant = variants[Math.floor(variants.length / 2)] || variants[0];
    }

    const roles = ["Foundation", "Amplifier", "Support", "Optimizer", "Support"];
    const role = item.tags.role === "foundation" && idx === 0
      ? "Foundation"
      : item.tags.role === "amplifier"
        ? "Amplifier"
        : item.tags.role === "optimizer"
          ? "Optimizer"
          : roles[idx] || "Support";

    // Find the category label
    const catInfo = getCategoryForProduct(item.product);

    return {
      id: item.product.id,
      name: item.product.name,
      recommendedSize: variant.s,
      price: variant.p,
      role,
      reason: item.tags.notes,
      category: catInfo,
      score: item.score,
      form: item.product.form,
      highlights: item.product.highlights,
    };
  });

  // Step 5: Generate alternatives for each selected product
  const alternatives = {};
  for (const compound of compounds) {
    const alts = [];
    const pg = getPurposeGroup(compound.id);

    for (const item of scored) {
      if (usedIds.has(item.product.id)) continue;
      if (alts.length >= 2) break;

      // Same purpose group = direct alternative
      const itemPg = getPurposeGroup(item.product.id);
      if (pg && itemPg === pg) {
        const v = item.product.variants[0];
        alts.push({
          id: item.product.id,
          name: item.product.name,
          price: v.p,
          size: v.s,
          type: item.score > compound.score ? "upgrade" : (v.p < compound.price ? "budget" : "alternative"),
          reason: item.tags.notes,
        });
        continue;
      }

      // Similar goal profile
      const sharedGoals = Object.keys(compound.score > 0 ? PRODUCT_TAGS[compound.id]?.goals || {} : {});
      const itemGoals = PRODUCT_TAGS[item.product.id]?.goals || {};
      const overlap = sharedGoals.filter(g => (itemGoals[g] || 0) >= 5).length;
      if (overlap >= 1 && item.product.cat === PRODUCTS.find(p => p.id === compound.id)?.cat) {
        const v = item.product.variants[0];
        alts.push({
          id: item.product.id,
          name: item.product.name,
          price: v.p,
          size: v.s,
          type: v.p > compound.price ? "upgrade" : "budget",
          reason: item.tags.notes,
        });
      }
    }
    alternatives[compound.id] = alts;
  }

  // Step 6: Calculate totals
  const totalPrice = compounds.reduce((sum, c) => sum + c.price, 0);
  const valueTier = totalPrice < 200 ? "budget" : totalPrice < 400 ? "balanced" : "premium";

  // Step 7: Generate protocol name based on goal
  const protocolNames = {
    fatLoss: ["Metabolic Optimization Protocol", "Lean Research Protocol", "Metabolic Reset Stack"],
    recovery: ["Recovery & Repair Protocol", "Tissue Restoration Stack", "Healing Acceleration Protocol"],
    muscle: ["Growth Axis Protocol", "Anabolic Research Stack", "Body Composition Protocol"],
    cognitive: ["Neural Enhancement Protocol", "Cognitive Research Stack", "Neuroprotection Protocol"],
    longevity: ["Longevity Research Protocol", "Cellular Renewal Stack", "Anti-Aging Research Protocol"],
  };
  const names = protocolNames[primaryGoalKey] || protocolNames.recovery;
  const protocolName = names[Math.floor(Math.random() * names.length)];

  // Step 8: Generate summary
  const expLabels = { beginner: "new researchers", intermediate: "intermediate researchers", advanced: "experienced researchers" };
  const budgetLabels = { low: "budget-conscious", mid: "balanced", high: "comprehensive" };
  const summary = `A ${budgetLabels[budget] || "balanced"} ${primaryGoalKey.replace(/([A-Z])/g, ' $1').toLowerCase()} protocol designed for ${expLabels[exp] || "researchers"}. ${compounds.length} carefully selected compounds targeting your primary goal${secondary && secondary !== "none" ? " with " + secondary + " support" : ""}.`;

  return {
    protocolName,
    tagline: summary,
    compounds,
    alternatives,
    totalPrice,
    valueTier,
    complementCount,
    protocolTip: generateProtocolTip(primaryGoalKey, exp, cycle),
  };
}

function getCategoryForProduct(product) {
  const catLabels = {
    metabolic: "GLP-1 / Metabolic",
    growth: "Growth Hormone",
    recovery: "Recovery & Healing",
    longevity: "Longevity & Anti-Aging",
    neuro: "Cognitive & Neuro",
    body: "Body Composition",
    hormonal: "Hormonal",
    cosmetic: "Cosmetic",
    ancillaries: "Ancillaries",
  };
  return catLabels[product.cat] || product.cat;
}

function generateProtocolTip(goal, exp, cycle) {
  const tips = {
    fatLoss: {
      beginner: "Start with your foundation compound for 1-2 weeks before introducing support compounds. This helps you identify how each compound affects your protocol.",
      intermediate: "Consider cycling metabolic compounds in 8-week blocks with 2-week breaks between cycles for optimal response.",
      advanced: "Layer compounds sequentially — start foundation week 1, add amplifier week 2, introduce support by week 3-4.",
    },
    recovery: {
      beginner: "Begin with BPC-157 or a recovery blend as your foundation. These are among the most studied and well-tolerated recovery peptides.",
      intermediate: "Combine local-acting (BPC-157) with systemic (TB-500) compounds for comprehensive tissue repair coverage.",
      advanced: "Consider running immune support compounds alongside tissue repair peptides for a multi-pathway recovery approach.",
    },
    muscle: {
      beginner: "The CJC/Ipamorelin combination is the most studied GH-axis stack. Start here before exploring more advanced compounds.",
      intermediate: "Pair GHRH and GHRP compounds for synergistic GH release. Add a recovery compound to support tissue adaptation.",
      advanced: "Layer GH secretagogues with recovery peptides and consider IGF-1 pathway compounds for a comprehensive growth protocol.",
    },
    cognitive: {
      beginner: "Start with Semax as your cognitive foundation — it is one of the most studied nootropic peptides with a clear BDNF mechanism.",
      intermediate: "Pair a focus-oriented compound (Semax) with an anxiolytic (Selank) for balanced cognitive enhancement without overstimulation.",
      advanced: "Build a complete cognitive stack: foundation nootropic + anxiolytic + sleep support for 24-hour neural optimization.",
    },
    longevity: {
      beginner: "NAD+ is an accessible starting point for longevity research with extensive published data on cellular energy and DNA repair.",
      intermediate: "Combine telomerase-focused compounds (Epitalon) with mitochondrial support (NAD+) for multi-pathway longevity research.",
      advanced: "Consider senolytic compounds alongside cellular energy and immune support for a comprehensive anti-aging protocol.",
    },
  };
  return tips[goal]?.[exp] || tips.recovery?.beginner;
}

// ──────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────

module.exports = {
  PRODUCT_TAGS,
  GOAL_MAP,
  SECONDARY_BOOST,
  PURPOSE_GROUPS,
  COMPLEMENTS,
  EXCLUDED_IDS,
  recommendStack,
  getCategoryForProduct,
};
