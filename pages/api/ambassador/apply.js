// pages/api/ambassador/apply.js
// Public endpoint — receives ambassador application form submissions

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service role — can insert even with RLS
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, instagram, audience_size, why_aeterion } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  // Check if already applied
  const { data: existing } = await supabase
    .from('ambassadors')
    .select('id, status')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (existing) {
    const msg = existing.status === 'approved'
      ? 'This email already has an approved ambassador account.'
      : 'An application with this email already exists. We\'ll be in touch soon.';
    return res.status(409).json({ error: msg });
  }

  const { error } = await supabase.from('ambassadors').insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    instagram: instagram?.trim() || null,
    audience_size: audience_size?.trim() || null,
    why_aeterion: why_aeterion?.trim() || null,
    status: 'pending',
  });

  if (error) {
    console.error('Ambassador apply error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }

  return res.status(200).json({ success: true });
}
