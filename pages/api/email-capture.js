// pages/api/email-capture.js
// Handles email signup from popup (10% welcome) AND cart abandonment (5% save cart)
// Generates unique one-time-use discount codes per customer — never reuses static codes.

import { createClient } from '@supabase/supabase-js';
import { rateLimiter, validateEmail } from '../../lib/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const emailLimiter = rateLimiter('email-capture', 3, 60 * 60 * 1000); // 3 per hour per email

function generateCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusable chars (0/O, 1/I)
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${rand}`;
}

async function sendWelcomeEmail(email, code) {
  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;margin:0;padding:0;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:22px;font-weight:900;color:#f8fafc;letter-spacing:2px;">AETERION LABS</div>
        <div style="font-size:12px;color:#64748b;letter-spacing:4px;margin-top:4px;">RESEARCH PEPTIDES</div>
      </div>
      <div style="background:#1e293b;border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:16px;">🧪</div>
        <div style="font-size:24px;font-weight:900;color:#f8fafc;margin-bottom:12px;">Welcome to Aeterion Labs</div>
        <div style="font-size:15px;color:#94a3b8;line-height:1.6;margin-bottom:28px;">
          Thank you for joining. Here's your exclusive first-order discount — this code is unique to you and can only be used once:
        </div>
        <div style="background:#0f172a;border-radius:14px;padding:24px;margin-bottom:24px;">
          <div style="font-size:11px;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Your Personal Discount Code</div>
          <div style="font-size:36px;font-weight:900;color:#4ade80;letter-spacing:5px;font-family:monospace;">${code}</div>
          <div style="font-size:13px;color:#94a3b8;margin-top:8px;">10% off your first order · Single use only</div>
        </div>
        <a href="https://aeterionpeptides.com" style="display:inline-block;background:#1a6ed8;color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">Shop Now</a>
      </div>
      <div style="background:#1e293b;border-radius:16px;padding:24px;margin-bottom:24px;">
        <div style="font-size:14px;font-weight:700;color:#f8fafc;margin-bottom:12px;">Why Researchers Choose Aeterion</div>
        <div style="font-size:13px;color:#94a3b8;line-height:2.1;">
          Every batch independently HPLC tested<br/>
          COA included with every order<br/>
          Cold-chain shipping to preserve integrity<br/>
          Ships from the USA, 1-2 day processing
        </div>
      </div>
      <div style="text-align:center;font-size:11px;color:#475569;line-height:1.8;">
        You signed up at aeterionpeptides.com
      </div>
    </div>
  </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Aeterion Labs <info@notifications.aeterionpeptides.com>',
      to: [email],
      subject: 'Your personal 10% discount code is inside',
      html,
    }),
  });
}

async function sendAbandonEmail(email, cartItems, code) {
  const itemList = (cartItems || []).map(name =>
    `<li style="margin-bottom:6px;color:#94a3b8;">${name}</li>`
  ).join('');

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;margin:0;padding:0;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-size:22px;font-weight:900;color:#f8fafc;letter-spacing:2px;">AETERION LABS</div>
      </div>
      <div style="background:#1e293b;border-radius:16px;padding:32px;margin-bottom:24px;">
        <div style="font-size:32px;text-align:center;margin-bottom:16px;">🛒</div>
        <div style="font-size:22px;font-weight:900;color:#f8fafc;text-align:center;margin-bottom:12px;">You left something behind</div>
        <div style="font-size:14px;color:#94a3b8;line-height:1.6;margin-bottom:20px;">
          Your cart is saved and waiting. Here is your personal one-time 5% off code:
        </div>
        ${itemList ? `<ul style="padding:0 0 0 18px;margin-bottom:20px;">${itemList}</ul>` : ''}
        <div style="background:#0f172a;border-radius:14px;padding:20px;text-align:center;margin-bottom:24px;">
          <div style="font-size:11px;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Your Personal Code</div>
          <div style="font-size:32px;font-weight:900;color:#4ade80;letter-spacing:4px;font-family:monospace;">${code}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:6px;">5% off · Single use only</div>
        </div>
        <div style="text-align:center;">
          <a href="https://aeterionpeptides.com" style="display:inline-block;background:#1a6ed8;color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">Complete My Order</a>
        </div>
      </div>
      <div style="text-align:center;font-size:11px;color:#475569;">
        aeterionpeptides.com
      </div>
    </div>
  </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Aeterion Labs <info@notifications.aeterionpeptides.com>',
      to: [email],
      subject: "Your cart is waiting — here's 5% off to complete your order",
      html,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, source, cartItems } = req.body;
  if (!validateEmail(email)) return res.status(400).json({ error: 'Valid email required' });

  // Rate limit by email
  const { allowed, retryAfter } = emailLimiter(email.toLowerCase().trim());
  if (!allowed) {
    return res.status(200).json({ success: true }); // Silent rate limit — don't reveal to bots
  }

  const cleanEmail = email.toLowerCase().trim();
  const isAbandon = source === 'abandon';

  // Check if this email already has an unused code — don't generate a new one
  let code;
  try {
    const { data: existing } = await supabase
      .from('email_subscribers')
      .select('discount_code, code_used')
      .eq('email', cleanEmail)
      .single();

    if (existing && existing.discount_code && !existing.code_used) {
      // Reuse existing unused code (e.g. if they sign up again)
      code = existing.discount_code;
    } else if (existing && existing.code_used) {
      // Already used their code — don't issue another
      return res.status(200).json({ success: true, message: 'Code already used' });
    } else {
      // New subscriber — generate unique code
      code = generateCode(isAbandon ? 'SAVE' : 'WELCOME');
    }
  } catch {
    code = generateCode(isAbandon ? 'SAVE' : 'WELCOME');
  }

  try {
    await supabase.from('email_subscribers').upsert(
      {
        email: cleanEmail,
        source: source || 'popup',
        discount_code: code,
        discount_pct: isAbandon ? 5 : 10,
        code_used: false,
      },
      { onConflict: 'email', ignoreDuplicates: false }
    );
  } catch (e) {
    console.error('Supabase store failed:', e.message);
  }

  try {
    if (isAbandon) {
      await sendAbandonEmail(cleanEmail, cartItems, code);
    } else {
      await sendWelcomeEmail(cleanEmail, code);
    }
  } catch (e) {
    console.error('Email send failed:', e.message);
  }

  return res.status(200).json({ success: true });
}
