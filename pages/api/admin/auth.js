// pages/api/admin/auth.js
// Validates admin password server-side and returns a signed session token
// The raw password is NEVER sent to or stored in the browser

import crypto from 'crypto';

function generateToken() {
  const secret = process.env.ADMIN_PASSWORD || 'aeterion2026';
  const timestamp = Date.now().toString();
  const sig = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return Buffer.from(`${timestamp}.${sig}`).toString('base64');
}

export function verifyAdminToken(token) {
  try {
    const secret = process.env.ADMIN_PASSWORD || 'aeterion2026';
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [timestamp, sig] = decoded.split('.');
    const expectedSig = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
    if (sig !== expectedSig) return false;
    // Token expires after 8 hours
    if (Date.now() - parseInt(timestamp) > 8 * 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aeterion2026';

  if (!password || password !== ADMIN_PASSWORD) {
    // Small delay to slow brute force
    await new Promise(r => setTimeout(r, 500));
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = generateToken();
  return res.status(200).json({ token });
}
