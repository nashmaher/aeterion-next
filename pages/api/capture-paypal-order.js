import { getSupabaseConfig, setCorsHeaders, sanitizeError } from "../../lib/security";

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

function buildCustomerEmail({ customerName, items, total, orderNumber }) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${item.name}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;text-align:right;">$${item.totalPrice}</td>
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

function buildAdminEmail({ customerName, customerEmail, customerPhone, shippingAddress, items, total, orderNumber, promoCode, commissionAmount }) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${item.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#1a6ed8;text-align:right;">$${item.totalPrice}</td>
    </tr>`).join("");
  const addr = shippingAddress;
  const addressStr = addr ? `${addr.address_line_1 || ""}${addr.address_line_2 ? ", " + addr.address_line_2 : ""}, ${addr.admin_area_2 || ""}, ${addr.admin_area_1 || ""} ${addr.postal_code || ""}` : "N/A";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:30px 20px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td style="background:#0f172a;border-radius:12px 12px 0 0;padding:24px 32px;">
    <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">AETERION LABS — ADMIN</div>
    <div style="font-size:22px;font-weight:900;color:#fff;">New Order — ${orderNumber}</div>
    <div style="font-size:20px;font-weight:900;color:#60a5fa;">$${total}</div>
    ${promoCode ? `<div style="font-size:12px;color:#fbbf24;margin-top:6px;">Promo: ${promoCode}${commissionAmount ? ` · Commission owed: $${commissionAmount.toFixed(2)}` : ""}</div>` : ""}
  </td></tr>
  <tr><td style="background:#fff;padding:28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
      ${[["Name", customerName], ["Email", customerEmail], ["Phone", customerPhone || "N/A"], ["Ship To", addressStr]].map(([label, value]) => `
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
        <td style="padding:12px 14px;font-size:15px;font-weight:800;color:#16a34a;text-align:right;">$${total}</td>
      </tr></tfoot>
    </table>
    <a href="https://www.paypal.com/merchant/" style="display:inline-block;background:#1a6ed8;color:#fff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-right:10px;">View in PayPal</a>
    <a href="mailto:${customerEmail}" style="display:inline-block;background:#f8fafc;color:#1e293b;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;border:1px solid #e2e8f0;">Email Customer</a>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function buildAmbassadorEmail({ ambassadorName, commissionAmount, commissionRatePct, orderTotal, promoCode, orderNumber }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
  <tr><td style="background:linear-gradient(135deg,#1a6ed8,#1557b0);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:8px;">AETERION LABS</div>
    <div style="font-size:26px;font-weight:900;color:#fff;">You Earned a Commission!</div>
  </td></tr>
  <tr><td style="background:#fff;padding:36px 40px;">
    <p style="font-size:15px;color:#1e293b;margin:0 0 24px;">Hey ${ambassadorName || "Ambassador"}, someone just placed an order using your code <strong>${promoCode}</strong>!</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:24px;border:1px solid #bbf7d0;text-align:center;margin-bottom:24px;">
      <div style="font-size:12px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Your Commission</div>
      <div style="font-size:42px;font-weight:900;color:#16a34a;">$${commissionAmount.toFixed(2)}</div>
      <div style="font-size:13px;color:#64748b;margin-top:6px;">Order total: $${orderTotal} · Commission rate: ${commissionRatePct ?? 20}%</div>
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
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { orderID } = req.body;
  if (!orderID) return res.status(400).json({ error: "Missing PayPal order ID" });

  try {
    // ── 1. Capture the PayPal order ──
    const accessToken = await getPayPalAccessToken();

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      const errText = await captureRes.text();
      console.error("PayPal capture failed:", errText);
      return res.status(400).json({ error: "Payment capture failed" });
    }

    const captureData = await captureRes.json();
    log("=== PAYPAL CAPTURE ===", JSON.stringify(captureData, null, 2));

    if (captureData.status !== "COMPLETED") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // ── 2. Extract order details ──
    const payer = captureData.payer || {};
    const purchaseUnit = captureData.purchase_units?.[0] || {};
    const capture = purchaseUnit.payments?.captures?.[0] || {};
    const shipping = purchaseUnit.shipping || {};

    const customerName = shipping.name?.full_name || `${payer.name?.given_name || ""} ${payer.name?.surname || ""}`.trim() || "Valued Customer";
    const customerEmail = payer.email_address || "";
    const customerPhone = payer.phone?.phone_number?.national_number || "";
    const shippingAddress = shipping.address || null;

    const orderNumber = generateOrderNumber(orderID);

    // Parse metadata from custom_id
    let metadata = {};
    try {
      metadata = JSON.parse(purchaseUnit.custom_id || "{}");
    } catch { /* ignore parse errors */ }

    const promoCode = metadata.pc || null;
    const ambassadorId = metadata.aid || null;
    const userId = metadata.uid || null;

    // Build items list from purchase unit
    const orderItems = (purchaseUnit.items || []).map(item => ({
      name: item.name,
      quantity: parseInt(item.quantity) || 1,
      totalPrice: ((parseFloat(item.unit_amount?.value || 0) * (parseInt(item.quantity) || 1))).toFixed(2),
      amount_total: Math.round(parseFloat(item.unit_amount?.value || 0) * (parseInt(item.quantity) || 1) * 100),
    }));

    const totalCents = Math.round(parseFloat(capture.amount?.value || 0) * 100);
    const totalFormatted = (totalCents / 100).toFixed(2);

    // ── 3. Save order to Supabase (idempotent) ──
    try {
      const existingOrder = await sb(`orders?id=eq.${orderID}&select=id`).catch(() => []);
      if (existingOrder?.length) {
        log(`Order ${orderID} already exists — skipping insert`);
      } else {
        // Normalize shipping address to match existing schema
        const normalizedAddress = shippingAddress ? {
          line1: shippingAddress.address_line_1 || "",
          line2: shippingAddress.address_line_2 || "",
          city: shippingAddress.admin_area_2 || "",
          state: shippingAddress.admin_area_1 || "",
          postal_code: shippingAddress.postal_code || "",
        } : null;

        await sb("orders", "POST", {
          id:               orderID,
          order_number:     orderNumber,
          customer_name:    customerName,
          customer_email:   customerEmail,
          customer_phone:   customerPhone,
          shipping_address: normalizedAddress,
          items:            orderItems.map(i => ({
            description:  i.name,
            quantity:     i.quantity,
            amount_total: i.amount_total,
          })),
          total:            totalCents,
          status:           "processing",
          user_id:          userId || null,
          promo_code:       promoCode || null,
          ambassador_id:    ambassadorId ? String(ambassadorId) : null,
        });
        log("Order saved to Supabase:", orderNumber);
      }
    } catch (e) {
      console.error("Supabase order save FAILED:", e.message);
    }

    // ── 4. Customer email ──
    if (customerEmail) {
      try {
        await sendEmail({
          to: customerEmail,
          subject: `Order Confirmed ${orderNumber} — Aeterion Labs`,
          html: buildCustomerEmail({ customerName, items: orderItems, total: totalFormatted, orderNumber }),
        });
        log("Customer email sent to:", customerEmail);
      } catch (e) {
        console.error("Customer email FAILED:", e.message);
      }
    }

    // ── 5. Admin email ──
    try {
      await sendEmail({
        to: "info@aeterionpeptides.com",
        subject: `New Order ${orderNumber} — $${totalFormatted} from ${customerName}`,
        html: buildAdminEmail({ customerName, customerEmail, customerPhone, shippingAddress, items: orderItems, total: totalFormatted, orderNumber, promoCode, commissionAmount: null }),
      });
      log("Admin email sent");
    } catch (e) {
      console.error("Admin email FAILED:", e.message);
    }

    // ── 6. Ambassador commission ──
    if (promoCode && ambassadorId) {
      try {
        // Idempotent: check if commission already recorded
        const existing = await sb(`ambassador_commissions?stripe_session_id=eq.${orderID}&select=id`);
        if (existing?.length) {
          log(`Commission already recorded for order ${orderID} — skipping`);
        } else {
          const ambData = await sb(`ambassadors?id=eq.${ambassadorId}&select=id,name,email,commission_rate,total_commission_earned`);
          const amb = ambData?.[0];

          const commissionRatePct = Number(amb?.commission_rate ?? 20);
          const customerDiscountPct = 10;

          // Commission based on product subtotal (sum of item totals, no shipping)
          const productSubtotal = orderItems.reduce((sum, i) => sum + i.amount_total, 0) / 100;
          const commissionAmount = productSubtotal * (commissionRatePct / 100);

          await sb("ambassador_commissions", "POST", {
            ambassador_id:     ambassadorId,
            order_id:          orderID,
            stripe_session_id: orderID, // Keeping column name for DB compatibility
            customer_email:    customerEmail || "",
            order_subtotal:    productSubtotal,
            discount_amount:   productSubtotal * (customerDiscountPct / 100),
            commission_amount: commissionAmount,
            promo_code:        promoCode,
            status:            "pending",
          });
          log(`Commission logged: $${commissionAmount.toFixed(2)} (${commissionRatePct}%)`);

          // Update ambassador running total
          if (amb) {
            const newTotal = Number(amb.total_commission_earned || 0) + commissionAmount;
            await sb(`ambassadors?id=eq.${ambassadorId}`, "PATCH", { total_commission_earned: newTotal });
            log(`Ambassador total updated to $${newTotal.toFixed(2)}`);

            if (amb.email) {
              try {
                await sendEmail({
                  to: amb.email,
                  subject: `You earned $${commissionAmount.toFixed(2)} — Aeterion Commission`,
                  html: buildAmbassadorEmail({
                    ambassadorName:   amb.name,
                    commissionAmount,
                    commissionRatePct,
                    orderTotal:       totalFormatted,
                    promoCode,
                    orderNumber,
                  }),
                });
                log("Ambassador email sent to:", amb.email);
              } catch (e) {
                console.error("Ambassador email FAILED:", e.message);
              }
            }
          }
        }
      } catch (e) {
        console.error("Commission insert FAILED:", e.message);
      }
    }

    return res.status(200).json({ success: true, orderNumber });

  } catch (err) {
    console.error("Capture error:", err.message);
    return res.status(500).json({ error: sanitizeError(err) });
  }
}
