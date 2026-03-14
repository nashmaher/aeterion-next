// pages/api/admin/product-costs.js
// Admin API for managing product cost (COGS) data.
// GET: list all product costs joined with product info
// POST action="upsert": create or update a cost record
// POST action="approve": clear needs_review flag for a record
// POST action="seed": one-time import of confirmed supplier cost data

import { verifyAdminToken } from './auth';
const { PRODUCTS } = require('../../../lib/products');

const SB_URL = 'https://kafwkhbzdtpsxkufmkmm.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sb(path, method = 'GET', body = null, extraHeaders = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : method === 'PATCH' ? 'return=representation' : 'return=minimal',
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} [${res.status}]: ${text}`);
  return text ? JSON.parse(text) : null;
}

// Build a lookup map: product_id -> { name, variants }
function buildProductMap() {
  const map = {};
  for (const p of PRODUCTS) {
    map[p.id] = p;
  }
  return map;
}

export default async function handler(req, res) {
  // GET: list all product costs
  if (req.method === 'GET') {
    const { admin_token } = req.query;
    if (!admin_token || !verifyAdminToken(admin_token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const costs = await sb('product_costs?order=product_id.asc,variant_size.asc');
      const productMap = buildProductMap();

      const enriched = (costs || []).map(c => {
        const product = productMap[c.product_id];
        const variant = product?.variants?.find(v => v.s === c.variant_size);
        return {
          ...c,
          product_name: product?.name || `Product #${c.product_id}`,
          sale_price: variant?.p || null,
        };
      });

      const review_count = enriched.filter(c => c.needs_review).length;
      return res.status(200).json({ costs: enriched, review_count });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST: action-based mutations
  if (req.method === 'POST') {
    const { admin_token, action, ...params } = req.body || {};
    if (!admin_token || !verifyAdminToken(admin_token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ── upsert ──
    if (action === 'upsert') {
      const { product_id, variant_size, cost_per_unit, supplier_cat_no, notes, needs_review, review_note } = params;
      if (!product_id || !variant_size || cost_per_unit == null) {
        return res.status(400).json({ error: 'product_id, variant_size, and cost_per_unit are required' });
      }
      if (isNaN(parseFloat(cost_per_unit)) || parseFloat(cost_per_unit) < 0) {
        return res.status(400).json({ error: 'cost_per_unit must be a non-negative number' });
      }
      try {
        const result = await sb('product_costs', 'POST', {
          product_id: parseInt(product_id),
          variant_size: String(variant_size).trim(),
          cost_per_unit: parseFloat(cost_per_unit),
          supplier_cat_no: supplier_cat_no || null,
          notes: notes || null,
          needs_review: Boolean(needs_review),
          review_note: review_note || null,
          approved: true,
        }, { Prefer: 'return=representation,resolution=merge-duplicates' });
        return res.status(200).json({ success: true, cost: Array.isArray(result) ? result[0] : result });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // ── approve ──
    if (action === 'approve') {
      const { id } = params;
      if (!id) return res.status(400).json({ error: 'id is required' });
      try {
        await sb(`product_costs?id=eq.${encodeURIComponent(id)}`, 'PATCH', {
          needs_review: false,
          review_note: null,
          approved: true,
        });
        return res.status(200).json({ success: true });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // ── seed ──
    if (action === 'seed') {
      const confirmed = [
        // ── Semaglutide (id: 1) ──
        { product_id: 1, variant_size: '2mg',  cost_per_unit: 2.60, supplier_cat_no: 'SM2' },
        { product_id: 1, variant_size: '5mg',  cost_per_unit: 3.70, supplier_cat_no: 'SM5' },
        { product_id: 1, variant_size: '10mg', cost_per_unit: 4.80, supplier_cat_no: 'SM10' },
        { product_id: 1, variant_size: '15mg', cost_per_unit: 6.00, supplier_cat_no: 'SM15' },
        { product_id: 1, variant_size: '20mg', cost_per_unit: 7.40, supplier_cat_no: 'SM20' },
        // ── Tirzepatide (id: 2) ──
        { product_id: 2, variant_size: '5mg',  cost_per_unit: 4.30,  supplier_cat_no: 'TR5' },
        { product_id: 2, variant_size: '10mg', cost_per_unit: 6.20,  supplier_cat_no: 'TR10' },
        { product_id: 2, variant_size: '15mg', cost_per_unit: 7.40,  supplier_cat_no: 'TR15' },
        { product_id: 2, variant_size: '20mg', cost_per_unit: 9.90,  supplier_cat_no: 'TR20' },
        { product_id: 2, variant_size: '40mg', cost_per_unit: 17.30, supplier_cat_no: 'TR40' },
        // ── Retatrutide (id: 3) ──
        { product_id: 3, variant_size: '5mg',  cost_per_unit: 6.40,  supplier_cat_no: 'RT5' },
        { product_id: 3, variant_size: '10mg', cost_per_unit: 10.80, supplier_cat_no: 'RT10' },
        { product_id: 3, variant_size: '15mg', cost_per_unit: 14.60, supplier_cat_no: 'RT15' },
        { product_id: 3, variant_size: '20mg', cost_per_unit: 15.90, supplier_cat_no: 'RT20' },
        // ── Dulaglutide (id: 5) ──
        { product_id: 5, variant_size: '5mg',  cost_per_unit: 19.00, supplier_cat_no: null },
        { product_id: 5, variant_size: '10mg', cost_per_unit: 31.10, supplier_cat_no: null },
        // ── Mazdutide (id: 6) ──
        { product_id: 6, variant_size: '10mg', cost_per_unit: 25.30, supplier_cat_no: 'MDT10' },
        // ── Survodutide (id: 7) ──
        { product_id: 7, variant_size: '10mg', cost_per_unit: 32.90, supplier_cat_no: 'SUR10' },
        // ── Cagrilintide (id: 8) ──
        { product_id: 8, variant_size: '5mg',  cost_per_unit: 12.70, supplier_cat_no: 'CGL5' },
        { product_id: 8, variant_size: '10mg', cost_per_unit: 23.00, supplier_cat_no: 'CGL10' },
        // ── CJC-1295 no DAC (id: 12) ──
        { product_id: 12, variant_size: '2mg', cost_per_unit: 5.60, supplier_cat_no: 'CND2' },
        { product_id: 12, variant_size: '5mg', cost_per_unit: 8.60, supplier_cat_no: 'CND5' },
        // ── CJC-1295 DAC (id: 13) ──
        { product_id: 13, variant_size: '2mg', cost_per_unit: 9.50,  supplier_cat_no: 'CD2' },
        { product_id: 13, variant_size: '5mg', cost_per_unit: 19.60, supplier_cat_no: 'CD5' },
        // ── GHRP-2 (id: 14) ──
        { product_id: 14, variant_size: '5mg',  cost_per_unit: 4.80, supplier_cat_no: 'GR25' },
        { product_id: 14, variant_size: '10mg', cost_per_unit: 6.30, supplier_cat_no: 'GR210' },
        { product_id: 14, variant_size: '15mg', cost_per_unit: 8.50, supplier_cat_no: 'GR215' },
        // ── GHRP-6 (id: 15) ──
        { product_id: 15, variant_size: '5mg',  cost_per_unit: 3.20, supplier_cat_no: 'GR65' },
        { product_id: 15, variant_size: '10mg', cost_per_unit: 5.20, supplier_cat_no: 'GR610' },
        // ── Sermorelin (id: 17) ──
        { product_id: 17, variant_size: '2mg',  cost_per_unit: 5.80,  supplier_cat_no: 'SMO2' },
        { product_id: 17, variant_size: '5mg',  cost_per_unit: 8.20,  supplier_cat_no: 'SMO5' },
        { product_id: 17, variant_size: '10mg', cost_per_unit: 13.20, supplier_cat_no: 'SMO10' },
        // ── Tesamorelin (id: 19) ──
        { product_id: 19, variant_size: '2mg',  cost_per_unit: 7.60,  supplier_cat_no: 'TSM2' },
        { product_id: 19, variant_size: '5mg',  cost_per_unit: 11.50, supplier_cat_no: 'TSM5' },
        { product_id: 19, variant_size: '10mg', cost_per_unit: 21.40, supplier_cat_no: 'TSM10' },
        { product_id: 19, variant_size: '20mg', cost_per_unit: 36.80, supplier_cat_no: 'TSM20' },
        // ── IGF-1 LR3 (id: 20) ──
        { product_id: 20, variant_size: '1mg', cost_per_unit: 25.30, supplier_cat_no: 'IF1' },
        // ── Follistatin 344 (id: 21) ──
        { product_id: 21, variant_size: '1mg', cost_per_unit: 31.60, supplier_cat_no: null },
        // ── BPC-157 (id: 22) ──
        { product_id: 22, variant_size: '5mg',  cost_per_unit: 4.80, supplier_cat_no: 'BC5' },
        { product_id: 22, variant_size: '10mg', cost_per_unit: 6.70, supplier_cat_no: 'BC10' },
        // ── TB-500 (id: 23) ──
        { product_id: 23, variant_size: '2mg',  cost_per_unit: 5.20,  supplier_cat_no: 'TB2' },
        { product_id: 23, variant_size: '5mg',  cost_per_unit: 8.30,  supplier_cat_no: 'TB5' },
        { product_id: 23, variant_size: '10mg', cost_per_unit: 15.20, supplier_cat_no: 'TB10' },
        // ── KPV (id: 26) ──
        { product_id: 26, variant_size: '5mg',  cost_per_unit: 4.70, supplier_cat_no: 'KPV5' },
        { product_id: 26, variant_size: '10mg', cost_per_unit: 6.30, supplier_cat_no: 'KPV10' },
        // ── GHK-Cu (id: 28) ──
        { product_id: 28, variant_size: '50mg',  cost_per_unit: 3.50, supplier_cat_no: 'CU50' },
        { product_id: 28, variant_size: '100mg', cost_per_unit: 5.20, supplier_cat_no: 'CU100' },
        // ── Thymosin Alpha-1 (id: 29) ──
        { product_id: 29, variant_size: '5mg',  cost_per_unit: 10.40, supplier_cat_no: 'TA5' },
        { product_id: 29, variant_size: '10mg', cost_per_unit: 21.30, supplier_cat_no: 'TA10' },
        // ── VIP (id: 32) ──
        { product_id: 32, variant_size: '5mg',  cost_per_unit: 9.90,  supplier_cat_no: 'VIP5' },
        { product_id: 32, variant_size: '10mg', cost_per_unit: 18.20, supplier_cat_no: 'VIP10' },
        // ── Epitalon (id: 33) ──
        { product_id: 33, variant_size: '10mg', cost_per_unit: 5.50,  supplier_cat_no: 'ET10' },
        { product_id: 33, variant_size: '50mg', cost_per_unit: 16.70, supplier_cat_no: 'ET50' },
        // ── NAD+ (id: 34) ──
        { product_id: 34, variant_size: '100mg',  cost_per_unit: 4.90, supplier_cat_no: 'NJ100' },
        { product_id: 34, variant_size: '500mg',  cost_per_unit: 7.10, supplier_cat_no: 'NJ500' },
        { product_id: 34, variant_size: '1000mg', cost_per_unit: 8.60, supplier_cat_no: 'NJ1000' },
        // ── MOTS-c 20mg/40mg (id: 38) ──
        { product_id: 38, variant_size: '20mg', cost_per_unit: 15.90, supplier_cat_no: 'MS20' },
        { product_id: 38, variant_size: '40mg', cost_per_unit: 25.30, supplier_cat_no: 'MS40' },
        // ── Thymalin (id: 41) ──
        { product_id: 41, variant_size: '10mg', cost_per_unit: 7.50, supplier_cat_no: 'TY10' },
        // ── Semax (id: 42) ──
        { product_id: 42, variant_size: '5mg',  cost_per_unit: 4.60, supplier_cat_no: 'XA5' },
        { product_id: 42, variant_size: '10mg', cost_per_unit: 5.90, supplier_cat_no: 'XA10' },
        // ── Selank (id: 43) ──
        { product_id: 43, variant_size: '5mg',  cost_per_unit: 4.60, supplier_cat_no: 'SK5' },
        { product_id: 43, variant_size: '10mg', cost_per_unit: 6.90, supplier_cat_no: 'SK10' },
        // ── Cerebrolysin (id: 45) ──
        { product_id: 45, variant_size: '60mg', cost_per_unit: 9.00, supplier_cat_no: null },
        // ── DSIP (id: 50) ──
        { product_id: 50, variant_size: '2mg', cost_per_unit: 3.70, supplier_cat_no: 'DS2' },
        { product_id: 50, variant_size: '5mg', cost_per_unit: 5.20, supplier_cat_no: 'DS5' },
        // ── PE-22-28 (id: 52) ──
        { product_id: 52, variant_size: '5mg', cost_per_unit: 9.80, supplier_cat_no: null },
        // ── AOD9604 (id: 53) ──
        { product_id: 53, variant_size: '2mg',  cost_per_unit: 6.10,  supplier_cat_no: '2AD' },
        { product_id: 53, variant_size: '5mg',  cost_per_unit: 12.40, supplier_cat_no: '5AD' },
        { product_id: 53, variant_size: '10mg', cost_per_unit: 22.30, supplier_cat_no: '10AD' },
        // ── 5-AMINO-1MQ (id: 56) ──
        { product_id: 56, variant_size: '5mg',  cost_per_unit: 4.90, supplier_cat_no: '5AM' },
        { product_id: 56, variant_size: '10mg', cost_per_unit: 6.70, supplier_cat_no: '10AM' },
        // ── ACE-031 (id: 58) ──
        { product_id: 58, variant_size: '1mg', cost_per_unit: 6.90, supplier_cat_no: 'AE1' },
        // ── L-Carnitine (id: 59) ──
        { product_id: 59, variant_size: '5000mg', cost_per_unit: 7.80, supplier_cat_no: null },
        // ── Lipo-C (id: 60) ──
        { product_id: 60, variant_size: '10ml', cost_per_unit: 9.00, supplier_cat_no: null },
        // ── MIC Lipo-C + B12 (id: 61) ──
        { product_id: 61, variant_size: '10ml', cost_per_unit: 13.60, supplier_cat_no: null },
        // ── Lemon Bottle (id: 62) ──
        { product_id: 62, variant_size: '10ml', cost_per_unit: 8.10, supplier_cat_no: null },
        // ── AICAR (id: 63) ──
        { product_id: 63, variant_size: '50mg',  cost_per_unit: 10.40, supplier_cat_no: 'AR50' },
        { product_id: 63, variant_size: '100mg', cost_per_unit: 14.80, supplier_cat_no: 'AR100' },
        // ── ARA290 (id: 64) ──
        { product_id: 64, variant_size: '10mg', cost_per_unit: 10.40, supplier_cat_no: 'RA10' },
        // ── HCG (id: 65) ──
        { product_id: 65, variant_size: '5000iu',  cost_per_unit: 9.20,  supplier_cat_no: 'G5K' },
        { product_id: 65, variant_size: '10000iu', cost_per_unit: 17.30, supplier_cat_no: 'G10K' },
        // ── HMG (id: 66) ──
        { product_id: 66, variant_size: '75iu', cost_per_unit: 8.10, supplier_cat_no: 'G75' },
        // ── Gonadorelin Acetate (id: 67) ──
        { product_id: 67, variant_size: '2mg', cost_per_unit: 3.60, supplier_cat_no: 'GND2' },
        { product_id: 67, variant_size: '5mg', cost_per_unit: 6.30, supplier_cat_no: 'GND5' },
        // ── Oxytocin Acetate (id: 68) ──
        { product_id: 68, variant_size: '2mg',  cost_per_unit: 3.30, supplier_cat_no: 'OT2' },
        { product_id: 68, variant_size: '5mg',  cost_per_unit: 4.70, supplier_cat_no: 'OT5' },
        { product_id: 68, variant_size: '10mg', cost_per_unit: 6.80, supplier_cat_no: 'OT10' },
        // ── Triptorelin Acetate (id: 70) ──
        { product_id: 70, variant_size: '2mg', cost_per_unit: 5.60, supplier_cat_no: null },
        // ── PT-141 (id: 71) ──
        { product_id: 71, variant_size: '10mg', cost_per_unit: 7.50, supplier_cat_no: 'P41' },
        // ── Demorphin (id: 72) ──
        { product_id: 72, variant_size: '2mg', cost_per_unit: 3.90, supplier_cat_no: null },
        // ── FOXO4-DRI (id: 73) ──
        { product_id: 73, variant_size: '2mg',  cost_per_unit: 12.10, supplier_cat_no: 'F402' },
        { product_id: 73, variant_size: '10mg', cost_per_unit: 40.30, supplier_cat_no: 'F410' },
        // ── Glutathione (id: 76) ──
        { product_id: 76, variant_size: '600mg',  cost_per_unit: 5.20, supplier_cat_no: 'GTT' },
        { product_id: 76, variant_size: '1500mg', cost_per_unit: 9.00, supplier_cat_no: 'GTT' },
        // ── Snap-8 (id: 77) ──
        { product_id: 77, variant_size: '10mg', cost_per_unit: 4.80, supplier_cat_no: 'NP810' },
        // ── Bacteriostatic Water (id: 78) ──
        { product_id: 78, variant_size: '3ml',  cost_per_unit: 0.90, supplier_cat_no: 'WA3' },
        { product_id: 78, variant_size: '10ml', cost_per_unit: 1.40, supplier_cat_no: 'WA10' },
        // ── Acetic Acid 1% (id: 79) ──
        { product_id: 79, variant_size: '10ml', cost_per_unit: 1.00, supplier_cat_no: null },
        // ── CJC-1295 + Ipamorelin Blend (id: 81) ──
        { product_id: 81, variant_size: '10mg (5+5)', cost_per_unit: 11.50, supplier_cat_no: 'CP10' },
        // ── BPC+GHK-Cu+TB500+KPV Quad Blend (id: 82) ──
        { product_id: 82, variant_size: '80mg', cost_per_unit: 26.50, supplier_cat_no: 'KLOW' },
        // ── FTPP Adipotide (id: 83) ──
        { product_id: 83, variant_size: '5mg', cost_per_unit: 16.70, supplier_cat_no: null },
      ];

      const needsReview = [
        // Liraglutide — not in supplier list
        { product_id: 4, variant_size: '5mg',  cost_per_unit: 0, needs_review: true, review_note: 'Not found in supplier price list — source cost from supplier before using in profit calculations' },
        { product_id: 4, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'Not found in supplier price list — source cost from supplier before using in profit calculations' },
        // Mazdutide 5mg — only 10mg in supplier list
        { product_id: 6, variant_size: '5mg', cost_per_unit: 0, needs_review: true, review_note: 'Only 10mg (MDT10=$25.30) found in supplier list — confirm 5mg cost with supplier' },
        // Cagrisema combo — verify combined product cost
        { product_id: 9, variant_size: 'combo', cost_per_unit: 0, needs_review: true, review_note: 'Cagrisema = cagrilintide + semaglutide co-formulation — verify exact combo cost with supplier. Supplier shows unnamed Cagrisema 2.5+2.5mg at $108/10vials = $10.80/vial as estimate' },
        // Ipamorelin — not listed standalone
        { product_id: 11, variant_size: '2mg',  cost_per_unit: 0, needs_review: true, review_note: 'Ipamorelin not listed as standalone product in supplier list — source cost' },
        { product_id: 11, variant_size: '5mg',  cost_per_unit: 0, needs_review: true, review_note: 'Ipamorelin not listed as standalone product in supplier list — source cost' },
        { product_id: 11, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'Ipamorelin not listed as standalone product in supplier list — source cost' },
        // Hexarelin — not in supplier list
        { product_id: 16, variant_size: '2mg', cost_per_unit: 0, needs_review: true, review_note: 'Hexarelin not found in supplier price list — source cost' },
        { product_id: 16, variant_size: '5mg', cost_per_unit: 0, needs_review: true, review_note: 'Hexarelin not found in supplier price list — source cost' },
        // BPC+TB blend — composite
        { product_id: 24, variant_size: 'BPC5mg+TB5mg',    cost_per_unit: 0, needs_review: true, review_note: 'Composite blend — estimated cost: BPC-157 5mg ($4.80) + TB-500 5mg ($8.30) = $13.10/vial. Confirm with supplier' },
        { product_id: 24, variant_size: 'BPC10mg+TB10mg',  cost_per_unit: 0, needs_review: true, review_note: 'Composite blend — estimated cost: BPC-157 10mg ($6.70) + TB-500 10mg ($15.20) = $21.90/vial. Confirm with supplier' },
        // GLOW Blend — composite
        { product_id: 25, variant_size: '70mg', cost_per_unit: 0, needs_review: true, review_note: 'GLOW Blend (BPC10+GHK50+TB10) composite — estimated cost: $6.70+$3.50+$15.20 = $25.40/vial. Confirm with supplier (GLOW cat no, $227/10=$22.70)' },
        // LL-37 — not in supplier list
        { product_id: 27, variant_size: '5mg', cost_per_unit: 0, needs_review: true, review_note: 'LL-37 not found in supplier price list — source cost' },
        // SS-31 — 5mg not in supplier list
        { product_id: 31, variant_size: '5mg',  cost_per_unit: 0,    needs_review: true, review_note: 'SS-31 5mg not in supplier list — source cost. 10mg available via 2S10=$9.20/vial' },
        { product_id: 31, variant_size: '10mg', cost_per_unit: 9.20, needs_review: true, supplier_cat_no: '2S10', review_note: 'Confirmed from supplier 2S10=$92/10vials. Please approve to clear review flag.' },
        // Humanin — not in supplier list
        { product_id: 37, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'Humanin not found in supplier price list — source cost' },
        // MOTS-c 10mg/15mg — not in supplier list
        { product_id: 38, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'MOTS-c 10mg not in supplier list (has 20mg/40mg only) — source cost' },
        { product_id: 38, variant_size: '15mg', cost_per_unit: 0, needs_review: true, review_note: 'MOTS-c 15mg not in supplier list (has 20mg/40mg only) — source cost' },
        // Dihexa — not in supplier list
        { product_id: 44, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'Dihexa not found in supplier price list — source cost' },
        // Adamax 5mg — supplier only shows 10mg
        { product_id: 51, variant_size: '5mg', cost_per_unit: 0, needs_review: true, review_note: 'Supplier shows Adamax 10mg (ax10) at $160/10=$16.00/vial. Store sells 5mg — confirm 5mg cost with supplier' },
        // HGH Fragment 176-191 — possibly same as AOD9604
        { product_id: 54, variant_size: '1mg',  cost_per_unit: 0, needs_review: true, review_note: 'HGH Fragment 176-191 may be same compound as AOD9604 in supplier list — confirm sourcing before assigning cost' },
        { product_id: 54, variant_size: '2mg',  cost_per_unit: 0, needs_review: true, review_note: 'HGH Fragment 176-191 may be same compound as AOD9604 in supplier list — confirm sourcing before assigning cost' },
        { product_id: 54, variant_size: '5mg',  cost_per_unit: 0, needs_review: true, review_note: 'HGH Fragment 176-191 may be same compound as AOD9604 in supplier list — confirm sourcing before assigning cost' },
        { product_id: 54, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'HGH Fragment 176-191 may be same compound as AOD9604 in supplier list — confirm sourcing before assigning cost' },
        // Adipotide (FTPP) — conflicting supplier entries
        { product_id: 55, variant_size: '2mg',  cost_per_unit: 0, needs_review: true, review_note: 'Two supplier entries: AP2=$9.80/vial vs FTTP Adipotide (no 2mg listed). Confirm which applies.' },
        { product_id: 55, variant_size: '5mg',  cost_per_unit: 0, needs_review: true, review_note: 'Two supplier entries: AP5=$20.80/vial vs FTTP Adipotide=$16.70/vial. Confirm which applies.' },
        { product_id: 55, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'Two supplier entries: AP10=$31.00/vial. Confirm which supplier item this maps to.' },
        // SLU-PP-332 — name mismatch with supplier
        { product_id: 57, variant_size: '5mg',  cost_per_unit: 0, needs_review: true, review_note: 'Supplier lists SLU-PP-322 at $148/10=$14.80/vial. Store sells SLU-PP-332 — confirm if same compound or different' },
        { product_id: 57, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'SLU-PP-332 10mg not in supplier list. Confirm compound identity and cost with supplier' },
        // Kisspeptin-10 — not in supplier list
        { product_id: 69, variant_size: '5mg',  cost_per_unit: 0, needs_review: true, review_note: 'Kisspeptin-10 not found in supplier price list — source cost' },
        { product_id: 69, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'Kisspeptin-10 not found in supplier price list — source cost' },
        // Melanotan I & II — not in supplier list
        { product_id: 74, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'Melanotan I not found in supplier price list — source cost' },
        { product_id: 75, variant_size: '10mg', cost_per_unit: 0, needs_review: true, review_note: 'Melanotan II not found in supplier price list — source cost' },
        // HGH Somatropin — IU units
        { product_id: 80, variant_size: '10iu', cost_per_unit: 0, needs_review: true, review_note: 'HGH Somatropin in IU — supplier pricing is mg-based. Confirm per-IU cost with supplier' },
        { product_id: 80, variant_size: '12iu', cost_per_unit: 0, needs_review: true, review_note: 'HGH Somatropin in IU — supplier pricing is mg-based. Confirm per-IU cost with supplier' },
        { product_id: 80, variant_size: '15iu', cost_per_unit: 0, needs_review: true, review_note: 'HGH Somatropin in IU — supplier pricing is mg-based. Confirm per-IU cost with supplier' },
        { product_id: 80, variant_size: '24iu', cost_per_unit: 0, needs_review: true, review_note: 'HGH Somatropin in IU — supplier pricing is mg-based. Confirm per-IU cost with supplier' },
      ];

      let inserted = 0;
      let review_flagged = 0;
      const errors = [];

      // Upsert confirmed records
      for (const record of confirmed) {
        try {
          await sb('product_costs', 'POST', {
            ...record,
            notes: null,
            needs_review: false,
            review_note: null,
            approved: true,
          }, { Prefer: 'return=minimal,resolution=merge-duplicates' });
          inserted++;
        } catch (e) {
          errors.push(`${record.product_id}/${record.variant_size}: ${e.message}`);
        }
      }

      // Upsert needs_review records — only if cost_per_unit > 0 (don't zero out confirmed costs)
      for (const record of needsReview) {
        try {
          // For needs_review items with cost_per_unit=0, only insert if no row exists yet
          if (record.cost_per_unit === 0) {
            const existing = await sb(`product_costs?product_id=eq.${record.product_id}&variant_size=eq.${encodeURIComponent(record.variant_size)}&select=id,cost_per_unit`);
            if (existing && existing.length > 0 && existing[0].cost_per_unit > 0) {
              // Already has a real cost — don't overwrite with 0, just ensure needs_review is set
              await sb(`product_costs?id=eq.${existing[0].id}`, 'PATCH', {
                needs_review: record.needs_review,
                review_note: record.review_note,
              });
              review_flagged++;
              continue;
            }
          }
          await sb('product_costs', 'POST', {
            product_id: record.product_id,
            variant_size: record.variant_size,
            cost_per_unit: record.cost_per_unit,
            supplier_cat_no: record.supplier_cat_no || null,
            notes: null,
            needs_review: record.needs_review,
            review_note: record.review_note,
            approved: record.cost_per_unit > 0,
          }, { Prefer: 'return=minimal,resolution=merge-duplicates' });
          review_flagged++;
        } catch (e) {
          errors.push(`review ${record.product_id}/${record.variant_size}: ${e.message}`);
        }
      }

      return res.status(200).json({
        success: true,
        inserted,
        review_flagged,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
