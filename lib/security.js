// lib/security.js
// Shared security utilities for API routes

import crypto from 'crypto';

// ── Environment ────────────────────────────────────────────
export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseConfig() {
  return {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    key: requireEnv('SUPABASE_SERVICE_KEY'),
  };
}

// ── Rate Limiting (per-instance, in-memory) ────────────────
const buckets = new Map();

export function rateLimiter(name, maxAttempts, windowMs) {
  return function check(key) {
    const bucketKey = `${name}:${key}`;
    const now = Date.now();
    let bucket = buckets.get(bucketKey);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(bucketKey, bucket);
    }

    if (bucket.count >= maxAttempts) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }

    bucket.count++;
    return { allowed: true, remaining: maxAttempts - bucket.count, retryAfter: 0 };
  };
}

// ── Email Validation ───────────────────────────────────────
const EMAIL_RE = /^[^\s@<>()[\]\\,;:]+@[^\s@<>()[\]\\,;:]+\.[^\s@<>()[\]\\,;:]{2,}$/;

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  if (email.includes('\n') || email.includes('\r')) return false;
  return EMAIL_RE.test(email);
}

// ── Error Sanitization ─────────────────────────────────────
export function sanitizeError(err) {
  if (process.env.NODE_ENV !== 'production') {
    return err?.message || 'Internal server error';
  }
  return 'Internal server error';
}

// ── Ambassador Session Tokens ──────────────────────────────
const AMB_TOKEN_SECRET_KEY = 'AMBASSADOR_TOKEN_SECRET';

function getAmbassadorSecret() {
  // Use ADMIN_PASSWORD as HMAC secret for ambassador tokens
  // This is acceptable because ambassador tokens are short-lived
  return process.env.ADMIN_PASSWORD || process.env.SUPABASE_SERVICE_KEY || '';
}

export function generateAmbassadorToken(ambassadorId) {
  const secret = getAmbassadorSecret();
  const timestamp = Date.now().toString();
  const payload = `${ambassadorId}.${timestamp}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64');
}

export function verifyAmbassadorToken(token) {
  try {
    const secret = getAmbassadorSecret();
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length !== 3) return null;

    const [ambassadorId, timestamp, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${ambassadorId}.${timestamp}`).digest('hex');

    if (sig !== expectedSig) return null;

    // Token expires after 24 hours
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) return null;

    return ambassadorId;
  } catch {
    return null;
  }
}

// ── CORS Helper ────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://aeterionpeptides.com',
  'https://www.aeterionpeptides.com',
];

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // Allow localhost in development
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
