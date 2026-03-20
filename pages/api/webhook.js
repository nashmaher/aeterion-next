import { getSupabaseConfig, sanitizeError } from "../../lib/security";

const PAYPAL_API = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";
const isDev = process.env.NODE_ENV !== "production";
const log = (...args) => { if (isDev) console.log(...args); };
const { url: SB_URL, key: SB_KEY } = getSupabaseConfig();

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

  if (!res.ok) throw new Error(`PayPal auth failed [${res.status}]`);
  const data = await res.json();
  return data.access_token;
}

function generateOrderNumber(paypalOrderId) {
  const num = parseInt(paypalOrderId.replace(/\D/g, "").slice(-5)) % 99999;
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

// ── Verify PayPal webhook signature ──
async function verifyWebhookSignature(req, rawBody) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID not configured");

  const accessToken = await getPayPalAccessToken();

  const verifyRes = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo:         req.headers["paypal-auth-algo"],
      cert_url:          req.headers["paypal-cert-url"],
      transmission_id:   req.headers["paypal-transmission-id"],
      transmission_sig:  req.headers["paypal-transmission-sig"],
      transmission_time: req.headers["paypal-transmission-time"],
      webhook_id:        webhookId,
      webhook_event:     JSON.parse(rawBody.toString()),
    }),
  });

  if (!verifyRes.ok) {
    const errText = await verifyRes.text();
    throw new Error(`Webhook verification request failed: ${errText}`);
  }

  const result = await verifyRes.json();
  return result.verification_status === "SUCCESS";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // ── Read raw body ──
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);

  // ── Verify PayPal webhook signature ──
  try {
    const isValid = await verifyWebhookSignature(req, rawBody);
    if (!isValid) {
      console.error("PayPal webhook signature verification failed");
      return res.status(400).json({ error: "Invalid signature" });
    }
  } catch (err) {
    console.error("Webhook verification error:", err.message);
    return res.status(400).json({ error: "Signature verification failed" });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  log("=== PAYPAL WEBHOOK ===", event.event_type);

  try {
    // Handle PAYMENT.CAPTURE.COMPLETED — backup for the capture-paypal-order endpoint
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource || {};
      const paypalOrderId = capture.supplementary_data?.related_ids?.order_id;

      if (!paypalOrderId) {
        log("No order ID in capture webhook — skipping");
        return res.status(200).json({ received: true });
      }

      // Check if order was already saved (by the capture endpoint)
      const existingOrder = await sb(`orders?id=eq.${paypalOrderId}&select=id`).catch(() => []);
      if (existingOrder?.length) {
        log(`Order ${paypalOrderId} already exists — webhook is backup, skipping`);
        return res.status(200).json({ received: true });
      }

      // If not already captured by the return-url flow, fetch order details and save
      const accessToken = await getPayPalAccessToken();
      const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });

      if (!orderRes.ok) {
        console.error("Failed to fetch PayPal order:", await orderRes.text());
        return res.status(200).json({ received: true });
      }

      const order = await orderRes.json();
      const payer = order.payer || {};
      const purchaseUnit = order.purchase_units?.[0] || {};
      const shipping = purchaseUnit.shipping || {};

      const customerName = shipping.name?.full_name || `${payer.name?.given_name || ""} ${payer.name?.surname || ""}`.trim() || "Valued Customer";
      const customerEmail = payer.email_address || "";
      const customerPhone = payer.phone?.phone_number?.national_number || "";
      const shippingAddress = shipping.address || null;
      const orderNumber = generateOrderNumber(paypalOrderId);

      let metadata = {};
      try { metadata = JSON.parse(purchaseUnit.custom_id || "{}"); } catch {}

      const promoCode = metadata.pc || null;
      const ambassadorId = metadata.aid || null;
      const userId = metadata.uid || null;

      const orderItems = (purchaseUnit.items || []).map(item => ({
        description: item.name,
        quantity: parseInt(item.quantity) || 1,
        amount_total: Math.round(parseFloat(item.unit_amount?.value || 0) * (parseInt(item.quantity) || 1) * 100),
      }));

      const totalCents = Math.round(parseFloat(capture.amount?.value || 0) * 100);

      // Save order
      try {
        const normalizedAddress = shippingAddress ? {
          line1: shippingAddress.address_line_1 || "",
          line2: shippingAddress.address_line_2 || "",
          city: shippingAddress.admin_area_2 || "",
          state: shippingAddress.admin_area_1 || "",
          postal_code: shippingAddress.postal_code || "",
        } : null;

        await sb("orders", "POST", {
          id:               paypalOrderId,
          order_number:     orderNumber,
          customer_name:    customerName,
          customer_email:   customerEmail,
          customer_phone:   customerPhone,
          shipping_address: normalizedAddress,
          items:            orderItems,
          total:            totalCents,
          status:           "processing",
          user_id:          userId || null,
          promo_code:       promoCode || null,
          ambassador_id:    ambassadorId ? String(ambassadorId) : null,
        });
        log("Order saved via webhook:", orderNumber);
      } catch (e) {
        console.error("Webhook order save FAILED:", e.message);
      }

      // Send emails
      const totalFormatted = (totalCents / 100).toFixed(2);
      const emailItems = orderItems.map(i => ({
        name: i.description,
        quantity: i.quantity,
        totalPrice: (i.amount_total / 100).toFixed(2),
      }));

      if (customerEmail) {
        try {
          await sendEmail({
            to: customerEmail,
            subject: `Order Confirmed ${orderNumber} — Aeterion Labs`,
            html: buildCustomerEmailSimple({ customerName, items: emailItems, total: totalFormatted, orderNumber }),
          });
        } catch (e) {
          console.error("Webhook customer email FAILED:", e.message);
        }
      }

      try {
        await sendEmail({
          to: "info@aeterionpeptides.com",
          subject: `New Order ${orderNumber} — $${totalFormatted} from ${customerName}`,
          html: `<p>New order ${orderNumber} — $${totalFormatted} from ${customerName} (${customerEmail})</p><p>Promo: ${promoCode || "none"}</p>`,
        });
      } catch (e) {
        console.error("Webhook admin email FAILED:", e.message);
      }

      // Ambassador commission (same logic as capture endpoint)
      if (promoCode && ambassadorId) {
        try {
          const existing = await sb(`ambassador_commissions?stripe_session_id=eq.${paypalOrderId}&select=id`);
          if (!existing?.length) {
            const ambData = await sb(`ambassadors?id=eq.${ambassadorId}&select=id,name,email,commission_rate,total_commission_earned`);
            const amb = ambData?.[0];
            const commissionRatePct = Number(amb?.commission_rate ?? 20);
            const productSubtotal = orderItems.reduce((sum, i) => sum + i.amount_total, 0) / 100;
            const commissionAmount = productSubtotal * (commissionRatePct / 100);

            await sb("ambassador_commissions", "POST", {
              ambassador_id:     ambassadorId,
              order_id:          paypalOrderId,
              stripe_session_id: paypalOrderId,
              customer_email:    customerEmail || "",
              order_subtotal:    productSubtotal,
              discount_amount:   productSubtotal * 0.10,
              commission_amount: commissionAmount,
              promo_code:        promoCode,
              status:            "pending",
            });

            if (amb) {
              const newTotal = Number(amb.total_commission_earned || 0) + commissionAmount;
              await sb(`ambassadors?id=eq.${ambassadorId}`, "PATCH", { total_commission_earned: newTotal });
            }
          }
        } catch (e) {
          console.error("Webhook commission FAILED:", e.message);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook top-level error:", err.message);
    return res.status(500).json({ error: sanitizeError(err) });
  }
}

// Simplified customer email for webhook backup
function buildCustomerEmailSimple({ customerName, items, total, orderNumber }) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${item.name}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:right;">$${item.totalPrice}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td style="background:linear-gradient(135deg,#1a6ed8,#1557b0);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:8px;">AETERION LABS</div>
    <div style="font-size:28px;font-weight:900;color:#fff;margin-bottom:4px;">Order Confirmed</div>
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
        <td style="padding:14px 16px;font-size:15px;font-weight:800;color:#1a6ed8;text-align:right;">$${total}</td>
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

export const config = { api: { bodyParser: false } };
