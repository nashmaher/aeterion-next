// components/CartDrawer.js
// Shared cart drawer used by store page and product pages

import { useCart, MAX_QTY } from '../lib/CartContext';
import { T, fmt, btnPrimary } from '../lib/theme';

export default function CartDrawer({
  mob = false,
  // Promo code (optional — only store page passes these)
  promoInput, setPromoInput,
  promoCode, promoDiscount, promoStatus,
  onPromoApply, onPromoRemove,
  // Checkout
  onCheckout,
  // Messages (optional)
  stripeMsg,
  paymentMsg,
}) {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateItemQty, count, total } = useCart();

  const hasPromo = typeof onPromoApply === 'function';

  const qtyBtnStyle = {
    width: 26, height: 26, borderRadius: "50%",
    border: `1.5px solid ${T.border}`, background: "transparent",
    color: T.text, fontWeight: 700, fontSize: 14,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background .15s, border-color .15s", lineHeight: 1, padding: 0,
  };

  const qtyBtnHoverIn = e => { e.currentTarget.style.background = T.blueSoft; e.currentTarget.style.borderColor = T.blue; };
  const qtyBtnHoverOut = e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.border; };

  // Order summary calculations
  const baseTotal = cart.reduce((s, i) => {
    const discRate = i.qty >= 10 ? 0.82 : i.qty >= 5 ? 0.92 : 1;
    return s + (i.lt / discRate);
  }, 0);
  const bulkSavings = baseTotal - total;
  const promoSavings = (promoDiscount || 0) > 0 ? total * (promoDiscount / 100) : 0;
  const finalTotal = total - promoSavings;

  return (
    <>
      {cartOpen && <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 500 }} />}
      <div style={{ position: "fixed", top: 0, right: cartOpen ? 0 : (mob ? "-100%" : -420), width: mob ? "100%" : 420, height: "100%", background: "#fff", zIndex: 510, display: "flex", flexDirection: "column", boxShadow: "-8px 0 48px rgba(0,0,0,0.18), -1px 0 0 rgba(0,0,0,0.06)", transition: "right .3s ease", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {/* Header */}
        <div style={{ padding: "20px 22px", borderBottom: "1px solid #e8ecf0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111827", letterSpacing: "-0.3px" }}>Your Cart {count > 0 && <span style={{ color: T.blue }}>({count})</span>}</div>
          <button onClick={() => setCartOpen(false)} aria-label="Close cart" style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 16, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>
        </div>

        {cart.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.muted, gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff5ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 13, fontWeight: 800, color: "#1a6ed8" }}>CART</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Your cart is empty</div>
            <button onClick={() => setCartOpen(false)} style={{ ...btnPrimary({ padding: "10px 22px", fontSize: 13 }), marginTop: 4 }}>Browse Products</button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
              {cart.map(item => {
                const atMax = item.qty >= MAX_QTY;
                return (
                  <div key={item.key} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                    <img src={item.img} alt={item.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: `1px solid ${T.border}`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>{item.size}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <button onClick={() => updateItemQty(item.key, item.qty - 1)} aria-label="Decrease quantity" style={qtyBtnStyle} onMouseEnter={qtyBtnHoverIn} onMouseLeave={qtyBtnHoverOut}>−</button>
                        <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700, fontSize: 13, color: T.text, userSelect: "none" }}>{item.qty}</span>
                        <button onClick={() => !atMax && updateItemQty(item.key, item.qty + 1)} aria-label="Increase quantity" style={{ ...qtyBtnStyle, ...(atMax ? { opacity: 0.4, cursor: "not-allowed" } : {}) }} onMouseEnter={!atMax ? qtyBtnHoverIn : undefined} onMouseLeave={!atMax ? qtyBtnHoverOut : undefined}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{fmt(item.lt)}</div>
                      <button onClick={() => removeFromCart(item.key)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 11, fontWeight: 600, padding: "2px 0" }}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 18px 20px", borderTop: `1px solid ${T.border}` }}>
              <div style={{ background: T.greenSoft, border: "1px solid #bbf7d0", borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#15803d", fontWeight: 600 }}>Bulk savings applied automatically</div>

              {/* Promo Code Input (only when promo handlers provided) */}
              {hasPromo && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={promoInput || ""}
                      onChange={e => { if (setPromoInput) setPromoInput(e.target.value.toUpperCase()); }}
                      placeholder="Promo code"
                      aria-label="Promo code"
                      maxLength={20}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${promoStatus === "valid" ? "#16a34a" : promoStatus === "invalid" ? "#dc2626" : T.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: T.white, color: T.text }}
                    />
                    <button
                      onClick={() => { promoStatus === "valid" ? onPromoRemove() : onPromoApply(); }}
                      style={{ padding: "9px 14px", borderRadius: 9, border: "none", background: promoStatus === "valid" ? "#dc2626" : T.blue, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                    >
                      {promoStatus === "checking" ? "…" : promoStatus === "valid" ? "Remove" : "Apply"}
                    </button>
                  </div>
                  {promoStatus === "valid" && <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600, marginTop: 5 }}>✓ {promoCode} applied — {promoDiscount}% off at checkout!</div>}
                  {promoStatus === "invalid" && <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, marginTop: 5 }}>✗ Invalid promo code.</div>}
                </div>
              )}

              {/* Order Summary Breakdown */}
              <div style={{ background: T.bg, borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: T.sub, marginBottom: 6 }}>
                  <span>Subtotal</span><span>{fmt(baseTotal)}</span>
                </div>
                {bulkSavings > 0.01 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d", fontWeight: 600, marginBottom: 6 }}>
                    <span>Bulk Discount</span><span>−{fmt(bulkSavings)}</span>
                  </div>
                )}
                {promoSavings > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d", fontWeight: 600, marginBottom: 6 }}>
                    <span>🎟 {promoCode} ({promoDiscount}% off)</span><span>−{fmt(promoSavings)}</span>
                  </div>
                )}
                <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15, color: T.text }}>
                  <span>Total</span><span>{fmt(finalTotal)}</span>
                </div>
                {total >= 250 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "#15803d", fontWeight: 600 }}>Free shipping applied</div>
                )}
              </div>

              {/* Messages */}
              {stripeMsg && <div style={{ fontSize: 11, color: T.sub, marginBottom: 10, background: "#fffbeb", borderRadius: 8, padding: "8px 10px", border: "1px solid #fde68a" }}>{stripeMsg}</div>}
              {paymentMsg === "cancelled" && (
                <div style={{ marginBottom: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#854d0e" }}>
                  Checkout was cancelled — your cart is still saved.
                </div>
              )}

              <button onClick={onCheckout} style={{ ...btnPrimary({ width: "100%", padding: "14px", fontSize: 14, borderRadius: 12, boxShadow: "0 4px 14px rgba(26,110,216,0.28)" }) }}>Checkout</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
