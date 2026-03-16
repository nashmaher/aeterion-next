// pages/api/validate-promo.js
// Validates promo codes: unique welcome codes, review codes, abandon codes, and ambassador codes.

import { createClient } from '@supabase/supabase-js';
import { rateLimiter } from '../../lib/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const promoLimiter = rateLimiter('validate-promo', 10, 60 * 1000); // 10 per minute per IP

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const { allowed, retryAfter } = promoLimiter(ip);
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided.' });

  const normalized = code.toUpperCase().trim();

  // 1. Welcome / abandon codes — stored in email_subscribers
  if (normalized.startsWith('WELCOME-') || normalized.startsWith('SAVE-')) {
    const { data: rows } = await supabase
      .from('email_subscribers')
      .select('discount_code, discount_pct, code_used')
      .eq('discount_code', normalized)
      .limit(1);

    if (!rows || rows.length === 0)
      return res.status(404).json({ valid: false, error: 'Invalid promo code.' });

    if (rows[0].code_used)
      return res.status(200).json({ valid: false, error: 'This code has already been used.' });

    return res.status(200).json({
      valid: true,
      discount: rows[0].discount_pct || (normalized.startsWith('WELCOME-') ? 10 : 5),
      code: normalized,
      type: normalized.startsWith('WELCOME-') ? 'welcome' : 'abandon',
    });
  }

  // 2. Review reward codes — stored in review_codes
  if (normalized.startsWith('REVIEW-')) {
    const { data: rows } = await supabase
      .from('review_codes')
      .select('code, code_used')
      .eq('code', normalized)
      .limit(1);

    if (!rows || rows.length === 0)
      return res.status(404).json({ valid: false, error: 'Invalid promo code.' });

    if (rows[0].code_used)
      return res.status(200).json({ valid: false, error: 'This code has already been used.' });

    return res.status(200).json({ valid: true, discount: 10, code: normalized, type: 'review' });
  }

  // 3. Legacy static codes
  if (normalized === 'WELCOME10')
    return res.status(200).json({ valid: true, discount: 10, code: 'WELCOME10', type: 'welcome' });
  if (normalized === 'SAVE5')
    return res.status(200).json({ valid: true, discount: 5, code: 'SAVE5', type: 'abandon' });

  // 4. Ambassador codes
  const { data: rows } = await supabase
    .from('ambassadors')
    .select('id, name, promo_code, commission_rate')
    .eq('promo_code', normalized)
    .eq('status', 'approved')
    .limit(1);

  if (!rows || rows.length === 0)
    return res.status(404).json({ valid: false, error: 'Invalid promo code.' });

  return res.status(200).json({
    valid: true,
    discount: 10,
    ambassador_name: rows[0].name,
    code: rows[0].promo_code,
    type: 'ambassador',
  });
}
