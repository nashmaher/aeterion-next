import { getSupabaseConfig, setCorsHeaders, sanitizeError } from "../../lib/security";
const { PRODUCTS } = require('../../lib/products');

const { url: SB_URL } = getSupabaseConfig();
const DISC_RATE = qty => qty >= 10 ? 0.82 : qty >= 5 ? 0.92 : 1;

const PAYPAL_API = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials not configured");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${clientId}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed [${res.status}]: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { items, user_id, user_email, promoCode } = req.body;

    // ── Validate promo code if provided ──
    let validatedAmbassador = null;
    let promoDiscountPct = 0;

    if (promoCode) {
      const normalized = promoCode.toUpperCase().trim();

      // ── WELCOME10 — 10% off first order ──
      if (normalized === "WELCOME10") {
        promoDiscountPct = 10;
      }

      // ── SAVE5 — 5% off cart abandonment recovery ──
      else if (normalized === "SAVE5") {
        promoDiscountPct = 5;
      }

      // ── WELCOME-* and SAVE-* codes (from email_subscribers table) ──
      else if (normalized.startsWith("WELCOME-") || normalized.startsWith("SAVE-")) {
        const sbKey = process.env.SUPABASE_SERVICE_KEY;
        const codeRes = await fetch(
          `${SB_URL}/rest/v1/email_subscribers?discount_code=eq.${encodeURIComponent(normalized)}&code_used=eq.false&select=discount_pct`,
          { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
        );
        const codeData = await codeRes.json();
        if (codeData?.length) {
          promoDiscountPct = codeData[0].discount_pct || 10;
        } else {
          return res.status(400).json({ error: "This promo code is invalid or has already been used." });
        }
      }

      // ── REVIEW-* codes ──
      else if (normalized.startsWith("REVIEW-")) {
        const sbKey = process.env.SUPABASE_SERVICE_KEY;
        const codeRes = await fetch(
          `${SB_URL}/rest/v1/review_codes?code=eq.${encodeURIComponent(normalized)}&code_used=eq.false&select=id`,
          { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
        );
        const codeData = await codeRes.json();
        if (codeData?.length) {
          promoDiscountPct = 10;
        } else {
          return res.status(400).json({ error: "This promo code is invalid or has already been used." });
        }
      }

      // ── Ambassador codes ──
      else {
        const sbKey = process.env.SUPABASE_SERVICE_KEY;
        const promoRes = await fetch(`${SB_URL}/rest/v1/ambassadors?promo_code=eq.${encodeURIComponent(normalized)}&status=eq.approved&select=id,promo_code,commission_rate,free_shipping`, {
          headers: { "apikey": sbKey, "Authorization": `Bearer ${sbKey}` }
        });
        const promoData = await promoRes.json();
        if (promoData?.length) {
          validatedAmbassador = promoData[0];
          promoDiscountPct = 10; // Ambassador codes always give 10% off
        }
      }
    }

    // ── Atomically claim single-use promo codes to prevent race conditions ──
    if (promoCode && promoDiscountPct > 0) {
      const normalized = promoCode.toUpperCase().trim();
      const sbKey = process.env.SUPABASE_SERVICE_KEY;

      // WELCOME-* and SAVE-* codes (from email_subscribers table)
      if (normalized.startsWith('WELCOME-') || normalized.startsWith('SAVE-')) {
        const claimRes = await fetch(
          `${SB_URL}/rest/v1/email_subscribers?discount_code=eq.${encodeURIComponent(normalized)}&code_used=eq.false`,
          {
            method: 'PATCH',
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({ code_used: true }),
          }
        );
        const claimed = await claimRes.json();
        if (!claimed?.length) {
          return res.status(400).json({ error: 'This promo code has already been used.' });
        }
      }

      // REVIEW-* codes (from review_codes table)
      if (normalized.startsWith('REVIEW-')) {
        const claimRes = await fetch(
          `${SB_URL}/rest/v1/review_codes?code=eq.${encodeURIComponent(normalized)}&code_used=eq.false`,
          {
            method: 'PATCH',
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({ code_used: true }),
          }
        );
        const claimed = await claimRes.json();
        if (!claimed?.length) {
          return res.status(400).json({ error: 'This promo code has already been used.' });
        }
      }
    }

    if (!items || !items.length) {
      return res.status(400).json({ error: "No items in cart" });
    }

    // ── Server-side price validation & line item building ──
    let itemTotalCents = 0;
    const paypalItems = items.map(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      if (!product) throw new Error(`Unknown product ID: ${item.id}`);
      const variant = product.variants?.find(v => v.s === item.size);
      if (!variant) throw new Error(`Unknown variant ${item.size} for product ${product.name}`);

      const canonicalPrice = variant.p;
      const qty = Math.max(1, Math.min(99, Math.floor(item.qty || 1)));

      // Calculate unit price server-side
      let unitPriceCents;
      if (promoCode && promoDiscountPct > 0) {
        // Promo code: apply percentage discount, no bulk discount
        unitPriceCents = Math.round(canonicalPrice * (1 - promoDiscountPct / 100) * 100);
      } else {
        // No promo: apply bulk discount server-side
        const rate = DISC_RATE(qty);
        unitPriceCents = Math.round(canonicalPrice * rate * 100);
      }

      itemTotalCents += unitPriceCents * qty;

      return {
        name: `${product.name} (${item.size})`,
        description: promoCode && promoDiscountPct > 0
          ? `${qty} vial${qty > 1 ? "s" : ""} — ${promoCode} ${promoDiscountPct}% discount applied`
          : qty >= 10 ? `${qty} vials — 18% bulk discount applied`
          : qty >= 5  ? `${qty} vials — 8% bulk discount applied`
          : "1 vial — Research use only",
        unit_amount: {
          currency_code: "USD",
          value: (unitPriceCents / 100).toFixed(2),
        },
        quantity: String(qty),
        category: "PHYSICAL_GOODS",
      };
    });

    // Subtotal for shipping threshold (use canonical prices, not discounted)
    const canonicalSubtotalCents = items.reduce((sum, item) => {
      const product = PRODUCTS.find(p => p.id === item.id);
      const variant = product?.variants?.find(v => v.s === item.size);
      const price = variant?.p || 0;
      const qty = Math.max(1, Math.min(99, Math.floor(item.qty || 1)));
      return sum + Math.round(price * 100) * qty;
    }, 0);
    const ambassadorFreeShipping = validatedAmbassador?.free_shipping === true;
    const freeShipping = canonicalSubtotalCents >= 25000 || ambassadorFreeShipping;

    const shippingCents = freeShipping ? 0 : 1500;
    const orderTotalCents = itemTotalCents + shippingCents;

    // ── Build metadata (stored in custom_id, max 127 chars) ──
    const metadata = JSON.stringify({
      uid: user_id || "",
      pc: promoCode ? promoCode.toUpperCase().trim() : "",
      aid: validatedAmbassador?.id || "",
    });

    // ── Get PayPal access token ──
    const accessToken = await getPayPalAccessToken();

    // ── Create PayPal order ──
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [{
        custom_id: metadata,
        description: `Aeterion Labs Order${promoCode ? ` (Promo: ${promoCode.toUpperCase().trim()})` : ""}`,
        amount: {
          currency_code: "USD",
          value: (orderTotalCents / 100).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: (itemTotalCents / 100).toFixed(2),
            },
            shipping: {
              currency_code: "USD",
              value: (shippingCents / 100).toFixed(2),
            },
          },
        },
        items: paypalItems,
      }],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "Aeterion Labs",
            locale: "en-US",
            landing_page: "LOGIN",
            shipping_preference: "GET_FROM_FILE",
            user_action: "PAY_NOW",
            return_url: "https://aeterionpeptides.com/?payment=success",
            cancel_url: "https://aeterionpeptides.com/?payment=cancelled",
          },
        },
      },
    };

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error("PayPal order creation failed:", errText);
      throw new Error(`PayPal error [${orderRes.status}]`);
    }

    const order = await orderRes.json();

    // Find the approval URL for redirect
    const approveLink = order.links?.find(l => l.rel === "payer-action");
    if (!approveLink) {
      throw new Error("No PayPal approval URL returned");
    }

    return res.status(200).json({ url: approveLink.href });

  } catch (err) {
    console.error("PayPal error:", err.message);
    return res.status(500).json({ error: sanitizeError(err) });
  }
}
