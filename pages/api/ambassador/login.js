// pages/api/ambassador/login.js
// Validates ambassador email + password, returns their data

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  const { data: ambassador, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('status', 'approved')
    .single();

  if (error || !ambassador) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!ambassador.password_hash) {
    return res.status(401).json({ error: 'Account not fully set up yet. Contact support.' });
  }

  const valid = await bcrypt.compare(password, ambassador.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

  // Return safe ambassador data (no password hash)
  const { password_hash, ...safeData } = ambassador;
  return res.status(200).json({ ambassador: safeData });
}
