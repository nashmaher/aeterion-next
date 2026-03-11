// pages/api/ambassador/admin.js
// Admin-only endpoint to approve/reject/manage ambassadors
// Protected by your existing admin password

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aeterion2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { admin_password, action, ambassador_id, promo_code, password, notes, commission_rate, name, email, instagram } = req.body;

  // Verify admin
  if (admin_password !== ADMIN_PASSWORD) {
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

  return res.status(400).json({ error: 'Unknown action.' });
}
