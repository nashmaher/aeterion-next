// pages/api/ambassador/dashboard.js
// Returns commission data for a logged-in ambassador (requires session token)

import { createClient } from '@supabase/supabase-js';
import { verifyAmbassadorToken } from '../../../lib/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify session token (signed during login)
  const { session_token } = req.body;
  const ambassador_id = verifyAmbassadorToken(session_token);
  if (!ambassador_id) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  // Get ambassador info
  const { data: ambassador, error: ambError } = await supabase
    .from('ambassadors')
    .select('id, name, email, promo_code, commission_rate, total_commission_earned, total_commission_paid, created_at')
    .eq('id', ambassador_id)
    .eq('status', 'approved')
    .single();

  if (ambError || !ambassador) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Get all commissions for this ambassador
  const { data: commissions, error: comError } = await supabase
    .from('ambassador_commissions')
    .select('*')
    .eq('ambassador_id', ambassador_id)
    .order('created_at', { ascending: false });

  if (comError) {
    return res.status(500).json({ error: 'Failed to load commission data.' });
  }

  // Calculate totals
  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const totalOrders = commissions.length;

  return res.status(200).json({
    ambassador,
    commissions,
    stats: {
      totalEarned,
      totalPending,
      totalPaid,
      totalOrders,
    },
  });
}
