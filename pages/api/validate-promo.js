// pages/api/validate-promo.js
// Checks whether a promo code is valid — ambassador codes OR the WELCOME10 new customer code

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided.' });

  const normalized = code.toUpperCase().trim();

  // ── WELCOME10 — new customer discount ──
  if (normalized === 'WELCOME10') {
    return res.status(200).json({ valid: true, discount: 10, code: 'WELCOME10', ambassador_name: null, type: 'welcome' });
  }

  // ── SAVE5 — cart abandonment recovery discount ──
  if (normalized === 'SAVE5') {
    return res.status(200).json({ valid: true, discount: 5, code: 'SAVE5', ambassador_name: null, type: 'abandon' });
  }

  // ── Ambassador codes ──
  const { data: rows } = await supabase
    .from('ambassadors')
    .select('id, name, promo_code, commission_rate')
    .eq('promo_code', normalized)
    .eq('status', 'approved')
    .limit(1);

  if (!rows || rows.length === 0) {
    return res.status(404).json({ valid: false, error: 'Invalid promo code.' });
  }

  return res.status(200).json({
    valid: true,
    discount: 10,
    ambassador_name: rows[0].name,
    code: rows[0].promo_code,
    type: 'ambassador',
  });
}
