// pages/api/validate-promo.js
// Checks whether a promo code is a valid active ambassador code

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided.' });

  const { data: ambassador, error } = await supabase
    .from('ambassadors')
    .select('id, name, promo_code, commission_rate')
    .eq('promo_code', code.toUpperCase().trim())
    .eq('status', 'approved')
    .single();

  if (error || !ambassador) {
    return res.status(404).json({ valid: false, error: 'Invalid promo code.' });
  }

  return res.status(200).json({
    valid: true,
    discount: 10, // 10% off for customer
    ambassador_name: ambassador.name,
    code: ambassador.promo_code,
  });
}
