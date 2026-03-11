// pages/ambassador/apply.js
// Public application form for prospective ambassadors

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const T = {
  bg: '#f8fafc',
  navy: '#0f172a',
  blue: '#1a6ed8',
  text: '#111827',
  muted: '#6b7280',
  border: '#e2e8f0',
  white: '#ffffff',
  red: '#dc2626',
  redLight: '#fef2f2',
  green: '#16a34a',
  greenLight: '#dcfce7',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: `1.5px solid ${T.border}`,
  fontSize: 15,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
  background: T.white,
  color: T.text,
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: T.text,
  marginBottom: 6,
};

export default function AmbassadorApply() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    instagram: '',
    audience_size: '',
    why_aeterion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ambassador/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Become an Ambassador — Aeterion</title>
        <meta name="description" content="Join the Aeterion ambassador program and earn 20% commission on every sale you refer." />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: T.navy,
        fontFamily: "'DM Sans', sans-serif",
        padding: '60px 20px',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ color: T.white, fontWeight: 700, fontSize: 22, letterSpacing: '-0.5px' }}>
                Aeterion
              </span>
            </Link>
            <h1 style={{ color: T.white, fontSize: 32, fontWeight: 800, margin: '16px 0 12px' }}>
              Become an Ambassador
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 16, margin: 0, lineHeight: 1.6 }}>
              Partner with Aeterion and earn <strong style={{ color: T.white }}>20% commission</strong> on 
              every order placed with your personal code. Your clients get 10% off — everyone wins.
            </p>
          </div>

          {/* Perks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 32,
          }}>
            {[
              { icon: '💰', title: '20% Commission', desc: 'On every sale' },
              { icon: '🎁', title: '10% Off', desc: 'For your clients' },
              { icon: '📊', title: 'Live Dashboard', desc: 'Track earnings' },
            ].map(p => (
              <div key={p.title} style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 14,
                padding: '20px 16px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ color: T.white, fontWeight: 700, fontSize: 14 }}>{p.title}</div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div style={{
            background: T.white,
            borderRadius: 20,
            padding: '40px 36px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>
                  Application Received!
                </h2>
                <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.6, margin: '0 0 24px' }}>
                  Thanks for applying! We review applications within 2–3 business days. 
                  If approved, you'll receive your login credentials and promo code by email.
                </p>
                <Link href="/" style={{
                  display: 'inline-block',
                  background: T.blue,
                  color: T.white,
                  borderRadius: 12,
                  padding: '12px 28px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                }}>
                  Back to Store
                </Link>
              </div>
            ) : (
              <>
                <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: T.text }}>
                  Your Application
                </h2>

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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Jane Smith"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address *</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="jane@example.com"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={labelStyle}>Instagram / Platform</label>
                      <input
                        name="instagram"
                        value={form.instagram}
                        onChange={handleChange}
                        placeholder="@yourhandle"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Audience Size</label>
                      <select
                        name="audience_size"
                        value={form.audience_size}
                        onChange={handleChange}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="">Select range</option>
                        <option>Under 1,000</option>
                        <option>1,000 – 5,000</option>
                        <option>5,000 – 20,000</option>
                        <option>20,000 – 100,000</option>
                        <option>100,000+</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <label style={labelStyle}>Why do you want to partner with Aeterion?</label>
                    <textarea
                      name="why_aeterion"
                      value={form.why_aeterion}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us about your audience, how you'd promote our products, and why you're a good fit..."
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 12,
                      background: loading ? T.muted : T.blue,
                      color: T.white,
                      fontSize: 16,
                      fontWeight: 600,
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/ambassador" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>
              Already an ambassador? Sign in →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
