// pages/api/admin/auth.js
// Validates admin password server-side and returns a signed session token
// The raw password is NEVER sent to or stored in the browser

import crypto from 'crypto';
import { rateLimiter, requireEnv } from '../../../lib/security';

const loginLimiter = rateLimiter('admin-login', 5, 15 * 60 * 1000); // 5 attempts per 15 min

function generateToken() {
  const secret = requireEnv('ADMIN_PASSWORD');
  const timestamp = Date.now().toString();
  const sig = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return Buffer.from(`${timestamp}.${sig}`).toString('base64');
}

export function verifyAdminToken(token) {
  try {
    const secret = requireEnv('ADMIN_PASSWORD');
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

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const { allowed, retryAfter } = loginLimiter(ip);
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  const { password } = req.body;
  const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');

  if (!password || password !== ADMIN_PASSWORD) {
    // Delay to slow brute force
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = generateToken();
  return res.status(200).json({ token });
}
