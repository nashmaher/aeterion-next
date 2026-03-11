// pages/api/ambassador/test.js
// TEMPORARY diagnostic endpoint - delete after fixing

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const results = {};

  // 1. Check env vars exist
  results.has_supabase_url = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  results.has_service_key = !!process.env.SUPABASE_SERVICE_KEY;
  results.has_admin_password = !!process.env.ADMIN_PASSWORD;
  results.supabase_url_preview = process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...';

  // 2. Try connecting to Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // 3. Try querying ambassadors table
    const { data, error } = await supabase
      .from('ambassadors')
      .select('id')
      .limit(1);

    results.supabase_connected = !error;
    results.supabase_error = error?.message || null;
    results.ambassadors_table_exists = !error;
    results.row_count = data?.length ?? 0;

  } catch (e) {
    results.supabase_connected = false;
    results.supabase_exception = e.message;
  }

  // 4. Test bcryptjs
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('test', 4);
    results.bcryptjs_works = !!hash;
  } catch (e) {
    results.bcryptjs_works = false;
    results.bcryptjs_error = e.message;
  }

  return res.status(200).json(results);
}
