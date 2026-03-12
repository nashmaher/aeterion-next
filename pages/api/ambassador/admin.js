// pages/api/ambassador/admin.js
// Admin-only endpoint to approve/reject/manage ambassadors
// Protected by your existing admin password

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { verifyAdminToken } from '../admin/auth';

async function sendAmbassadorWelcomeEmail({ name, email, promo_code, password, commission_rate }) {
  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;margin:0;padding:0;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

      <!-- Header -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:22px;font-weight:900;color:#f8fafc;letter-spacing:2px;">AETERION LABS</div>
        <div style="font-size:12px;color:#64748b;letter-spacing:4px;margin-top:4px;">AMBASSADOR PROGRAM</div>
      </div>

      <!-- Main card -->
      <div style="background:#1e293b;border-radius:16px;padding:32px;margin-bottom:24px;">
        <div style="font-size:24px;font-weight:800;color:#f8fafc;margin-bottom:8px;">Welcome, ${name}! 🎉</div>
        <div style="font-size:15px;color:#94a3b8;line-height:1.6;margin-bottom:28px;">
          Your Aeterion ambassador account is ready. Here's everything you need to get started.
        </div>

        <!-- Login details -->
        <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;">Your Login Details</div>
          <div style="margin-bottom:10px;">
            <span style="font-size:12px;color:#64748b;">Portal URL</span><br>
            <a href="https://aeterionpeptides.com/ambassador" style="font-size:14px;color:#60a5fa;font-weight:600;text-decoration:none;">aeterionpeptides.com/ambassador</a>
          </div>
          <div style="margin-bottom:10px;">
            <span style="font-size:12px;color:#64748b;">Email</span><br>
            <span style="font-size:14px;color:#f8fafc;font-weight:600;">${email}</span>
          </div>
          <div>
            <span style="font-size:12px;color:#64748b;">Temporary Password</span><br>
            <span style="font-size:14px;color:#f8fafc;font-weight:600;font-family:monospace;background:#1e293b;padding:4px 10px;border-radius:6px;">${password}</span>
          </div>
        </div>

        <!-- Promo code -->
        <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Your Promo Code</div>
          <div style="font-size:32px;font-weight:900;color:#60a5fa;letter-spacing:4px;">${promo_code}</div>
          <div style="font-size:13px;color:#94a3b8;margin-top:8px;">Share this with your audience for <strong style="color:#4ade80;">10% off</strong> their order</div>
        </div>

        <!-- Commission -->
        <div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;">
          <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Your Commission</div>
          <div style="font-size:36px;font-weight:900;color:#4ade80;">${commission_rate}%</div>
          <div style="font-size:13px;color:#94a3b8;margin-top:8px;">Earned on every order placed using your code</div>
        </div>
      </div>

      <!-- How it works -->
      <div style="background:#1e293b;border-radius:16px;padding:24px;margin-bottom:24px;">
        <div style="font-size:14px;font-weight:700;color:#f8fafc;margin-bottom:16px;">How It Works</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="font-size:13px;color:#94a3b8;">📢 <strong style="color:#f8fafc;">Share your code</strong> — Post <span style="color:#60a5fa;font-weight:700;">${promo_code}</span> with your audience</div>
          <div style="font-size:13px;color:#94a3b8;">🛒 <strong style="color:#f8fafc;">They save 10%</strong> — Applied automatically at checkout</div>
          <div style="font-size:13px;color:#94a3b8;">💰 <strong style="color:#f8fafc;">You earn ${commission_rate}%</strong> — Tracked in your dashboard in real time</div>
          <div style="font-size:13px;color:#94a3b8;">📊 <strong style="color:#f8fafc;">Track everything</strong> — Log into your portal anytime to see earnings</div>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:32px;">
        <a href="https://aeterionpeptides.com/ambassador" style="display:inline-block;background:#1a6ed8;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
          Log Into Your Dashboard →
        </a>
      </div>

      <div style="text-align:center;font-size:12px;color:#475569;">
        Questions? Reply to this email or contact us at <a href="mailto:info@aeterionpeptides.com" style="color:#60a5fa;">info@aeterionpeptides.com</a>
      </div>

    </div>
  </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Aeterion Labs <info@notifications.aeterionpeptides.com>',
      to: [email],
      subject: `Welcome to the Aeterion Ambassador Program 🎉`,
      html,
    }),
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { admin_token, action, ambassador_id, promo_code, password, notes, commission_rate, name, email, instagram } = req.body;

  // Verify admin token server-side — raw password never touches the browser
  if (!admin_token || !verifyAdminToken(admin_token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── CREATE ambassador directly (no application needed) ─
  if (action === 'create') {
    if (!name || !email || !promo_code || !password) {
      return res.status(400).json({ error: 'Name, email, promo code, and password are required.' });
    }

    // Check email not already used
    const { data: emailRows } = await supabase
      .from('ambassadors')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .limit(1);

    if (emailRows && emailRows.length > 0) {
      return res.status(409).json({ error: 'An ambassador with this email already exists.' });
    }

    // Check promo code not already used
    const { data: codeRows } = await supabase
      .from('ambassadors')
      .select('id')
      .eq('promo_code', promo_code.toUpperCase().trim())
      .limit(1);

    if (codeRows && codeRows.length > 0) {
      return res.status(409).json({ error: 'That promo code is already in use.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { error } = await supabase.from('ambassadors').insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      instagram: instagram?.trim() || null,
      promo_code: promo_code.toUpperCase().trim(),
      password_hash,
      commission_rate: commission_rate || 20,
      status: 'approved',
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // ── LIST all ambassadors ───────────────────────────────
  if (action === 'list') {
    const { data, error } = await supabase
      .from('ambassadors')
      .select('id, name, email, instagram, audience_size, why_aeterion, status, promo_code, commission_rate, total_commission_earned, total_commission_paid, created_at, notes')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ambassadors: data });
  }

  // ── APPROVE ambassador ─────────────────────────────────
  if (action === 'approve') {
    if (!ambassador_id || !promo_code || !password) {
      return res.status(400).json({ error: 'ambassador_id, promo_code, and password are required.' });
    }

    // Check promo code isn't taken
    const { data: existingRows } = await supabase
      .from('ambassadors')
      .select('id')
      .eq('promo_code', promo_code.toUpperCase().trim())
      .neq('id', ambassador_id)
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      return res.status(409).json({ error: 'That promo code is already in use.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { error } = await supabase
      .from('ambassadors')
      .update({
        status: 'approved',
        promo_code: promo_code.toUpperCase().trim(),
        password_hash,
        commission_rate: commission_rate || 20,
        notes: notes || null,
      })
      .eq('id', ambassador_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, message: 'Ambassador approved.' });
  }

  // ── REJECT ambassador ──────────────────────────────────
  if (action === 'reject') {
    if (!ambassador_id) return res.status(400).json({ error: 'ambassador_id required.' });

    const { error } = await supabase
      .from('ambassadors')
      .update({ status: 'suspended', notes: notes || 'Rejected' })
      .eq('id', ambassador_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // ── UPDATE commission rate ─────────────────────────────
  if (action === 'update_commission') {
    if (!ambassador_id || commission_rate === undefined) {
      return res.status(400).json({ error: 'ambassador_id and commission_rate required.' });
    }
    const rate = Number(commission_rate);
    if (isNaN(rate) || rate < 1 || rate > 100) {
      return res.status(400).json({ error: 'Commission rate must be between 1 and 100.' });
    }
    const { error } = await supabase
      .from('ambassadors')
      .update({ commission_rate: rate })
      .eq('id', ambassador_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // ── REACTIVATE ambassador ────────────────────────────────
  if (action === 'reactivate') {
    if (!ambassador_id) return res.status(400).json({ error: 'ambassador_id required.' });

    const { error } = await supabase
      .from('ambassadors')
      .update({ status: 'approved' })
      .eq('id', ambassador_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // ── SUSPEND ambassador ─────────────────────────────────
  if (action === 'suspend') {
    if (!ambassador_id) return res.status(400).json({ error: 'ambassador_id required.' });

    const { error } = await supabase
      .from('ambassadors')
      .update({ status: 'suspended' })
      .eq('id', ambassador_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // ── MARK commissions as PAID ───────────────────────────
  if (action === 'mark_paid') {
    if (!ambassador_id) return res.status(400).json({ error: 'ambassador_id required.' });

    const { data: pending } = await supabase
      .from('ambassador_commissions')
      .select('commission_amount')
      .eq('ambassador_id', ambassador_id)
      .eq('status', 'pending');

    const totalPaying = (pending || []).reduce((sum, c) => sum + Number(c.commission_amount), 0);

    // Mark all pending as paid
    await supabase
      .from('ambassador_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('ambassador_id', ambassador_id)
      .eq('status', 'pending');

    // Update ambassador totals
    const { data: amb } = await supabase
      .from('ambassadors')
      .select('total_commission_paid')
      .eq('id', ambassador_id)
      .single();

    if (amb) {
      await supabase
        .from('ambassadors')
        .update({
          total_commission_paid: Number(amb.total_commission_paid) + totalPaying,
        })
        .eq('id', ambassador_id);
    }

    return res.status(200).json({ success: true, amount_paid: totalPaying });
  }

  // ── LIST all commissions ───────────────────────────────
  if (action === 'list_commissions') {
    const { data, error } = await supabase
      .from('ambassador_commissions')
      .select('*, ambassadors(name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ commissions: data });
  }

  // ── DELETE ambassador ──────────────────────────────────
  if (action === 'delete_ambassador') {
    if (!ambassador_id) return res.status(400).json({ error: 'ambassador_id required.' });
    await supabase.from('ambassador_commissions').delete().eq('ambassador_id', ambassador_id);
    const { error } = await supabase.from('ambassadors').delete().eq('id', ambassador_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // ── DELETE single commission ───────────────────────────
  if (action === 'delete_commission') {
    const { commission_id } = req.body;
    if (!commission_id) return res.status(400).json({ error: 'commission_id required.' });
    const { data: comm } = await supabase
      .from('ambassador_commissions')
      .select('commission_amount, ambassador_id')
      .eq('id', commission_id)
      .single();
    if (comm) {
      const { data: amb } = await supabase
        .from('ambassadors')
        .select('total_commission_earned')
        .eq('id', comm.ambassador_id)
        .single();
      if (amb) {
        const newTotal = Math.max(0, Number(amb.total_commission_earned) - Number(comm.commission_amount));
        await supabase.from('ambassadors').update({ total_commission_earned: newTotal }).eq('id', comm.ambassador_id);
      }
    }
    const { error } = await supabase.from('ambassador_commissions').delete().eq('id', commission_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // ── DELETE order ───────────────────────────────────────
  if (action === 'delete_order') {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id required.' });
    const { error } = await supabase.from('orders').delete().eq('id', order_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Unknown action.' });
}
