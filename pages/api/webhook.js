// pages/api/webhook.js
// UPDATED — logs ambassador commission when an order completes with a promo code
// NOTE: Keep all your existing webhook logic — this adds commission tracking after it

import Stripe from 'stripe';
import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // ── YOUR EXISTING ORDER LOGIC GOES HERE ──
    // (email confirmation, inventory update, order record, etc.)
    // Leave all that in place — just add the commission block below

    // ── AMBASSADOR COMMISSION TRACKING ──
    const promoCode = session.metadata?.promo_code;
    const ambassadorId = session.metadata?.ambassador_id;

    if (promoCode && ambassadorId) {
      try {
        // Get order total (amount_subtotal is before discounts, in cents)
        const orderSubtotal = (session.amount_subtotal || 0) / 100;
        const discountAmount = orderSubtotal * 0.10; // 10% off customer got
        const commissionAmount = orderSubtotal * 0.20; // 20% commission to ambassador

        // Log the commission
        const { error: commError } = await supabase.from('ambassador_commissions').insert({
          ambassador_id: ambassadorId,
          order_id: session.payment_intent || session.id,
          stripe_session_id: session.id,
          customer_email: session.customer_details?.email || '',
          order_subtotal: orderSubtotal,
          discount_amount: discountAmount,
          commission_amount: commissionAmount,
          promo_code: promoCode,
          status: 'pending',
        });

        if (commError) {
          console.error('Failed to log ambassador commission:', commError);
        } else {
          // Update ambassador's total_commission_earned
          const { data: amb } = await supabase
            .from('ambassadors')
            .select('total_commission_earned')
            .eq('id', ambassadorId)
            .single();

          if (amb) {
            await supabase
              .from('ambassadors')
              .update({
                total_commission_earned: Number(amb.total_commission_earned) + commissionAmount,
              })
              .eq('id', ambassadorId);
          }

          console.log(`Commission logged: $${commissionAmount.toFixed(2)} for ambassador ${ambassadorId}`);
        }
      } catch (err) {
        console.error('Commission tracking error:', err);
      }
    }
  }

  res.status(200).json({ received: true });
}
