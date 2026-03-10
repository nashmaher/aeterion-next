const Stripe = require("stripe");

module.exports = async function handler(req, res) {
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
    const { items, user_id, user_email } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "No items in cart" });
    }

    // Calculate subtotal to determine shipping
    const subtotalCents = items.reduce((sum, item) => sum + Math.round((item.lt / item.qty) * 100) * item.qty, 0);
    const freeShipping = subtotalCents >= 25000; // $250+

    const line_items = items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.name} (${item.size})`,
          description: item.qty > 1
            ? `${item.qty} vials — ${item.qty === 5 ? "8% bulk discount applied" : "18% bulk discount applied"}`
            : "1 vial — Research use only",
          metadata: {
            product_id: String(item.id),
            qty_ordered: String(item.qty),
          },
        },
        unit_amount: Math.round((item.lt / item.qty) * 100),
      },
      quantity: item.qty,
    }));

    const shippingOptions = freeShipping ? [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "usd" },
          display_name: "Free Shipping",
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
      },
    };

    // Pre-fill email if user is signed in
    if (user_email) sessionParams.customer_email = user_email;

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
