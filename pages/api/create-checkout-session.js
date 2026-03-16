import Stripe from "stripe";
import { getSupabaseConfig, setCorsHeaders, sanitizeError } from "../../lib/security";
const { PRODUCTS } = require('../../lib/products');

const { url: SB_URL } = getSupabaseConfig();
const DISC_RATE = qty => qty >= 10 ? 0.82 : qty >= 5 ? 0.92 : 1;

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY environment variable is not set" });
  }

  const stripe = new Stripe(key, { apiVersion: "2023-10-16" });

  try {
    const { items, user_id, user_email, promoCode } = req.body;

    // ── Validate promo code if provided ──
    let validatedAmbassador = null;
    let stripeCouponId = null;

    if (promoCode) {
      const normalized = promoCode.toUpperCase().trim();

      // ── WELCOME10 — 10% off first order ──
      if (normalized === "WELCOME10") {
        const couponId = "WELCOME10";
        try {
          await stripe.coupons.retrieve(couponId);
          stripeCouponId = couponId;
        } catch {
          const coupon = await stripe.coupons.create({
            id: couponId,
            percent_off: 10,
            duration: "once",
            name: "10% Off — First Order (WELCOME10)",
          });
          stripeCouponId = coupon.id;
        }
      }

      // ── SAVE5 — 5% off cart abandonment recovery ──
      else if (normalized === "SAVE5") {
        const couponId = "SAVE5";
        try {
          await stripe.coupons.retrieve(couponId);
          stripeCouponId = couponId;
        } catch {
          const coupon = await stripe.coupons.create({
            id: couponId,
            percent_off: 5,
            duration: "once",
            name: "5% Off — Recovery Discount (SAVE5)",
          });
          stripeCouponId = coupon.id;
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
          const couponId = `AMB_${validatedAmbassador.promo_code}`;
          try {
            await stripe.coupons.retrieve(couponId);
            stripeCouponId = couponId;
          } catch {
            // Coupon doesn't exist yet — create it (handles new ambassadors automatically)
            const coupon = await stripe.coupons.create({
              id: couponId,
              percent_off: 10,
              duration: "once",
              name: `Ambassador Code: ${validatedAmbassador.promo_code}`,
            });
            stripeCouponId = coupon.id;
          }
        }
      }
    }

    // ── Atomically claim single-use promo codes to prevent race conditions ──
    let claimedCode = null;
    if (promoCode && stripeCouponId) {
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
        claimedCode = { table: 'email_subscribers', column: 'discount_code', value: normalized };
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
        claimedCode = { table: 'review_codes', column: 'code', value: normalized };
      }
    }

    if (!items || !items.length) {
      return res.status(400).json({ error: "No items in cart" });
    }

    // ── Server-side price validation ──
    const line_items = items.map(item => {
      // Look up canonical price from product catalog
      const product = PRODUCTS.find(p => p.id === item.id);
      if (!product) {
        throw new Error(`Unknown product ID: ${item.id}`);
      }
      const variant = product.variants?.find(v => v.s === item.size);
      if (!variant) {
        throw new Error(`Unknown variant ${item.size} for product ${product.name}`);
      }

      const canonicalPrice = variant.p; // authoritative price from server
      const qty = Math.max(1, Math.min(99, Math.floor(item.qty || 1)));

      // Calculate unit price server-side
      let unitAmountCents;
      if (promoCode) {
        // Promo code applied: use original unit price (no bulk discount)
        unitAmountCents = Math.round(canonicalPrice * 100);
      } else {
        // No promo: apply bulk discount server-side
        const rate = DISC_RATE(qty);
        unitAmountCents = Math.round(canonicalPrice * rate * 100);
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${product.name} (${item.size})`,
            description: promoCode
              ? `${qty} vial${qty > 1 ? "s" : ""} — ${promoCode} discount applied`
              : qty >= 10 ? `${qty} vials — 18% bulk discount applied`
              : qty >= 5  ? `${qty} vials — 8% bulk discount applied`
              : "1 vial — Research use only",
            metadata: {
              product_id: String(item.id),
              qty_ordered: String(qty),
            },
          },
          unit_amount: unitAmountCents,
        },
        quantity: qty,
      };
    });

    // Subtotal for shipping threshold (use canonical prices from catalog)
    const subtotalCents = items.reduce((sum, item) => {
      const product = PRODUCTS.find(p => p.id === item.id);
      const variant = product?.variants?.find(v => v.s === item.size);
      const price = variant?.p || 0;
      const qty = Math.max(1, Math.min(99, Math.floor(item.qty || 1)));
      return sum + Math.round(price * 100) * qty;
    }, 0);
    const ambassadorFreeShipping = validatedAmbassador?.free_shipping === true;
    const freeShipping = subtotalCents >= 25000 || ambassadorFreeShipping;

    const shippingOptions = freeShipping ? [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "usd" },
          display_name: ambassadorFreeShipping ? "Free Shipping (Ambassador Perk)" : "Free Shipping",
          delivery_estimate: { minimum: { unit: "week", value: 1 }, maximum: { unit: "week", value: 2 } },
        },
      },
    ] : [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 1500, currency: "usd" },
          display_name: "Standard Shipping",
          delivery_estimate: { minimum: { unit: "week", value: 1 }, maximum: { unit: "week", value: 2 } },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "usd" },
          display_name: `Free Shipping (orders $250+) — Add $${((25000 - subtotalCents) / 100).toFixed(2)} more to qualify`,
          delivery_estimate: { minimum: { unit: "week", value: 1 }, maximum: { unit: "week", value: 2 } },
        },
      },
    ];

    const sessionParams = {
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: "https://aeterionpeptides.com/?payment=success",
      cancel_url:  "https://aeterionpeptides.com/?payment=cancelled",
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: shippingOptions,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      metadata: {
        user_id: user_id || "",
        promo_code: promoCode ? promoCode.toUpperCase().trim() : "",
        ambassador_id: validatedAmbassador?.id || "",
      },
    };

    // Apply ambassador discount coupon if valid code was provided
    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    // Pre-fill email if user is signed in
    if (user_email) sessionParams.customer_email = user_email;

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err.message);
    return res.status(500).json({ error: sanitizeError(err) });
  }
};
