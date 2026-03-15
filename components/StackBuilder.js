// components/StackBuilder.js
// Enhanced "Build My Stack" quiz + results component.
// Uses local recommendation engine (lib/stackIntelligence.js) as primary,
// with optional AI enhancement via /api/generate-stack for richer copy.

import { useState, useEffect, useCallback, useRef } from 'react';
import { PRODUCTS } from '../lib/products';

// ──────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────

const BLUE = "#1a6ed8";
const BG_DARK = "#020817";
const BG_CARD = "#0f172a";
const BORDER = "#1e293b";
const BORDER_HOVER = "#334155";
const TEXT = "#f8fafc";
const TEXT_DIM = "#94a3b8";
const TEXT_MUTED = "#64748b";
const TEXT_DARK = "#475569";
const GREEN = "#4ade80";
const AMBER = "#f59e0b";

const SECONDARY_OPTS = {
  fat: [
    { label: "Gut Health", desc: "Intestinal lining, microbiome support", val: "gut" },
    { label: "Energy & Mitochondria", desc: "Cellular energy, ATP production", val: "energy" },
    { label: "Inflammation Control", desc: "Systemic inflammation, cytokines", val: "inflammation" },
    { label: "Sleep & Recovery", desc: "Sleep quality, overnight repair", val: "sleep" },
    { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
  ],
  recovery: [
    { label: "Immune Modulation", desc: "T-cell function, immune aging", val: "immune" },
    { label: "Collagen & Skin", desc: "Collagen synthesis, wound repair", val: "collagen" },
    { label: "Gut Protection", desc: "GI lining, intestinal repair", val: "gut" },
    { label: "Sleep Optimization", desc: "Sleep architecture, GH pulse", val: "sleep" },
    { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
  ],
  growth: [
    { label: "Fat Oxidation", desc: "Lipolysis, body recomposition", val: "fatox" },
    { label: "Joint & Tendon Health", desc: "Connective tissue, mobility", val: "joint" },
    { label: "Recovery Acceleration", desc: "Tissue repair alongside growth", val: "inflammation" },
    { label: "Sleep & GH Pulse", desc: "Sleep quality, nocturnal GH release", val: "ghpulse" },
    { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
  ],
  neuro: [
    { label: "Anxiety & Stress", desc: "Anxiolytic support, stress resilience", val: "anxiety" },
    { label: "Neuroprotection", desc: "BDNF, neuroplasticity, nerve repair", val: "neuroprotection" },
    { label: "Sleep Architecture", desc: "Delta sleep, circadian optimization", val: "sleep" },
    { label: "Mood & Motivation", desc: "Dopaminergic pathways, drive", val: "mood" },
    { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
  ],
  longevity: [
    { label: "Metabolic Health", desc: "Insulin sensitivity, mitochondrial efficiency", val: "metabolic" },
    { label: "Immune Resilience", desc: "Thymic restoration, immune aging", val: "immune" },
    { label: "Cardiovascular", desc: "Cardioprotective peptides, heart health", val: "cardio" },
    { label: "Skin & Regeneration", desc: "Collagen, wound healing, GHK-Cu", val: "skin" },
    { label: "No secondary focus", desc: "Keep it focused on my primary goal", val: "none" },
  ],
};

const QUESTIONS = [
  {
    q: "What is your primary research goal?",
    sub: "This determines the foundation of your protocol.",
    key: "goal",
    icon: "🎯",
    opts: [
      { label: "Fat Loss & Metabolic", desc: "GLP-1s, fat oxidation, metabolic optimization", val: "fat" },
      { label: "Recovery & Healing", desc: "Tissue repair, injury recovery, inflammation", val: "recovery" },
      { label: "Muscle & Body Composition", desc: "GH axis, IGF-1, anabolism, body recomp", val: "growth" },
      { label: "Cognitive Enhancement", desc: "Focus, memory, neurogenesis, mood", val: "neuro" },
      { label: "Longevity & Anti-Aging", desc: "Cellular health, telomeres, senescence", val: "longevity" },
    ],
  },
  {
    q: "Any secondary focus?",
    sub: "Optional — helps fine-tune your protocol.",
    key: "secondary",
    icon: "🔬",
    dynamic: true,
  },
  {
    q: "What is your experience level?",
    sub: "Be honest — this shapes complexity and compound selection.",
    key: "exp",
    icon: "📊",
    opts: [
      { label: "First Protocol", desc: "New to research peptides — simple and well-studied compounds", val: "beginner" },
      { label: "Intermediate", desc: "Some experience with peptide protocols", val: "intermediate" },
      { label: "Advanced Researcher", desc: "Extensive experience — open to cutting-edge compounds", val: "advanced" },
    ],
  },
  {
    q: "How long is your research cycle?",
    sub: "Longer cycles allow more compounds and layering.",
    key: "cycle",
    icon: "📅",
    opts: [
      { label: "8 Weeks", desc: "Short, focused protocol", val: "8wk" },
      { label: "12 Weeks", desc: "Standard research cycle", val: "12wk" },
      { label: "16 Weeks", desc: "Extended, comprehensive protocol", val: "16wk" },
    ],
  },
  {
    q: "What is your budget range?",
    sub: "We will build the best protocol within your range.",
    key: "budget",
    icon: "💰",
    opts: [
      { label: "Essentials", desc: "$100 – $250 per cycle", val: "low" },
      { label: "Standard", desc: "$250 – $500 per cycle", val: "mid" },
      { label: "Premium", desc: "$500+ per cycle — no compromises", val: "high" },
    ],
  },
];

const ROLE_COLORS = {
  Foundation: { bg: "rgba(26,110,216,0.12)", border: "rgba(26,110,216,0.3)", text: BLUE },
  Amplifier: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)", text: "#a855f7" },
  Support: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", text: "#22c55e" },
  Optimizer: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: AMBER },
};

const VALUE_TIER_LABELS = {
  budget: { label: "Essentials", color: "#22c55e", desc: "Cost-effective foundation" },
  balanced: { label: "Balanced", color: BLUE, desc: "Best value-to-coverage ratio" },
  premium: { label: "Premium", color: "#a855f7", desc: "Comprehensive protocol" },
};

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────

export default function StackBuilder({ onClose, addCart, setCartOpen }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [removedIds, setRemovedIds] = useState(new Set());
  const [swappedProducts, setSwappedProducts] = useState({});
  const [showAltsFor, setShowAltsFor] = useState(null);
  const openedAt = useRef(Date.now());
  const containerRef = useRef(null);

  const totalSteps = QUESTIONS.length;

  // Get current question with dynamic options
  const getQuestion = () => {
    const q = QUESTIONS[step];
    if (q.dynamic && q.key === "secondary") {
      return { ...q, opts: SECONDARY_OPTS[answers.goal] || SECONDARY_OPTS.recovery };
    }
    return q;
  };

  // Handle option selection
  const selectOption = (key, val) => {
    const newAnswers = { ...answers, [key]: val };
    setAnswers(newAnswers);

    if (step + 1 >= totalSteps) {
      generateStack(newAnswers);
    } else {
      setStep(step + 1);
    }
  };

  // Generate stack using local engine + optional AI enhancement
  const generateStack = async (ans) => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ans),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setResult(data);
      setAiEnhanced(!!data.aiEnhanced);
    } catch (err) {
      console.error("Stack generation error:", err);
      // Fallback: call local engine directly via a simple endpoint
      try {
        const res2 = await fetch("/api/generate-stack?fallback=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ans),
        });
        if (res2.ok) {
          const data2 = await res2.json();
          setResult(data2);
        }
      } catch {
        // Last resort: set a minimal result
        setResult({
          protocolName: "Custom Research Protocol",
          tagline: "A personalized protocol based on your research goals.",
          compounds: [],
          alternatives: {},
          totalPrice: 0,
          valueTier: "balanced",
          complementCount: 0,
          protocolTip: "Please try again or browse our catalog to find compounds that match your goals.",
        });
      }
    }
    setLoading(false);
  };

  // Safe close (prevent accidental close on quick clicks)
  const safeClose = (e) => {
    if (Date.now() - openedAt.current < 400) return;
    if (e.target === e.currentTarget) onClose();
  };

  // Get active compounds (after removals and swaps)
  const getActiveCompounds = () => {
    if (!result?.compounds) return [];
    return result.compounds
      .filter(c => !removedIds.has(c.id))
      .map(c => {
        if (swappedProducts[c.id]) return swappedProducts[c.id];
        return c;
      });
  };

  // Calculate active total
  const getActiveTotal = () => {
    return getActiveCompounds().reduce((sum, c) => sum + (c.price || 0), 0);
  };

  // Remove a compound from the stack
  const removeCompound = (id) => {
    setRemovedIds(prev => new Set([...prev, id]));
    setShowAltsFor(null);
  };

  // Swap a compound with an alternative
  const swapCompound = (originalId, alt) => {
    const product = PRODUCTS.find(p => p.id === alt.id);
    if (!product) return;
    const variant = product.variants.find(v => v.s === alt.size) || product.variants[0];
    setSwappedProducts(prev => ({
      ...prev,
      [originalId]: {
        id: alt.id,
        name: alt.name,
        recommendedSize: variant.s,
        price: variant.p,
        role: "Support",
        reason: alt.reason,
        category: result.compounds.find(c => c.id === originalId)?.category || "",
        form: product.form,
        highlights: product.highlights,
        swappedFrom: originalId,
      },
    }));
    setShowAltsFor(null);
  };

  // Add all active compounds to cart
  const addAllToCart = () => {
    const active = getActiveCompounds();
    let added = 0;
    active.forEach(c => {
      const prod = PRODUCTS.find(p => p.id === c.id) ||
        PRODUCTS.find(p => {
          const a = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const b = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return a === b || a.includes(b) || b.includes(a);
        });
      if (prod) {
        const variant = prod.variants.find(v => v.s === c.recommendedSize) || prod.variants[0];
        addCart(prod, variant, 1, variant.p);
        added++;
      }
    });
    if (added > 0) {
      setCartOpen(true);
      onClose();
    }
  };

  // Add single compound to cart
  const addSingleToCart = (compound) => {
    const prod = PRODUCTS.find(p => p.id === compound.id) ||
      PRODUCTS.find(p => {
        const a = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const b = compound.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return a === b || a.includes(b) || b.includes(a);
      });
    if (prod) {
      const variant = prod.variants.find(v => v.s === compound.recommendedSize) || prod.variants[0];
      addCart(prod, variant, 1, variant.p);
      setCartOpen(true);
    }
  };

  // Rebuild
  const rebuild = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
    setLoading(false);
    setRemovedIds(new Set());
    setSwappedProducts({});
    setShowAltsFor(null);
    setAiEnhanced(false);
  };

  // ──────────────────────────────────────────────────────────────
  // LOADING STATE
  // ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={overlayStyle} onClick={safeClose}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 28px" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              border: "3px solid rgba(26,110,216,0.15)",
              borderTopColor: BLUE,
              animation: "stackSpin 1s linear infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
            }}>⚗️</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 10, letterSpacing: "-0.3px" }}>
            Building your protocol...
          </div>
          <div style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.6, marginBottom: 28 }}>
            Analyzing {PRODUCTS.length} compounds against your profile
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
            {["Scoring relevance", "Checking compatibility", "Selecting optimal stack"].map((label, i) => (
              <div key={i} style={{
                fontSize: 11, color: TEXT_DIM, background: BG_CARD, border: `1px solid ${BORDER}`,
                borderRadius: 20, padding: "6px 12px", fontWeight: 600,
                animation: `fadeInStep 0.3s ease ${i * 0.4}s both`,
              }}>{label}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: BLUE,
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes stackSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
          @keyframes pulse { 0%,80%,100% { opacity:.3; transform:scale(.8) } 40% { opacity:1; transform:scale(1.2) } }
          @keyframes fadeInStep { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        `}</style>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // RESULTS VIEW
  // ──────────────────────────────────────────────────────────────

  if (result) {
    const activeCompounds = getActiveCompounds();
    const activeTotal = getActiveTotal();
    const tier = VALUE_TIER_LABELS[result.valueTier] || VALUE_TIER_LABELS.balanced;

    return (
      <div style={overlayStyle} onClick={safeClose}>
        <div ref={containerRef} style={{
          maxWidth: 680, width: "100%", position: "relative",
          padding: "40px 20px 40px",
        }}>
          {/* Close button */}
          <button onClick={onClose} aria-label="Close" style={closeButtonStyle}>×</button>

          {/* Header */}
          <div style={{ marginBottom: 8 }}>
            <span style={labelStyle}>Your Protocol</span>
          </div>
          <div style={{
            fontSize: 28, fontWeight: 900, color: TEXT,
            letterSpacing: "-0.5px", lineHeight: 1.15, marginBottom: 6,
          }}>
            {result.protocolName}
          </div>
          <div style={{ fontSize: 14, color: TEXT_DIM, lineHeight: 1.6, marginBottom: 16 }}>
            {result.tagline}
          </div>

          {/* Value tier + total */}
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 28,
          }}>
            <div style={{
              background: `${tier.color}15`, border: `1px solid ${tier.color}30`,
              borderRadius: 20, padding: "5px 14px", display: "flex", alignItems: "center", gap: 6,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: tier.color }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: tier.color }}>{tier.label}</span>
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: TEXT_DIM,
            }}>
              {activeCompounds.length} compound{activeCompounds.length !== 1 ? "s" : ""}
            </div>
            <div style={{
              fontSize: 15, fontWeight: 800, color: GREEN, marginLeft: "auto",
            }}>
              ${activeTotal.toFixed(0)} estimated
            </div>
          </div>

          {/* Compounds list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {activeCompounds.map((c, i) => {
              const roleStyle = ROLE_COLORS[c.role] || ROLE_COLORS.Support;
              const alts = result.alternatives?.[c.swappedFrom || c.id] || [];
              const isShowingAlts = showAltsFor === (c.swappedFrom || c.id);

              return (
                <div key={c.id + "-" + i}>
                  <div style={{
                    background: BG_CARD, border: `1px solid ${BORDER}`,
                    borderRadius: 14, padding: "18px 20px",
                    transition: "border-color 0.15s",
                  }}>
                    {/* Top row: number + name + role + size + price */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{
                        background: `linear-gradient(135deg, ${BLUE}, #2563eb)`,
                        color: "#fff", borderRadius: 8, width: 32, height: 32,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 900, fontSize: 13, flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8,
                          flexWrap: "wrap", marginBottom: 6,
                        }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{c.name}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 800, color: roleStyle.text,
                            background: roleStyle.bg, border: `1px solid ${roleStyle.border}`,
                            borderRadius: 20, padding: "2px 8px",
                            textTransform: "uppercase", letterSpacing: 0.8,
                          }}>{c.role}</span>
                        </div>

                        {/* Size + price + category */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10,
                          flexWrap: "wrap", marginBottom: 8,
                        }}>
                          {c.recommendedSize && (
                            <span style={{
                              fontSize: 11, fontWeight: 700, color: AMBER,
                              background: `${AMBER}15`, border: `1px solid ${AMBER}30`,
                              borderRadius: 20, padding: "2px 8px",
                            }}>{c.recommendedSize}</span>
                          )}
                          {c.price > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 700, color: GREEN }}>${c.price}</span>
                          )}
                          {c.category && (
                            <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>{c.category}</span>
                          )}
                        </div>

                        {/* Why this compound */}
                        <div style={{ fontSize: 13, color: TEXT_DIM, lineHeight: 1.6, marginBottom: 6 }}>
                          {c.reason}
                        </div>

                        {/* Highlights */}
                        {c.highlights && c.highlights.length > 0 && (
                          <div style={{
                            display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8,
                          }}>
                            {c.highlights.slice(0, 3).map((h, hi) => (
                              <span key={hi} style={{
                                fontSize: 10, color: TEXT_MUTED, background: "rgba(100,116,139,0.1)",
                                border: `1px solid ${BORDER}`, borderRadius: 6, padding: "2px 6px",
                              }}>{h}</span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                          <button
                            onClick={() => addSingleToCart(c)}
                            style={{
                              background: BORDER, border: `1px solid ${BORDER_HOVER}`,
                              color: TEXT_DIM, fontSize: 11, fontWeight: 700,
                              padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >+ Cart</button>
                          {alts.length > 0 && (
                            <button
                              onClick={() => setShowAltsFor(isShowingAlts ? null : (c.swappedFrom || c.id))}
                              style={{
                                background: "transparent", border: `1px solid ${BORDER}`,
                                color: TEXT_MUTED, fontSize: 11, fontWeight: 600,
                                padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >{isShowingAlts ? "Hide" : "Swap"}</button>
                          )}
                          <button
                            onClick={() => removeCompound(c.swappedFrom || c.id)}
                            style={{
                              background: "transparent", border: `1px solid ${BORDER}`,
                              color: TEXT_DARK, fontSize: 11, fontWeight: 600,
                              padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >Remove</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alternatives panel */}
                  {isShowingAlts && alts.length > 0 && (
                    <div style={{
                      marginTop: 4, marginLeft: 46, display: "flex", flexDirection: "column", gap: 6,
                    }}>
                      <div style={{
                        fontSize: 11, fontWeight: 700, color: TEXT_MUTED,
                        textTransform: "uppercase", letterSpacing: 1, padding: "4px 0",
                      }}>Alternatives</div>
                      {alts.map((alt, ai) => (
                        <div key={ai} style={{
                          background: "rgba(15,23,42,0.6)", border: `1px solid ${BORDER}`,
                          borderRadius: 10, padding: "12px 14px",
                          display: "flex", alignItems: "center", gap: 12,
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{alt.name}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 700,
                                color: alt.type === "upgrade" ? "#a855f7" : alt.type === "budget" ? "#22c55e" : BLUE,
                                background: alt.type === "upgrade" ? "rgba(168,85,247,0.1)" : alt.type === "budget" ? "rgba(34,197,94,0.1)" : `${BLUE}15`,
                                border: `1px solid ${alt.type === "upgrade" ? "rgba(168,85,247,0.3)" : alt.type === "budget" ? "rgba(34,197,94,0.3)" : `${BLUE}30`}`,
                                borderRadius: 20, padding: "2px 8px", textTransform: "uppercase",
                              }}>
                                {alt.type === "upgrade" ? "More Advanced" : alt.type === "budget" ? "Budget Option" : "Alternative"}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: TEXT_MUTED }}>{alt.reason}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: GREEN, marginTop: 4 }}>${alt.price} · {alt.size}</div>
                          </div>
                          <button
                            onClick={() => swapCompound(c.swappedFrom || c.id, alt)}
                            style={{
                              background: BLUE, border: "none", color: "#fff",
                              fontSize: 11, fontWeight: 700, padding: "6px 14px",
                              borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                              whiteSpace: "nowrap", flexShrink: 0,
                            }}
                          >Swap</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Protocol tip */}
          {result.protocolTip && (
            <div style={{
              background: `${BLUE}0d`, border: `1px solid ${BLUE}25`,
              borderRadius: 12, padding: "14px 18px", marginBottom: 20,
              fontSize: 13, color: TEXT_DIM, lineHeight: 1.6,
            }}>
              <strong style={{ color: "#60a5fa" }}>Protocol Tip:</strong> {result.protocolTip}
            </div>
          )}

          {/* Stack summary */}
          {activeCompounds.length > 0 && (
            <div style={{
              background: BG_CARD, border: `1px solid ${BORDER}`,
              borderRadius: 14, padding: "16px 20px", marginBottom: 20,
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_DIM }}>Stack Total</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: TEXT }}>${activeTotal.toFixed(0)}</span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                  {activeCompounds.length} compound{activeCompounds.length !== 1 ? "s" : ""} · {tier.desc}
                </span>
                {activeTotal >= 250 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>Free shipping</span>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{
            fontSize: 11, color: TEXT_DARK, marginBottom: 20, lineHeight: 1.6,
            padding: "10px 14px", background: "rgba(71,85,105,0.08)",
            borderRadius: 8, border: `1px solid rgba(71,85,105,0.15)`,
          }}>
            For research purposes only. This tool provides educational guidance based on published research and is not medical advice. Consult a qualified professional before beginning any research protocol.
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {activeCompounds.length > 0 && (
              <button onClick={addAllToCart} style={{
                flex: 1, minWidth: 180,
                background: `linear-gradient(135deg, ${BLUE}, #2563eb)`,
                border: "none", color: "#fff", fontSize: 15, fontWeight: 800,
                padding: "16px 24px", borderRadius: 12, cursor: "pointer",
                fontFamily: "inherit", letterSpacing: "-0.2px",
                boxShadow: "0 4px 20px rgba(26,110,216,0.25)",
              }}>
                Add Stack to Cart — ${activeTotal.toFixed(0)}
              </button>
            )}
            <button onClick={rebuild} style={{
              background: BORDER, border: `1px solid ${BORDER_HOVER}`,
              color: TEXT_DIM, fontSize: 13, fontWeight: 700,
              padding: "16px 20px", borderRadius: 12, cursor: "pointer",
              fontFamily: "inherit",
            }}>↺ Rebuild</button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // QUIZ VIEW
  // ──────────────────────────────────────────────────────────────

  const q = getQuestion();

  return (
    <div style={overlayStyle} onClick={safeClose}>
      <div style={{
        maxWidth: 560, width: "100%", position: "relative",
        padding: "40px 20px 40px",
      }}>
        {/* Close */}
        <button onClick={onClose} aria-label="Close quiz" style={closeButtonStyle}>×</button>

        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
          }}>
            <span style={labelStyle}>Build Your Stack</span>
            <span style={{ fontSize: 11, color: TEXT_DARK, fontWeight: 700 }}>
              {step + 1} of {totalSteps}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ background: BORDER, borderRadius: 99, height: 3, overflow: "hidden" }}>
            <div style={{
              background: `linear-gradient(90deg, ${BLUE}, #60a5fa)`,
              borderRadius: 99, height: 3,
              width: `${((step + 1) / totalSteps) * 100}%`,
              transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
            }} />
          </div>
          {/* Step indicators */}
          <div style={{
            display: "flex", justifyContent: "space-between", marginTop: 10,
          }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{
                width: 20, height: 20, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700,
                background: i < step ? BLUE : i === step ? `${BLUE}30` : "transparent",
                color: i <= step ? (i < step ? "#fff" : BLUE) : TEXT_DARK,
                border: i === step ? `1.5px solid ${BLUE}` : "1.5px solid transparent",
                transition: "all 0.3s ease",
              }}>{i < step ? "✓" : i + 1}</div>
            ))}
          </div>
        </div>

        {/* Question */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
          }}>
            {q.icon && <span style={{ fontSize: 22 }}>{q.icon}</span>}
            <div style={{
              fontSize: 24, fontWeight: 900, color: TEXT,
              letterSpacing: "-0.3px", lineHeight: 1.2,
            }}>{q.q}</div>
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5 }}>{q.sub}</div>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
          {q.opts.map(opt => (
            <button
              key={opt.val}
              onClick={() => selectOption(q.key, opt.val)}
              style={{
                background: BG_CARD,
                border: `1.5px solid ${BORDER}`,
                color: TEXT, fontSize: 14, fontWeight: 600,
                padding: "14px 18px", borderRadius: 12,
                cursor: "pointer", fontFamily: "inherit",
                textAlign: "left", display: "flex",
                alignItems: "center", gap: 14,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = BLUE;
                e.currentTarget.style.background = "#0f1f3d";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.background = BG_CARD;
              }}
            >
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: BLUE, flexShrink: 0,
              }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 400 }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Back button */}
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              marginTop: 18, background: "none", border: "none",
              color: TEXT_DARK, fontSize: 13, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 600,
            }}
          >← Back</button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SHARED STYLES
// ──────────────────────────────────────────────────────────────

const overlayStyle = {
  position: "fixed", inset: 0,
  background: "rgba(2,8,23,0.97)",
  zIndex: 9000,
  display: "flex", alignItems: "flex-start", justifyContent: "center",
  overflowY: "auto", WebkitOverflowScrolling: "touch",
};

const closeButtonStyle = {
  position: "absolute", top: 8, right: 0,
  background: "none", border: "none",
  color: TEXT_DIM, fontSize: 24, cursor: "pointer",
  width: 36, height: 36,
  display: "flex", alignItems: "center", justifyContent: "center",
  borderRadius: 8,
};

const labelStyle = {
  fontSize: 11, fontWeight: 800, color: BLUE,
  letterSpacing: 2, textTransform: "uppercase",
};
