// lib/CartContext.js
// Global cart state shared across all pages (store + product pages)
// Persists to localStorage so cart survives navigation

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export const MAX_QTY = 99;
const DISC_RATE = qty => qty >= 10 ? 0.82 : qty >= 5 ? 0.92 : 1;

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage on mount (with unitPrice backward compat)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aet_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated = parsed.map(item => {
          if (item.unitPrice != null) return item;
          const rate = DISC_RATE(item.qty);
          return { ...item, unitPrice: +(item.lt / item.qty / rate).toFixed(4) };
        });
        setCart(migrated);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('aet_cart', JSON.stringify(cart));
    } catch {}
  }, [cart, hydrated]);

  const addCart = useCallback((p, v, qty, lt) => {
    const key = `${p.id}-${v.s}`;
    setCart(prev => {
      const ex = prev.find(i => i.key === key);
      if (ex) {
        return prev.map(i => {
          if (i.key !== key) return i;
          const merged = Math.min(i.qty + qty, MAX_QTY);
          const rate = DISC_RATE(merged);
          return { ...i, qty: merged, lt: +(i.unitPrice * merged * rate).toFixed(2) };
        });
      }
      const capped = Math.min(qty, MAX_QTY);
      const rate = DISC_RATE(capped);
      return [...prev, { key, id: p.id, name: p.name, img: p.img, size: v.s, qty: capped, lt: +(v.p * capped * rate).toFixed(2), unitPrice: v.p }];
    });
  }, []);

  const addCartAndOpen = useCallback((p, v, qty, lt) => {
    addCart(p, v, qty, lt);
    setCartOpen(true);
  }, [addCart]);

  const removeFromCart = useCallback((key) => {
    setCart(prev => prev.filter(i => i.key !== key));
  }, []);

  const updateItemQty = useCallback((key, newQty) => {
    if (newQty <= 0) { removeFromCart(key); return; }
    if (newQty > MAX_QTY) return;
    setCart(prev => prev.map(item => {
      if (item.key !== key) return item;
      const rate = DISC_RATE(newQty);
      return { ...item, qty: newQty, lt: +(item.unitPrice * newQty * rate).toFixed(2) };
    }));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    try { localStorage.removeItem('aet_cart'); } catch {}
  }, []);

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.lt, 0);

  return (
    <CartContext.Provider value={{
      cart, setCart,
      cartOpen, setCartOpen,
      addCart, addCartAndOpen,
      removeFromCart, updateItemQty, clearCart,
      count, total,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
