// pages/ambassador/index.js
// Ambassador Portal — Login + Dashboard
// Deploy to: pages/ambassador/index.js in your GitHub repo

import { useState, useEffect } from 'react';
import Head from 'next/head';

const T = {
  bg: '#f8fafc',
  navy: '#0f172a',
  navyCard: '#1e293b',
  blue: '#1a6ed8',
  blueHover: '#1558b0',
  green: '#16a34a',
  greenLight: '#dcfce7',
  text: '#111827',
  muted: '#6b7280',
  border: '#e2e8f0',
  white: '#ffffff',
  red: '#dc2626',
  redLight: '#fef2f2',
  yellow: '#d97706',
  yellowLight: '#fffbeb',
};

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: '24px 28px',
      flex: 1,
      minWidth: 180,
    }}>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Commission Row ─────────────────────────────────────────
function CommissionRow({ c, idx }) {
  const date = new Date(c.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return (
    <tr style={{ background: idx % 2 === 0 ? T.white : T.bg }}>
      <td style={tdStyle}>{date}</td>
      <td style={tdStyle}>{c.customer_email || '—'}</td>
      <td style={tdStyle}>${Number(c.order_subtotal).toFixed(2)}</td>
      <td style={{ ...tdStyle, color: T.green, fontWeight: 600 }}>
        ${Number(c.commission_amount).toFixed(2)}
      </td>
      <td style={tdStyle}>
        <span style={{
          background: c.status === 'paid' ? T.greenLight : T.yellowLight,
          color: c.status === 'paid' ? T.green : T.yellow,
          borderRadius: 20,
          padding: '3px 12px',
          fontSize: 12,
          fontWeight: 600,
        }}>
          {c.status === 'paid' ? 'Paid' : 'Pending'}
        </span>
      </td>
    </tr>
  );
}

const tdStyle = {
  padding: '14px 16px',
  fontSize: 14,
  color: T.text,
  borderBottom: `1px solid ${T.border}`,
};

const thStyle = {
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: T.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  background: T.bg,
  borderBottom: `2px solid ${T.border}`,
  textAlign: 'left',
};

// ── Login Form ─────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ambassador/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.ambassador);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: T.navy,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: 20,
    }}>
      <div style={{
        background: T.white,
        borderRadius: 20,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: T.blue,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.text }}>Aeterion</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Ambassador Portal</h1>
          <p style={{ color: T.muted, fontSize: 14, marginTop: 6 }}>Sign in to view your commissions</p>
        </div>

        {error && (
          <div style={{
            background: T.redLight,
            border: `1px solid #fca5a5`,
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            color: T.red,
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${T.border}`, fontSize: 15,
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${T.border}`, fontSize: 15,
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: loading ? T.muted : T.blue,
              color: T.white, fontSize: 16, fontWeight: 600,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <a href="/ambassador/apply" style={{ color: T.blue, fontSize: 14, textDecoration: 'none' }}>
            Not an ambassador yet? Apply here →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────
function Dashboard({ ambassador, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/ambassador/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ambassador_id: ambassador.id }),
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ambassador.id]);

  const copyCode = () => {
    navigator.clipboard.writeText(ambassador.promo_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: T.navy,
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: T.blue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <span style={{ color: T.white, fontWeight: 700, fontSize: 16 }}>Aeterion Ambassadors</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Hi, {ambassador.name.split(' ')[0]}</span>
          <button
            onClick={onLogout}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '6px 14px',
              color: T.white,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* Promo Code Banner */}
        <div style={{
          background: `linear-gradient(135deg, ${T.blue} 0%, #1558b0 100%)`,
          borderRadius: 20,
          padding: '32px 36px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
              YOUR PROMO CODE
            </div>
            <div style={{ color: T.white, fontSize: 36, fontWeight: 800, letterSpacing: '0.08em' }}>
              {ambassador.promo_code}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 8 }}>
              Gives your clients 10% off • You earn {ambassador.commission_rate}% commission per sale
            </div>
          </div>
          <button
            onClick={copyCode}
            style={{
              background: copied ? T.greenLight : 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: 12,
              padding: '12px 24px',
              color: copied ? T.green : T.white,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* Stats */}
        {loading ? (
          <div style={{ textAlign: 'center', color: T.muted, padding: 60 }}>Loading your data...</div>
        ) : data ? (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
              <StatCard
                label="Total Orders"
                value={data.stats.totalOrders}
                sub="using your code"
              />
              <StatCard
                label="Commission Earned"
                value={`$${data.stats.totalEarned.toFixed(2)}`}
                sub="all time"
                color={T.blue}
              />
              <StatCard
                label="Awaiting Payout"
                value={`$${data.stats.totalPending.toFixed(2)}`}
                sub="pending payment"
                color={T.yellow}
              />
              <StatCard
                label="Total Paid Out"
                value={`$${data.stats.totalPaid.toFixed(2)}`}
                sub="received"
                color={T.green}
              />
            </div>

            {/* Commission Table */}
            <div style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '24px 28px', borderBottom: `1px solid ${T.border}` }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>
                  Commission History
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: T.muted }}>
                  Every order placed using your code
                </p>
              </div>

              {data.commissions.length === 0 ? (
                <div style={{ padding: '60px 28px', textAlign: 'center', color: T.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>No orders yet</div>
                  <div style={{ fontSize: 14 }}>Share your code to start earning commissions.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Customer</th>
                        <th style={thStyle}>Order Value</th>
                        <th style={thStyle}>Your Commission</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.commissions.map((c, i) => (
                        <CommissionRow key={c.id} c={c} idx={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info box */}
            <div style={{
              background: T.yellowLight,
              border: `1px solid #fde68a`,
              borderRadius: 12,
              padding: '16px 20px',
              marginTop: 24,
              fontSize: 14,
              color: '#92400e',
            }}>
              <strong>Payout info:</strong> Commissions are reviewed and paid out monthly. 
              You'll be contacted at {ambassador.email} when a payout is processed.
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: T.red, padding: 60 }}>
            Failed to load dashboard data. Please refresh.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────
export default function AmbassadorPortal() {
  const [ambassador, setAmbassador] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = sessionStorage.getItem('aeterion_ambassador');
      if (saved) setAmbassador(JSON.parse(saved));
    } catch {}
  }, []);

  const handleLogin = (amb) => {
    setAmbassador(amb);
    try { sessionStorage.setItem('aeterion_ambassador', JSON.stringify(amb)); } catch {}
  };

  const handleLogout = () => {
    setAmbassador(null);
    try { sessionStorage.removeItem('aeterion_ambassador'); } catch {}
  };

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Ambassador Portal — Aeterion</title>
        <meta name="robots" content="noindex" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      {ambassador
        ? <Dashboard ambassador={ambassador} onLogout={handleLogout} />
        : <LoginForm onLogin={handleLogin} />
      }
    </>
  );
}
