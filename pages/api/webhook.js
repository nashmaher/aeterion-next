import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" });
const SB_URL = "https://kafwkhbzdtpsxkufmkmm.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZndraGJ6ZHRwc3hrdWZta21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDEyODAsImV4cCI6MjA4ODQ3NzI4MH0.sa4_CFHQpBkWVc02et_pSsu35wqPLQpD8g4WIxYRCIA";

function generateOrderNumber(sessionId) {
  const num = parseInt(sessionId.replace(/\D/g, "").slice(-5)) % 99999;
  return `AET-${new Date().getFullYear()}-${String(num).padStart(5, "0")}`;
}

async function sb(path, method = "GET", body = null) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path} failed [${res.status}]: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function sendEmail({ to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Aeterion Labs <info@notifications.aeterionpeptides.com>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error [${res.status}]: ${err}`);
  }
  return res.json();
}

function buildCustomerEmail({ customerName, items, total, orderId, orderNumber }) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${item.description}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;text-align:right;">$${(item.amount_total / 100).toFixed(2)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td style="background:linear-gradient(135deg,#1a6ed8,#1557b0);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:8px;">AETERION LABS</div>
    <div style="font-size:28px;font-weight:900;color:#fff;margin-bottom:4px;">Order Confirmed ✓</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.8);">Thank you for your order, ${customerName}!</div>
  </td></tr>
  <tr><td style="background:#fff;padding:36px 40px;">
    <div style="background:#f8fafc;border-radius:10px;padding:16px 18px;margin-bottom:28px;border:1px solid #e2e8f0;">
      <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:4px;">ORDER NUMBER</div>
      <div style="font-size:22px;color:#1a6ed8;font-weight:900;letter-spacing:1px;">${orderNumber}</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 16px;font-size:11px;color:#64748b;text-align:left;">Product</th>
        <th style="padding:10px 16px;font-size:11px;color:#64748b;text-align:center;">Qty</th>
        <th style="padding:10px 16px;font-size:11px;color:#64748b;text-align:right;">Price</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot><tr style="background:#f8fafc;">
        <td colspan="2" style="padding:14px 16px;font-size:15px;font-weight:800;color:#1e293b;">Total</td>
        <td style="padding:14px 16px;font-size:15px;font-weight:800;color:#1a6ed8;text-align:right;">$${(total / 100).toFixed(2)}</td>
      </tr></tfoot>
    </table>
    <div style="background:#eff6ff;border-radius:10px;padding:18px 20px;border:1px solid #bfdbfe;">
      <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px;">Need help?</div>
      <div style="font-size:13px;color:#64748b;">Contact us at <a href="mailto:info@aeterionpeptides.com" style="color:#1a6ed8;font-weight:600;">info@aeterionpeptides.com</a></div>
    </div>
  </td></tr>
  <tr><td style="background:#1e293b;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.4);line-height:1.7;">All products are strictly for research purposes only. Not for human consumption.<br>
    <a href="https://aeterionpeptides.com" style="color:rgba(255,255,255,0.4);text-decoration:none;">aeterionpeptides.com</a></div>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function buildAdminEmail({ customerName, customerEmail, customerPhone, shippingAddress, items, total, orderNumber, promoCode, commissionAmount }) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${item.description}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#1a6ed8;text-align:right;">$${(item.amount_total / 100).toFixed(2)}</td>
    </tr>`).join("");
  const addr = shippingAddress;
  const addressStr = addr ? `${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}, ${addr.city}, ${addr.state} ${addr.postal_code}` : "N/A";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:30px 20px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td style="background:#0f172a;border-radius:12px 12px 0 0;padding:24px 32px;">
    <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">AETERION LABS — ADMIN</div>
    <div style="font-size:22px;font-weight:900;color:#fff;">🛍️ New Order — ${orderNumber}</div>
    <div style="font-size:20px;font-weight:900;color:#60a5fa;">$${(total / 100).toFixed(2)}</div>
    ${promoCode ? `<div style="font-size:12px;color:#fbbf24;margin-top:6px;">🎟 Promo: ${promoCode}${commissionAmount ? ` · Commission owed: $${commissionAmount.toFixed(2)}` : ""}</div>` : ""}
  </td></tr>
  <tr><td style="background:#fff;padding:28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
      ${[["👤 Name", customerName], ["📧 Email", customerEmail], ["📱 Phone", customerPhone || "N/A"], ["📦 Ship To", addressStr]].map(([label, value]) => `
      <tr><td style="padding:10px 16px;font-size:12px;font-weight:700;color:#64748b;width:100px;border-bottom:1px solid #e2e8f0;">${label}</td>
      <td style="padding:10px 16px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${value}</td></tr>`).join("")}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 14px;font-size:11px;color:#64748b;text-align:left;">Product</th>
        <th style="padding:10px 14px;font-size:11px;color:#64748b;text-align:center;">Qty</th>
        <th style="padding:10px 14px;font-size:11px;color:#64748b;text-align:right;">Price</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot><tr style="background:#f0fdf4;">
        <td colspan="2" style="padding:12px 14px;font-size:15px;font-weight:800;color:#1e293b;">Total</td>
        <td style="padding:12px 14px;font-size:15px;font-weight:800;color:#16a34a;text-align:right;">$${(total / 100).toFixed(2)}</td>
      </tr></tfoot>
    </table>
    <a href="https://dashboard.stripe.com/payments" style="display:inline-block;background:#1a6ed8;color:#fff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-right:10px;">View in Stripe</a>
    <a href="mailto:${customerEmail}" style="display:inline-block;background:#f8fafc;color:#1e293b;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;border:1px solid #e2e8f0;">Email Customer</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function buildAmbassadorEmail({ ambassadorName, ambassadorEmail, customerEmail, commissionAmount, orderTotal, promoCode, orderNumber }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
  <tr><td style="background:linear-gradient(135deg,#1a6ed8,#1557b0);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:8px;">AETERION LABS</div>
    <div style="font-size:26px;font-weight:900;color:#fff;">💰 You Earned a Commission!</div>
  </td></tr>
  <tr><td style="background:#fff;padding:36px 40px;">
    <p style="font-size:15px;color:#1e293b;margin:0 0 24px;">Hey ${ambassadorName || "Ambassador"}, someone just placed an order using your code <strong>${promoCode}</strong>!</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:24px;border:1px solid #bbf7d0;text-align:center;margin-bottom:24px;">
      <div style="font-size:12px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Your Commission</div>
      <div style="font-size:42px;font-weight:900;color:#16a34a;">$${commissionAmount.toFixed(2)}</div>
      <div style="font-size:13px;color:#64748b;margin-top:6px;">Order total: $${(orderTotal / 100).toFixed(2)} · Commission rate: 20%</div>
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:16px;border:1px solid #e2e8f0;margin-bottom:24px;">
      <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Order Number</div>
      <div style="font-size:16px;font-weight:700;color:#1a6ed8;">${orderNumber}</div>
    </div>
    <p style="font-size:13px;color:#64748b;margin:0;">Commissions are reviewed and paid out monthly. Log into your <a href="https://aeterionpeptides.com/ambassador" style="color:#1a6ed8;font-weight:600;">ambassador dashboard</a> to track your earnings.</p>
  </td></tr>
  <tr><td style="background:#1e293b;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.4);">Aeterion Labs Ambassador Program · aeterionpeptides.com</div>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  console.log("=== WEBHOOK RECEIVED ===", req.body?.type);

  // Log full session data immediately so we can debug
  try {
    const preview = req.body?.data?.object;
    console.log("Session preview:", JSON.stringify({
      id: preview?.id,
      amount_total: preview?.amount_total,
      metadata: preview?.metadata,
      customer_details: preview?.customer_details?.email,
    }));
  } catch {}

  try {
    const event = req.body;
    if (!event?.type) return res.status(400).json({ error: "Invalid event" });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Session ID:", session.id);
      console.log("Metadata:", JSON.stringify(session.metadata));
      console.log("Amount total:", session.amount_total);

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      const customerName    = session.customer_details?.name || "Valued Customer";
      const customerEmail   = session.customer_details?.email;
      const customerPhone   = session.customer_details?.phone;
      // FIXED: correct Stripe field for shipping address
      const shippingAddress = session.shipping_details?.address;
      const orderNumber     = generateOrderNumber(session.id);
      const promoCode       = session.metadata?.promo_code || null;
      const ambassadorId    = session.metadata?.ambassador_id || null;

      console.log("Customer:", customerName, customerEmail);
      console.log("Promo code:", promoCode, "| Ambassador ID:", ambassadorId);
      console.log("Shipping address:", JSON.stringify(shippingAddress));

      // ── 1. SAVE ORDER TO SUPABASE (idempotent) ──
      try {
        const existingOrder = await sb(`orders?id=eq.${session.id}&select=id`).catch(() => []);
        if (existingOrder?.length) {
          console.log(`⚠️ Order ${session.id} already exists — skipping insert`);
        } else {
          await sb("orders", "POST", {
            id:               session.id,
            order_number:     orderNumber,
            customer_name:    customerName,
            customer_email:   customerEmail,
            customer_phone:   customerPhone,
            shipping_address: shippingAddress || null,
            items:            lineItems.data.map(i => ({ description: i.description, quantity: i.quantity, amount_total: i.amount_total })),
            total:            session.amount_total,
            status:           "processing",
            user_id:          session.metadata?.user_id || null,
            promo_code:       promoCode || null,
            ambassador_id:    ambassadorId ? String(ambassadorId) : null,
          });
          console.log("✓ Order saved to Supabase:", orderNumber);
        }
      } catch (e) {
        console.error("✗ Supabase order save FAILED:", e.message);
      }

      // ── 2. CUSTOMER EMAIL ──
      if (customerEmail) {
        try {
          await sendEmail({
            to: customerEmail,
            subject: `Order Confirmed ${orderNumber} — Aeterion Labs`,
            html: buildCustomerEmail({ customerName, items: lineItems.data, total: session.amount_total, orderId: session.id, orderNumber }),
          });
          console.log("✓ Customer email sent to:", customerEmail);
        } catch (e) {
          console.error("✗ Customer email FAILED:", e.message);
        }
      } else {
        console.warn("No customer email on session — skipping customer email");
      }

      // ── 3. ADMIN EMAIL ──
      try {
        await sendEmail({
          to: "info@aeterionpeptides.com",
          subject: `🛍️ New Order ${orderNumber} — $${(session.amount_total / 100).toFixed(2)} from ${customerName}`,
          html: buildAdminEmail({ customerName, customerEmail, customerPhone, shippingAddress, items: lineItems.data, total: session.amount_total, orderNumber, promoCode, commissionAmount: null }),
        });
        console.log("✓ Admin email sent");
      } catch (e) {
        console.error("✗ Admin email FAILED:", e.message);
      }

      // ── 4. AMBASSADOR COMMISSION ──
      if (promoCode && ambassadorId) {
        try {
          // IDEMPOTENT: check if commission already recorded for this session
          const existing = await sb(`ambassador_commissions?stripe_session_id=eq.${session.id}&select=id`);
          if (existing?.length) {
            console.log(`⚠️ Commission already recorded for session ${session.id} — skipping duplicate`);
          } else {
            // Commission based on product subtotal only (sum of line items, no shipping)
            const productSubtotal  = lineItems.data.reduce((sum, i) => sum + i.amount_total, 0) / 100;
            const commissionAmount = productSubtotal * 0.20;

            // Insert commission record
            await sb("ambassador_commissions", "POST", {
              ambassador_id:     ambassadorId,
              order_id:          session.payment_intent || session.id,
              stripe_session_id: session.id,
              customer_email:    customerEmail || "",
              order_subtotal:    productSubtotal,
              discount_amount:   productSubtotal * 0.10,
              commission_amount: commissionAmount,
              promo_code:        promoCode,
              status:            "pending",
            });
            console.log(`✓ Commission logged: $${commissionAmount.toFixed(2)}`);

            // Update ambassador running total
            try {
              const ambData = await sb(`ambassadors?id=eq.${ambassadorId}&select=id,name,email,total_commission_earned`);
              if (ambData?.length) {
                const amb      = ambData[0];
                const newTotal = Number(amb.total_commission_earned || 0) + commissionAmount;
                await sb(`ambassadors?id=eq.${ambassadorId}`, "PATCH", { total_commission_earned: newTotal });
                console.log(`✓ Ambassador total updated to $${newTotal.toFixed(2)}`);

                if (amb.email) {
                  try {
                    await sendEmail({
                      to: amb.email,
                      subject: `💰 You earned $${commissionAmount.toFixed(2)} — Aeterion Commission`,
                      html: buildAmbassadorEmail({
                        ambassadorName:   amb.name,
                        ambassadorEmail:  amb.email,
                        customerEmail:    customerEmail,
                        commissionAmount: commissionAmount,
                        orderTotal:       session.amount_total,
                        promoCode:        promoCode,
                        orderNumber:      orderNumber,
                      }),
                    });
                    console.log("✓ Ambassador email sent to:", amb.email);
                  } catch (e) {
                    console.error("✗ Ambassador email FAILED:", e.message);
                  }
                }
              }
            } catch (e) {
              console.error("✗ Ambassador total update FAILED:", e.message);
            }
          } // end else (not duplicate)
        } catch (e) {
          console.error("✗ Commission insert FAILED:", e.message);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("✗ Webhook top-level error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };
