// pages/api/admin/profit-report.js
// Admin API for calculating true store profitability.
// POST { admin_token, date_from?, date_to? }
// Returns: store_summary, products[], orders[], ambassadors[], generated_at

import { verifyAdminToken } from './auth';
const { PRODUCTS } = require('../../../lib/products');

const SB_URL = 'https://kafwkhbzdtpsxkufmkmm.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function sb(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase GET ${path} [${res.status}]: ${text}`);
  return text ? JSON.parse(text) : [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { admin_token, date_from, date_to } = req.body || {};
  if (!admin_token || !verifyAdminToken(admin_token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // ── Step 1: Fetch data in parallel ──
    let ordersPath = 'orders?order=created_at.desc&select=*';
    if (date_from) ordersPath += `&created_at=gte.${date_from}`;
    if (date_to)   ordersPath += `&created_at=lte.${date_to}T23:59:59`;

    const [orders, commissions, productCosts, ambassadors] = await Promise.all([
      sb(ordersPath),
      sb('ambassador_commissions?select=*'),
      sb('product_costs?select=*&needs_review=eq.false&approved=eq.true'),
      sb('ambassadors?select=id,name,email,promo_code&status=eq.approved'),
    ]);

    // ── Step 2: Build cost lookup map ──
    // Key: "Product Name (variant_size)" → matches order item description exactly
    // Also build secondary map by product_id+variant for future orders that store product_id
    const costByDescription = {};
    const costByIdVariant = {};

    for (const cost of productCosts) {
      const product = PRODUCTS.find(p => p.id === cost.product_id);
      if (!product) continue;
      const descKey = `${product.name} (${cost.variant_size})`;
      costByDescription[descKey] = parseFloat(cost.cost_per_unit);
      const idKey = `${cost.product_id}::${cost.variant_size}`;
      costByIdVariant[idKey] = parseFloat(cost.cost_per_unit);
    }

    // ── Step 3: Build commission lookup by stripe_session_id ──
    const commissionsBySession = {};
    for (const c of commissions) {
      if (c.stripe_session_id) {
        commissionsBySession[c.stripe_session_id] = c;
      }
      // Also index by order_id in case session_id differs
      if (c.order_id && !commissionsBySession[c.order_id]) {
        commissionsBySession[c.order_id] = c;
      }
    }

    // ── Step 4: Build ambassador lookup ──
    const ambassadorById = {};
    for (const a of ambassadors) {
      ambassadorById[a.id] = a;
    }

    // ── Step 5: Per-order profit calculation ──
    const orderResults = [];
    const missingSkus = new Set();
    const productRollup = {}; // key: description

    // Ambassador rollup
    const ambassadorRollup = {};

    for (const order of orders) {
      const items = order.items || [];
      const revenueUSD = order.total / 100;
      const productRevenueUSD = items.reduce((s, i) => s + i.amount_total, 0) / 100;
      const shippingRevenueUSD = revenueUSD - productRevenueUSD;

      // Skip refunded orders from profit totals but include in order list
      const isRefunded = order.status === 'refunded' || order.status === 'cancelled';

      // Commission for this order
      const commissionRecord = commissionsBySession[order.id];
      const commissionUSD = commissionRecord ? parseFloat(commissionRecord.commission_amount) : 0;

      // Per-item cost calculation
      let cogs = 0;
      let cogsComplete = true;
      const itemsWithProfit = items.map(item => {
        // Try description-based match first (works for all historical orders)
        let costPerUnit = costByDescription[item.description] ?? null;

        // Fallback: try product_id + variant from stored metadata (future orders)
        if (costPerUnit === null && item.product_id) {
          // Extract variant size from description: "Product Name (size)" → "size"
          const match = item.description?.match(/\(([^)]+)\)$/);
          if (match) {
            const idKey = `${item.product_id}::${match[1]}`;
            costPerUnit = costByIdVariant[idKey] ?? null;
          }
        }

        if (costPerUnit === null) {
          missingSkus.add(item.description || 'Unknown item');
          cogsComplete = false;
          return {
            description: item.description,
            quantity: item.quantity,
            amount_total: item.amount_total,
            revenue_usd: item.amount_total / 100,
            cost_per_unit: null,
            item_cogs: null,
            item_profit: null,
          };
        }

        const itemRevUSD = item.amount_total / 100;
        const itemCogs = costPerUnit * item.quantity;
        cogs += itemCogs;

        // Product-level rollup (only for non-refunded orders)
        if (!isRefunded) {
          if (!productRollup[item.description]) {
            productRollup[item.description] = {
              description: item.description,
              units_sold: 0,
              revenue_usd: 0,
              cogs_usd: 0,
              cost_per_unit: costPerUnit,
            };
          }
          productRollup[item.description].units_sold += item.quantity;
          productRollup[item.description].revenue_usd += itemRevUSD;
          productRollup[item.description].cogs_usd += itemCogs;
        }

        return {
          description: item.description,
          quantity: item.quantity,
          amount_total: item.amount_total,
          revenue_usd: itemRevUSD,
          cost_per_unit: costPerUnit,
          item_cogs: itemCogs,
          item_profit: itemRevUSD - itemCogs,
        };
      });

      const grossProfit = !isRefunded && cogsComplete ? productRevenueUSD - cogs : null;
      const netProfit   = !isRefunded && cogsComplete ? productRevenueUSD - cogs - commissionUSD : null;
      const marginPct   = (netProfit !== null && productRevenueUSD > 0) ? (netProfit / productRevenueUSD) * 100 : null;

      // Ambassador rollup
      if (commissionRecord && !isRefunded) {
        const ambId = commissionRecord.ambassador_id;
        if (!ambassadorRollup[ambId]) {
          const amb = ambassadorById[ambId];
          ambassadorRollup[ambId] = {
            ambassador_id: ambId,
            name: amb?.name || `Ambassador #${ambId}`,
            email: amb?.email || '',
            promo_code: commissionRecord.promo_code,
            orders: 0,
            total_order_value: 0,
            total_commission: 0,
          };
        }
        ambassadorRollup[ambId].orders += 1;
        ambassadorRollup[ambId].total_order_value += productRevenueUSD;
        ambassadorRollup[ambId].total_commission += commissionUSD;
      }

      orderResults.push({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        status: order.status,
        created_at: order.created_at,
        promo_code: order.promo_code,
        ambassador_id: order.ambassador_id,
        revenue_usd: revenueUSD,
        product_revenue_usd: productRevenueUSD,
        shipping_revenue_usd: shippingRevenueUSD,
        cogs_usd: cogsComplete && !isRefunded ? cogs : null,
        commission_usd: commissionUSD,
        gross_profit_usd: grossProfit,
        net_profit_usd: netProfit,
        margin_pct: marginPct,
        cogs_complete: cogsComplete,
        is_refunded: isRefunded,
        items: itemsWithProfit,
      });
    }

    // ── Step 6: Store summary (exclude refunded) ──
    const activeOrders = orderResults.filter(o => !o.is_refunded);
    const ordersWithFullCosts = activeOrders.filter(o => o.cogs_complete);

    const totalRevenue = activeOrders.reduce((s, o) => s + o.revenue_usd, 0);
    const totalProductRevenue = activeOrders.reduce((s, o) => s + o.product_revenue_usd, 0);
    const totalShipping = activeOrders.reduce((s, o) => s + o.shipping_revenue_usd, 0);
    const totalCogs = ordersWithFullCosts.reduce((s, o) => s + (o.cogs_usd || 0), 0);
    const totalCommissions = activeOrders.reduce((s, o) => s + o.commission_usd, 0);
    const grossProfit = ordersWithFullCosts.reduce((s, o) => s + (o.gross_profit_usd || 0), 0);
    const netProfit = ordersWithFullCosts.reduce((s, o) => s + (o.net_profit_usd || 0), 0);
    const netMargin = totalProductRevenue > 0 ? (netProfit / totalProductRevenue) * 100 : 0;

    const storeSummary = {
      total_orders: orders.length,
      active_orders: activeOrders.length,
      refunded_orders: orders.length - activeOrders.length,
      orders_with_full_costs: ordersWithFullCosts.length,
      total_revenue_usd: totalRevenue,
      total_product_revenue_usd: totalProductRevenue,
      total_shipping_revenue_usd: totalShipping,
      total_cogs_usd: totalCogs,
      total_commissions_usd: totalCommissions,
      gross_profit_usd: grossProfit,
      net_profit_usd: netProfit,
      net_margin_pct: netMargin,
      missing_cost_skus: Array.from(missingSkus).sort(),
      costs_coverage_note: ordersWithFullCosts.length < activeOrders.length
        ? `${activeOrders.length - ordersWithFullCosts.length} orders excluded from profit totals due to missing cost data`
        : null,
    };

    // ── Step 7: Product rollup sorted by revenue ──
    const productResults = Object.values(productRollup)
      .map(p => ({
        ...p,
        gross_profit_usd: p.revenue_usd - p.cogs_usd,
        margin_pct: p.revenue_usd > 0 ? ((p.revenue_usd - p.cogs_usd) / p.revenue_usd) * 100 : 0,
      }))
      .sort((a, b) => b.revenue_usd - a.revenue_usd);

    // ── Step 8: Ambassador rollup sorted by commission ──
    const ambassadorResults = Object.values(ambassadorRollup)
      .map(a => ({
        ...a,
        commission_rate_pct: a.total_order_value > 0
          ? (a.total_commission / a.total_order_value) * 100
          : 0,
      }))
      .sort((a, b) => b.total_commission - a.total_commission);

    return res.status(200).json({
      store_summary: storeSummary,
      products: productResults,
      orders: orderResults,
      ambassadors: ambassadorResults,
      generated_at: new Date().toISOString(),
    });

  } catch (e) {
    console.error('profit-report error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
