// pages/api/create-checkout-session.js
// UPDATED — supports ambassador promo codes (10% discount)

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, promoCode } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in cart.' });
  }

  // Validate promo code if provided
  let validatedPromo = null;
  let stripeCouponId = null;

  if (promoCode) {
    const { data: ambassador } = await supabase
      .from('ambassadors')
      .select('id, promo_code, commission_rate')
      .eq('promo_code', promoCode.toUpperCase().trim())
      .eq('status', 'approved')
      .single();

    if (ambassador) {
      validatedPromo = ambassador;

      // Find or create a Stripe coupon for this ambassador code
      const couponId = `AMB_${ambassador.promo_code}`;
      try {
        await stripe.coupons.retrieve(couponId);
        stripeCouponId = couponId;
      } catch {
        // Coupon doesn't exist yet — create it
        const coupon = await stripe.coupons.create({
          id: couponId,
          percent_off: 10,
          duration: 'forever',
          name: `Ambassador Code: ${ambassador.promo_code}`,
        });
        stripeCouponId = coupon.id;
      }
    }
  }

  // Build Stripe line items
  const lineItems = items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        description: item.variant || undefined,
      },
      unit_amount: Math.round(item.price * 100), // cents
    },
    quantity: item.quantity,
  }));

  // Build session params
  const sessionParams = {
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://aeterionpeptides.com'}/?order=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://aeterionpeptides.com'}/`,
    shipping_address_collection: { allowed_countries: ['US', 'CA'] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 1500, currency: 'usd' },
          display_name: 'Standard Shipping',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 7 },
          },
        },
      },
    ],
    metadata: {
      promo_code: validatedPromo?.promo_code || '',
      ambassador_id: validatedPromo?.id || '',
    },
  };

  // Apply discount if valid promo code
  if (stripeCouponId) {
    sessionParams.discounts = [{ coupon: stripeCouponId }];
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
