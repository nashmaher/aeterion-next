// pages/api/review-capture.js
// Called after a customer submits a review.
// Generates a unique one-time 10% discount code and emails it to them.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars (0/O, 1/I)
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `REVIEW-${rand}`;
}

async function sendReviewDiscountEmail(email, code, productName) {
  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;margin:0;padding:0;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:22px;font-weight:900;color:#f8fafc;letter-spacing:2px;">AETERION LABS</div>
        <div style="font-size:12px;color:#64748b;letter-spacing:4px;margin-top:4px;">RESEARCH PEPTIDES</div>
      </div>
      <div style="background:#1e293b;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:16px;">⭐</div>
        <div style="font-size:24px;font-weight:900;color:#f8fafc;margin-bottom:12px;">Thank You for Your Review!</div>
        <div style="font-size:15px;color:#94a3b8;line-height:1.6;margin-bottom:28px;">
          Your review of <strong style="color:#f8fafc;">${productName || 'this compound'}</strong> helps other researchers make informed decisions. As promised, here's your personal 10% off code for your next order:
        </div>
        <div style="background:#0f172a;border-radius:14px;padding:24px;margin-bottom:24px;">
          <div style="font-size:11px;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Your Discount Code</div>
          <div style="font-size:32px;font-weight:900;color:#4ade80;letter-spacing:4px;font-family:monospace;">${code}</div>
          <div style="font-size:13px;color:#94a3b8;margin-top:8px;">10% off your next order · Single use only · No expiry</div>
        </div>
        <a href="https://aeterionpeptides.com" style="display:inline-block;background:#1a6ed8;color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">Shop Now</a>
      </div>
      <div style="text-align:center;font-size:11px;color:#475569;line-height:1.8;">
        aeterionpeptides.com · For research purposes only
      </div>
    </div>
  </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Aeterion Labs <info@notifications.aeterionpeptides.com>',
      to: [email],
      subject: `Your 10% review reward code — thank you!`,
      html,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, productId, productName } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });

  const cleanEmail = email.toLowerCase().trim();

  // Check if this email already claimed a review code — one per customer
  try {
    const { data: existing } = await supabase
      .from('review_codes')
      .select('code, code_used')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      // Already issued — return existing code if unused, block if used
      if (!existing.code_used) {
        return res.status(200).json({ code: existing.code });
      } else {
        return res.status(200).json({ success: true, message: 'Code already used' });
      }
    }
  } catch {
    // No existing row — proceed to generate
  }

  const code = generateCode();

  // Store in review_codes table
  try {
    await supabase.from('review_codes').insert({
      email: cleanEmail,
      code,
      product_id: productId || null,
      code_used: false,
    });
  } catch (e) {
    console.error('Supabase review_codes insert failed:', e.message);
  }

  // Send the email
  try {
    await sendReviewDiscountEmail(cleanEmail, code, productName);
  } catch (e) {
    console.error('Review discount email failed:', e.message);
  }

  return res.status(200).json({ success: true, code });
}
