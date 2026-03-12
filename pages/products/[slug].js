// pages/products/[slug].js
// Individual SEO product pages for all 72 Aeterion compounds
// - Static generation at build time (getStaticPaths + getStaticProps)
// - Real Add to Cart via shared CartContext (persists across pages)
// - Full research data, specs table, related products
// - Mobile responsive
// - Schema.org Product markup for Google rich results

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { PRODUCTS_WITH_SLUGS, CATS } from '../../lib/products';
import { useCart } from '../../lib/CartContext';

const CAT_MAP = Object.fromEntries(CATS.map(c => [c.id, c]));
const DISC = { 1: 1, 5: 0.92, 10: 0.82 };

function calcPrice(unitPrice, qty) {
  const rate = qty >= 10 ? DISC[10] : qty >= 5 ? DISC[5] : DISC[1];
  return +(unitPrice * qty * rate).toFixed(2);
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, total, count } = useCart();

  const discount = total >= 150 ? 0 : total >= 75 ? total * 0.05 : 0;
  const finalTotal = +(total - discount).toFixed(2);

  async function checkout() {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({
            key: i.key, name: `${i.name} (${i.size})`,
            price: i.lt / i.qty, qty: i.qty,
          })),
          total: finalTotal,
        }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { alert('Checkout error — please try again.'); }
  }

  return (
    <>
      {cartOpen && (
        <div onClick={() => setCartOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500 }} />
      )}
      <div style={{
        position: 'fixed', top: 0, right: cartOpen ? 0 : -440,
        width: 420, maxWidth: '100vw', height: '100%',
        background: '#fff', zIndex: 510,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.18)',
        transition: 'right .3s ease',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ecf0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#111827' }}>
            Your Cart {count > 0 && <span style={{ color: '#1a6ed8' }}>({count})</span>}
          </div>
          <button onClick={() => setCartOpen(false)}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Your cart is empty</div>
            </div>
          ) : cart.map(item => (
            <div key={item.key} style={{ display: 'flex', gap: 14, marginBottom: 14, padding: 14, background: '#f8fafc', borderRadius: 12 }}>
              <img src={item.img} alt={item.name} style={{ width: 56, height: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{item.size} × {item.qty}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#16a34a' }}>${item.lt.toFixed(2)}</div>
              </div>
              <button onClick={() => removeFromCart(item.key)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer', alignSelf: 'flex-start', lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid #e8ecf0' }}>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', fontWeight: 700, marginBottom: 8 }}>
                <span>Bulk discount</span><span>−${discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
              <span>Total</span><span style={{ color: '#1a6ed8' }}>${finalTotal.toFixed(2)}</span>
            </div>
            <button onClick={checkout}
              style={{ width: '100%', background: 'linear-gradient(135deg,#1a6ed8,#2563eb)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 15, padding: 16, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Product Page ─────────────────────────────────────────────────────────────
export default function ProductPage({ product }) {
  const router = useRouter();
  const { addCartAndOpen, count, setCartOpen } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const cat = CAT_MAP[product.cat] || { label: product.cat, icon: '⚗️' };
  const variant = product.variants[selectedVariant];
  const lineTotal = calcPrice(variant.p, qty);
  const metaTitle = `${product.name} — Aeterion Labs Research Peptides`;
  const metaDesc = product.desc.slice(0, 155) + (product.desc.length > 155 ? '…' : '');

  function handleAddToCart() {
    addCartAndOpen(
      { id: product.id, name: product.name, img: product.img },
      variant, qty, lineTotal
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={product.img} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://www.aeterionpeptides.com/products/${product.slug}`} />
        <link rel="canonical" href={`https://www.aeterionpeptides.com/products/${product.slug}`} />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.desc,
          image: product.img,
          brand: { '@type': 'Brand', name: 'Aeterion Labs' },
          category: cat.label,
          offers: product.variants.map(v => ({
            '@type': 'Offer',
            price: v.p,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: `https://www.aeterionpeptides.com/products/${product.slug}`,
          })),
        })}} />
      </Head>

      <CartDrawer />

      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#020817', minHeight: '100vh', color: '#f8fafc' }}>

        {/* Sticky Nav */}
        <nav style={{ borderBottom: '1px solid #1e293b', padding: '0 24px', position: 'sticky', top: 0, background: 'rgba(2,8,23,0.96)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div onClick={() => router.push('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#1a6ed8,#60a5fa)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚗️</div>
              <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.3px' }}>Aeterion Labs</span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => router.push('/')}
                style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← All Products
              </button>
              <button onClick={() => setCartOpen(true)}
                style={{ position: 'relative', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
                🛒
                {count > 0 && (
                  <span style={{ background: '#1a6ed8', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{count}</span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Breadcrumb */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px' }}>
          <div style={{ fontSize: 12, color: '#475569', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span onClick={() => router.push('/')} style={{ cursor: 'pointer', color: '#60a5fa' }}>Store</span>
            <span>›</span>
            <span onClick={() => router.push(`/?cat=${product.cat}`)} style={{ cursor: 'pointer', color: '#60a5fa' }}>{cat.label}</span>
            <span>›</span>
            <span>{product.name}</span>
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px 64px' }}>
          <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }}>

            {/* Left — image */}
            <div>
              <div style={{ background: 'linear-gradient(135deg,#0f1f3d,#1e3a5f)', borderRadius: 20, overflow: 'hidden', aspectRatio: '4/5', position: 'relative' }}>
                <img src={product.img} alt={`${product.name} research peptide`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {product.badge && (
                  <div style={{ position: 'absolute', top: 16, left: 16, background: product.badge === 'Best Seller' ? '#f59e0b' : '#1a6ed8', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {product.badge}
                  </div>
                )}
                {product.isNew && (
                  <div style={{ position: 'absolute', top: product.badge ? 52 : 16, left: 16, background: '#8b5cf6', color: '#fff', fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1 }}>
                    New
                  </div>
                )}
              </div>

              {/* Form / purity badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
                {[
                  [product.form === 'injectable' ? '💉' : product.form === 'capsule' ? '💊' : '🧴', product.form],
                  ['🔬', 'Research Grade'],
                  ['✅', '≥99% Purity'],
                ].map(([icon, label]) => (
                  <div key={label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — details */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1a6ed8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                {cat.icon} {cat.label}
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.8px', lineHeight: 1.1 }}>{product.name}</h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 22 }}>
                {product.highlights.map((h, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, padding: '4px 12px' }}>{h}</span>
                ))}
              </div>

              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.8, margin: '0 0 28px' }}>{product.desc}</p>

              {/* Size selector */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Select Size</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {product.variants.map((v, i) => (
                    <button key={i} onClick={() => { setSelectedVariant(i); setQty(1); }}
                      style={{ padding: '10px 18px', borderRadius: 10, border: `2px solid ${selectedVariant === i ? '#1a6ed8' : '#1e293b'}`, background: selectedVariant === i ? 'rgba(26,110,216,0.12)' : '#0f172a', color: selectedVariant === i ? '#60a5fa' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                      {v.s}
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: selectedVariant === i ? '#f8fafc' : '#475569', marginTop: 2 }}>${v.p}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Quantity
                  {qty >= 5 && <span style={{ color: '#4ade80', marginLeft: 8, fontSize: 11 }}>{qty >= 10 ? '18% off applied' : '8% off applied'}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '10px 16px', background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>−</button>
                    <span style={{ padding: '0 14px', fontSize: 15, fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => setQty(q => q + 1)} style={{ padding: '10px 16px', background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
                  </div>
                  {qty < 5 && <div style={{ fontSize: 11, color: '#334155' }}>Buy 5+ for 8% · 10+ for 18%</div>}
                </div>
              </div>

              {/* Price display */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: '#4ade80', letterSpacing: '-1px' }}>${lineTotal.toFixed(2)}</div>
                {qty > 1 && <div style={{ fontSize: 13, color: '#475569' }}>${variant.p} × {qty}</div>}
              </div>
              <div style={{ fontSize: 12, color: '#334155', marginBottom: 24 }}>Free shipping on orders over $150 · For research use only</div>

              {/* CTA */}
              <button onClick={handleAddToCart}
                style={{ width: '100%', background: added ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#1a6ed8,#2563eb)', border: 'none', color: '#fff', fontSize: 16, fontWeight: 800, padding: '17px 28px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, transition: 'background .3s', letterSpacing: '-0.2px' }}>
                {added ? '✓ Added to Cart!' : `🛒 Add to Cart — $${lineTotal.toFixed(2)}`}
              </button>
              <button onClick={() => router.push('/')}
                style={{ width: '100%', background: 'transparent', border: '1px solid #334155', color: '#64748b', fontSize: 14, fontWeight: 700, padding: '13px 28px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                Browse Full Catalog →
              </button>

              {/* Trust */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 22, paddingTop: 22, borderTop: '1px solid #1e293b' }}>
                {[['🔬', 'Research Grade'], ['🧪', '≥99% Purity'], ['🚀', 'Fast Ship'], ['🔒', 'Secure']].map(([icon, label]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{icon}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Research section */}
        {product.research && (
          <div style={{ borderTop: '1px solid #1e293b' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1a6ed8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Research Data</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 36px', letterSpacing: '-0.5px' }}>{product.name} — Scientific Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18, marginBottom: 20 }}>
                {[
                  ['⚙️ Mechanism of Action', product.research.mechanism],
                  ['🧬 Pharmacology', product.research.pharmacology],
                  ['📖 Research & Studies', product.research.research],
                  ['❄️ Storage & Handling', product.research.storage],
                ].filter(([, c]) => c).map(([title, content]) => (
                  <div key={title} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: '22px 24px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>{title}</div>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.85, margin: 0 }}>{content}</p>
                  </div>
                ))}
              </div>

              {product.research.specs?.length > 0 && (
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>📋 Technical Specifications</div>
                  {product.research.specs.map(([label, value], i) => (
                    <div key={i} style={{ padding: '13px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: i % 2 === 0 ? '#0f172a' : '#060d1a', borderBottom: i < product.research.specs.length - 1 ? '1px solid #060d1a' : 'none' }}>
                      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related */}
        {PRODUCTS_WITH_SLUGS.filter(p => p.cat === product.cat && p.id !== product.id).length > 0 && (
          <div style={{ borderTop: '1px solid #1e293b' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1a6ed8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>More in {cat.label}</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 24px' }}>Related Compounds</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 12 }}>
                {PRODUCTS_WITH_SLUGS.filter(p => p.cat === product.cat && p.id !== product.id).slice(0, 5).map(p => (
                  <div key={p.id} onClick={() => router.push(`/products/${p.slug}`)}
                    style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'border-color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#1a6ed8'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', marginBottom: 6, lineHeight: 1.3 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 700 }}>from ${p.variants[0].p}</div>
                    {p.badge && <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>{p.badge}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #1e293b', padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#334155', margin: 0, maxWidth: 640, marginInline: 'auto', lineHeight: 1.7 }}>
            ⚗️ <strong style={{ color: '#475569' }}>Aeterion Labs</strong> — All products are for research purposes only. Not for human use. Not intended to diagnose, treat, cure, or prevent any disease.
          </p>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: PRODUCTS_WITH_SLUGS.map(p => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const product = PRODUCTS_WITH_SLUGS.find(p => p.slug === params.slug) || null;
  if (!product) return { notFound: true };
  return { props: { product } };
}
