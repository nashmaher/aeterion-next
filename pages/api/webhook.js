import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const SB_URL = "https://kafwkhbzdtpsxkufmkmm.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZndraGJ6ZHRwc3hrdWZta21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDEyODAsImV4cCI6MjA4ODQ3NzI4MH0.sa4_CFHQpBkWVc02et_pSsu35wqPLQpD8g4WIxYRCIA";

function generateOrderNumber(sessionId) {
  const num = parseInt(sessionId.replace(/\D/g, "").slice(-5)) % 99999;
  const year = new Date().getFullYear();
  return `AET-${year}-${String(num).padStart(5, "0")}`;
}

async function saveOrderToSupabase(order) {
  console.log("Attempting Supabase insert for order:", order.order_number);
  const res = await fetch(`${SB_URL}/rest/v1/orders`, {
    method: "POST",
    headers: {
      "apikey": SB_ANON,
      "Authorization": `Bearer ${SB_ANON}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(order),
  });
  const responseText = await res.text();
  if (!res.ok) {
    console.error("Supabase insert FAILED. Status:", res.status, "Response:", responseText);
  } else {
    console.log("Supabase insert SUCCESS:", responseText);
  }
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
    throw new Error(`Resend error: ${err}`);
  }
}

function buildCustomerEmail({ customerName, items, total, orderId, orderNumber }) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${item.description}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;text-align:right;">$${(item.amount_total/100).toFixed(2)}</td>
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
      <div style="font-size:11px;color:#94a3b8;font-family:monospace;margin-top:4px;">${orderId}</div>
    </div>
    <div style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Order Summary</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 16px;font-size:11px;color:#64748b;text-align:left;">Product</th>
        <th style="padding:10px 16px;font-size:11px;color:#64748b;text-align:center;">Qty</th>
        <th style="padding:10px 16px;font-size:11px;color:#64748b;text-align:right;">Price</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot><tr style="background:#f8fafc;">
        <td colspan="2" style="padding:14px 16px;font-size:15px;font-weight:800;color:#1e293b;">Total</td>
        <td style="padding:14px 16px;font-size:15px;font-weight:800;color:#1a6ed8;text-align:right;">$${(total/100).toFixed(2)}</td>
      </tr></tfoot>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[["✅","Order Received","Your order has been confirmed and payment processed."],["🔬","Processing","Your order will be prepared within 1-2 business days."],["📦","Shipped","Estimated delivery within 1-2 weeks after dispatch."],["📋","COA Included","A Certificate of Analysis will be included with your shipment."]].map(([icon,title,desc])=>`
      <tr>
        <td width="44" style="vertical-align:top;padding-bottom:16px;"><div style="width:36px;height:36px;background:#eff6ff;border-radius:50%;text-align:center;line-height:36px;font-size:16px;">${icon}</div></td>
        <td style="padding-bottom:16px;padding-left:12px;vertical-align:top;"><div style="font-size:14px;font-weight:700;color:#1e293b;">${title}</div><div style="font-size:13px;color:#64748b;margin-top:2px;">${desc}</div></td>
      </tr>`).join("")}
    </table>
    <div style="background:#eff6ff;border-radius:10px;padding:18px 20px;border:1px solid #bfdbfe;">
      <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px;">Need help?</div>
      <div style="font-size:13px;color:#64748b;">Contact us at <a href="mailto:info@aeterionpeptides.com" style="color:#1a6ed8;font-weight:600;">info@aeterionpeptides.com</a>. We respond within 24 hours, Mon-Fri.</div>
    </div>
  </td></tr>
  <tr><td style="background:#1e293b;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
    <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">AETERION LABS</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.35);line-height:1.7;">All products are strictly for research purposes only. Not for human consumption.<br>
    <a href="https://aeterionpeptides.com" style="color:rgba(255,255,255,0.4);text-decoration:none;">aeterionpeptides.com</a></div>
  </td></tr>
</table></td></tr></table></body></html>`;
}

function buildAdminEmail({ customerName, customerEmail, customerPhone, shippingAddress, items, total, orderNumber, orderId }) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;">${item.description}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#1a6ed8;text-align:right;">$${(item.amount_total/100).toFixed(2)}</td>
    </tr>`).join("");
  const addr = shippingAddress;
  const addressStr = addr ? `${addr.line1}${addr.line2?", "+addr.line2:""}, ${addr.city}, ${addr.state} ${addr.postal_code}` : "N/A";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:30px 20px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td style="background:#0f172a;border-radius:12px 12px 0 0;padding:24px 32px;">
    <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">AETERION LABS — ADMIN</div>
    <div style="font-size:22px;font-weight:900;color:#fff;">🛍️ New Order Received</div>
    <div style="font-size:20px;font-weight:900;color:#60a5fa;margin-top:4px;">${orderNumber}</div>
  </td></tr>
  <tr><td style="background:#fff;padding:28px 32px;">
    <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Customer</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px;">
      ${[["👤 Name",customerName],["📧 Email",customerEmail],["📱 Phone",customerPhone||"N/A"],["📦 Ship To",addressStr]].map(([label,value])=>`
      <tr><td style="padding:10px 16px;font-size:12px;font-weight:700;color:#64748b;width:100px;border-bottom:1px solid #e2e8f0;">${label}</td>
      <td style="padding:10px 16px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${value}</td></tr>`).join("")}
    </table>
    <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Items Ordered</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <thead><tr style="background:#f8fafc;">
        <th style="padding:10px 14px;font-size:11px;color:#64748b;text-align:left;">Product</th>
        <th style="padding:10px 14px;font-size:11px;color:#64748b;text-align:center;">Qty</th>
        <th style="padding:10px 14px;font-size:11px;color:#64748b;text-align:right;">Price</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot><tr style="background:#f0fdf4;">
        <td colspan="2" style="padding:12px 14px;font-size:15px;font-weight:800;color:#1e293b;">Total</td>
        <td style="padding:12px 14px;font-size:15px;font-weight:800;color:#16a34a;text-align:right;">$${(total/100).toFixed(2)}</td>
      </tr></tfoot>
    </table>
    <a href="https://dashboard.stripe.com/payments" style="display:inline-block;background:#1a6ed8;color:#fff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-right:10px;">View in Stripe</a>
    <a href="mailto:${customerEmail}" style="display:inline-block;background:#f8fafc;color:#1e293b;font-size:13px;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;border:1px solid #e2e8f0;">Email Customer</a>
  </td></tr>
  <tr><td style="background:#1e293b;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.4);">Aeterion Labs Admin Notification · aeterionpeptides.com</div>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const event = req.body;
    if (!event || !event.type) return res.status(400).json({ error: "Invalid event" });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      const customerName    = session.customer_details?.name || "Valued Customer";
      const customerEmail   = session.customer_details?.email;
      const customerPhone   = session.customer_details?.phone;
      const shippingAddress = session.collected_information?.shipping_details?.address;
      const orderNumber     = generateOrderNumber(session.id);
      const userId          = session.metadata?.user_id || null;

      // Save to Supabase
      await saveOrderToSupabase({
        id:               session.id,
        order_number:     orderNumber,
        customer_name:    customerName,
        customer_email:   customerEmail,
        customer_phone:   customerPhone,
        shipping_address: shippingAddress,
        items:            lineItems.data.map(i => ({ description: i.description, quantity: i.quantity, amount_total: i.amount_total })),
        total:            session.amount_total,
        status:           "processing",
        user_id:          userId || undefined,
      });

      // Decrement inventory for each line item
      const expandedItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 100,
        expand: ["data.price.product"],
      });

      for (const item of expandedItems.data) {
        try {
          const productId = item.price?.product?.metadata?.product_id;
          if (!productId) {
            console.log("No product_id in metadata for:", item.description);
            continue;
          }

          // Fetch current stock
          const stockRes = await fetch(`${SB_URL}/rest/v1/products?id=eq.${productId}&select=id,stock`, {
            headers: { "apikey": SB_ANON, "Authorization": `Bearer ${SB_ANON}` }
          });
          const stockData = await stockRes.json();
          if (!stockData?.length) continue;

          const currentStock = stockData[0].stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);

          await fetch(`${SB_URL}/rest/v1/products?id=eq.${productId}`, {
            method: "PATCH",
            headers: {
              "apikey": SB_ANON,
              "Authorization": `Bearer ${SB_ANON}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({ stock: newStock }),
          });
          console.log(`Stock updated: product ${productId} ${currentStock} → ${newStock}`);
        } catch (e) {
          console.error("Stock update error:", e.message);
        }
      }

      // Customer email
      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: `Order Confirmed ${orderNumber} — Aeterion Labs`,
          html: buildCustomerEmail({ customerName, items: lineItems.data, total: session.amount_total, orderId: session.id, orderNumber }),
        });
      }

      // Admin notification
      await sendEmail({
        to: "info@aeterionpeptides.com",
        subject: `🛍️ New Order ${orderNumber} — $${(session.amount_total/100).toFixed(2)} from ${customerName}`,
        html: buildAdminEmail({ customerName, customerEmail, customerPhone, shippingAddress, items: lineItems.data, total: session.amount_total, orderNumber, orderId: session.id }),
      });

      // ── AMBASSADOR COMMISSION TRACKING ──
      const promoCode    = session.metadata?.promo_code;
      const ambassadorId = session.metadata?.ambassador_id;

      if (promoCode && ambassadorId) {
        try {
          const orderSubtotal    = (session.amount_subtotal || 0) / 100; // pre-discount total in dollars
          const discountAmount   = orderSubtotal * 0.10;                 // 10% customer discount
          const commissionAmount = orderSubtotal * 0.20;                 // 20% ambassador commission

          await fetch(`${SB_URL}/rest/v1/ambassador_commissions`, {
            method: "POST",
            headers: {
              "apikey": SB_ANON,
              "Authorization": `Bearer ${SB_ANON}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              ambassador_id:     ambassadorId,
              order_id:          session.payment_intent || session.id,
              stripe_session_id: session.id,
              customer_email:    customerEmail || "",
              order_subtotal:    orderSubtotal,
              discount_amount:   discountAmount,
              commission_amount: commissionAmount,
              promo_code:        promoCode,
              status:            "pending",
            }),
          });

          // Update ambassador's running total
          const ambRes  = await fetch(`${SB_URL}/rest/v1/ambassadors?id=eq.${ambassadorId}&select=total_commission_earned`, {
            headers: { "apikey": SB_ANON, "Authorization": `Bearer ${SB_ANON}` }
          });
          const ambData = await ambRes.json();
          if (ambData?.length) {
            const newTotal = Number(ambData[0].total_commission_earned) + commissionAmount;
            await fetch(`${SB_URL}/rest/v1/ambassadors?id=eq.${ambassadorId}`, {
              method: "PATCH",
              headers: {
                "apikey": SB_ANON,
                "Authorization": `Bearer ${SB_ANON}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
              },
              body: JSON.stringify({ total_commission_earned: newTotal }),
            });
          }

          console.log(`Commission logged: $${commissionAmount.toFixed(2)} for ambassador ${ambassadorId}`);
        } catch (commErr) {
          console.error("Commission tracking error:", commErr.message);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
