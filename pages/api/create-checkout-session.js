import Stripe from "stripe";

const SB_URL = "https://kafwkhbzdtpsxkufmkmm.supabase.co";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
        const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

    if (!items || !items.length) {
      return res.status(400).json({ error: "No items in cart" });
    }

    const line_items = items.map(item => {
      // NO STACKING: if promo code applied, use original unit price (no bulk discount)
      // if no promo code, use the already bulk-discounted lt from frontend
      const unitAmountCents = promoCode
        ? Math.round(item.p * 100)                        // original price, no bulk
        : Math.round((item.lt / item.qty) * 100);         // bulk-discounted price

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.name} (${item.size})`,
            description: promoCode
              ? `${item.qty} vial${item.qty > 1 ? "s" : ""} — ${promoCode} discount applied`
              : item.qty >= 10 ? `${item.qty} vials — 18% bulk discount applied`
              : item.qty >= 5  ? `${item.qty} vials — 8% bulk discount applied`
              : "1 vial — Research use only",
            metadata: {
              product_id: String(item.id),
              qty_ordered: String(item.qty),
            },
          },
          unit_amount: unitAmountCents,
        },
        quantity: item.qty,
      };
    });

    // Subtotal for shipping threshold (use original prices)
    const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.p * 100) * item.qty, 0);
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
    return res.status(500).json({ error: err.message });
  }
};
