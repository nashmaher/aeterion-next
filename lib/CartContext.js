// lib/CartContext.js
// Global cart state shared across all pages (store + product pages)
// Persists to localStorage so cart survives navigation

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aet_cart');
      if (saved) setCart(JSON.parse(saved));
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
      if (ex) return prev.map(i => i.key === key ? { ...i, qty: i.qty + qty, lt: i.lt + lt } : i);
      return [...prev, { key, id: p.id, name: p.name, img: p.img, size: v.s, qty, lt }];
    });
  }, []);

  const addCartAndOpen = useCallback((p, v, qty, lt) => {
    addCart(p, v, qty, lt);
    setCartOpen(true);
  }, [addCart]);

  const removeFromCart = useCallback((key) => {
    setCart(prev => prev.filter(i => i.key !== key));
  }, []);

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
      removeFromCart, clearCart,
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
