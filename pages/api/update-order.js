export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const SB_URL = "https://kafwkhbzdtpsxkufmkmm.supabase.co";
  const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZndraGJ6ZHRwc3hrdWZta21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDEyODAsImV4cCI6MjA4ODQ3NzI4MH0.sa4_CFHQpBkWVc02et_pSsu35wqPLQpD8g4WIxYRCIA";

  try {
    const { orderId, status, tracking, notes } = req.body;
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    const updates = {};
    if (status)   updates.status   = status;
    if (tracking !== undefined) updates.tracking = tracking;
    if (notes !== undefined)    updates.notes    = notes;

    // Update Supabase
    const sbRes = await fetch(`${SB_URL}/rest/v1/orders?id=eq.${orderId}`, {
      method: "PATCH",
      headers: {
        "apikey": SB_ANON,
        "Authorization": `Bearer ${SB_ANON}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify(updates),
    });

    if (!sbRes.ok) {
      const err = await sbRes.text();
      return res.status(500).json({ error: "Supabase error: " + err });
    }

    const rows = await sbRes.json();
    const order = rows[0];

    // Send shipped email if status changed to shipped
    if (status === "shipped" && order?.customer_email) {
      await sendShippedEmail({
        to:           order.customer_email,
        customerName: order.customer_name,
        orderNumber:  order.order_number,
        tracking:     order.tracking,
        items:        order.items || [],
        total:        order.total,
      });
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("update-order error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};

async function sendShippedEmail({ to, customerName, orderNumber, tracking, items, total }) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${item.description}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;text-align:right;">$${(item.amount_total/100).toFixed(2)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
    <div style="font-size:40px;margin-bottom:12px;">📦</div>
    <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.7);text-transform:uppercase;margin-bottom:8px;">AETERION LABS</div>
    <div style="font-size:28px;font-weight:900;color:#fff;margin-bottom:4px;">Your Order Has Shipped!</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.85);">Great news, ${customerName} — your order is on its way.</div>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#fff;padding:36px 40px;">

    <!-- Order number -->
    <div style="background:#f8fafc;border-radius:10px;padding:16px 18px;margin-bottom:24px;border:1px solid #e2e8f0;">
      <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:4px;">ORDER NUMBER</div>
      <div style="font-size:20px;color:#1a6ed8;font-weight:900;letter-spacing:1px;">${orderNumber}</div>
    </div>

    ${tracking ? `
    <!-- Tracking -->
    <div style="background:#f0fdf4;border-radius:10px;padding:18px 20px;margin-bottom:24px;border:1px solid #bbf7d0;">
      <div style="font-size:12px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">📍 Tracking Number</div>
      <div style="font-size:20px;font-weight:900;color:#1e293b;font-family:monospace;">${tracking}</div>
      <div style="font-size:12px;color:#64748b;margin-top:6px;">Use this number to track your shipment with the carrier.</div>
    </div>` : `
    <!-- No tracking yet -->
    <div style="background:#f0fdf4;border-radius:10px;padding:18px 20px;margin-bottom:24px;border:1px solid #bbf7d0;">
      <div style="font-size:14px;color:#16a34a;font-weight:700;">Your order is on its way!</div>
      <div style="font-size:13px;color:#64748b;margin-top:4px;">A tracking number will be provided once available.</div>
    </div>`}

    <!-- Delivery estimate -->
    <div style="background:#eff6ff;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #bfdbfe;display:flex;align-items:center;gap:14px;">
      <div style="font-size:28px;">🗓️</div>
      <div>
        <div style="font-size:14px;font-weight:700;color:#1e293b;">Estimated Delivery</div>
        <div style="font-size:13px;color:#64748b;margin-top:2px;">1–2 weeks from shipment date</div>
      </div>
    </div>

    <!-- Order summary -->
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

    <!-- Support -->
    <div style="background:#f8fafc;border-radius:10px;padding:18px 20px;border:1px solid #e2e8f0;">
      <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px;">Questions about your shipment?</div>
      <div style="font-size:13px;color:#64748b;">Contact us at <a href="mailto:info@aeterionpeptides.com" style="color:#1a6ed8;font-weight:600;">info@aeterionpeptides.com</a>. We respond within 24 hours, Mon–Fri.</div>
    </div>

  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#1e293b;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
    <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">AETERION LABS</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.35);line-height:1.7;">
      All products are strictly for research purposes only. Not for human consumption.<br>
      <a href="https://aeterionpeptides.com" style="color:rgba(255,255,255,0.4);text-decoration:none;">aeterionpeptides.com</a>
    </div>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Aeterion Labs <info@notifications.aeterionpeptides.com>",
      to: [to],
      subject: `Your Order ${orderNumber} Has Shipped! 📦`,
      html,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    throw new Error(`Resend error: ${err}`);
  }
  console.log(`Shipped email sent to ${to}`);
}
