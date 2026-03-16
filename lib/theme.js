// lib/theme.js
// Shared design tokens and style helpers used across components

export const T = {
  bg:       "#f5f7fa",
  white:    "#ffffff",
  border:   "#e8ecf0",
  blue:     "#1a6ed8",
  blueSoft: "#eff5ff",
  blueHov:  "#1558b0",
  text:     "#111827",
  sub:      "#5a6475",
  muted:    "#6b7280",
  green:    "#16a34a",
  greenSoft:"#f0fdf4",
  red:      "#dc2626",
  shadow:   "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
  shadowHov:"0 4px 20px rgba(26,110,216,0.16), 0 1px 4px rgba(0,0,0,0.06)",
};

export const fmt = n => `$${n.toFixed(2)}`;

export const btnPrimary = (ex = {}) => ({
  background: T.blue, color: "#fff", border: "none", borderRadius: 10,
  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  transition: "background .15s",
  ...ex,
});

export const btnOutline = (ex = {}) => ({
  background: "transparent", color: T.blue, border: `1.5px solid ${T.blue}`,
  borderRadius: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  ...ex,
});
