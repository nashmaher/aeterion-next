# Aeterion → Next.js Migration Guide

## Why This Migration Fixes Your SEO

Your current site is a **Vite React SPA**. When Google crawls it, it receives a blank HTML shell
because all content is rendered by JavaScript *after* the page loads. Google can't execute JavaScript
reliably, so `site:aeterionpeptides.com` returns nothing.

**After this migration:** Every page is pre-rendered to HTML on the server at build time.
Google receives a fully-populated HTML page with all product names, descriptions, prices, and
research content. You'll also get **80 individual product URLs** (`/products/semaglutide`,
`/products/tirzepatide`, etc.) that Google can discover, crawl, and index independently.

---

## What You're Getting

| Feature | Before (Vite) | After (Next.js) |
|---|---|---|
| Google sees product content | ❌ No | ✅ Yes |
| Individual product URLs | ❌ No | ✅ 79 URLs |
| Sitemap | ❌ No | ✅ /sitemap.xml |
| robots.txt | ❌ No | ✅ Yes |
| Schema.org structured data | ❌ No | ✅ Per product |
| Store functionality | ✅ Full | ✅ Identical |

---

## Migration Steps

### Step 1: Create a new GitHub repo (or use the same one)

Option A — **New repo** (cleanest):
1. Go to github.com → New repository → name it `aeterion-next`
2. Clone it: `git clone https://github.com/YOUR_USERNAME/aeterion-next.git`

Option B — **Same repo** (replaces current code):
1. Clone your existing repo
2. Delete everything except `.git/`

### Step 2: Copy these files into the root of your repo

```
aeterion-next/
├── package.json           ← copy from this folder
├── next.config.js         ← copy from this folder
├── vercel.json            ← copy from this folder
├── pages/
│   ├── _app.js            ← copy from pages/
│   ├── index.js           ← copy from pages/ (this is your full store)
│   ├── products/
│   │   └── [slug].js      ← copy from pages/products/
│   └── api/
│       ├── create-checkout-session.js  ← copy from pages/api/
│       ├── webhook.js                  ← copy from pages/api/
│       └── update-order.js            ← copy from pages/api/
└── public/
    ├── sitemap.xml        ← copy from public/
    └── robots.txt         ← copy from public/
```

> ⚠️ You do NOT need a `src/` folder, `index.html`, `vite.config.js`, or `tsconfig.json` anymore.
> Those are Vite-specific. The Next.js project replaces all of that.

### Step 3: Push to GitHub

```bash
cd aeterion-next
git add .
git commit -m "Migrate to Next.js for SSR/SEO"
git push origin main
```

### Step 4: Connect to Vercel

If using a **new repo**:
1. Go to vercel.com → New Project → Import from GitHub → select `aeterion-next`
2. Framework: **Next.js** (Vercel auto-detects this)
3. Add your environment variables (same as before):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
4. Click Deploy

If using the **same repo**:
- Vercel should auto-detect the framework change and rebuild
- Go to Vercel dashboard → Settings → Framework → change to Next.js if needed
- Redeploy with "Use existing Build Cache" UNCHECKED

### Step 5: Update your domain (if using new repo)

In Vercel dashboard for the new project:
1. Settings → Domains → Add `aeterionpeptides.com`
2. Remove the domain from the old project

### Step 6: Submit your sitemap to Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property → `aeterionpeptides.com`
3. Verify ownership (HTML file method: download the file, put in `public/` folder, push to GitHub)
4. Sitemaps → Submit → `https://aeterionpeptides.com/sitemap.xml`

Google will now find and index all 80 URLs.

---

## What Changed in the Code

Only **4 small changes** were made to your store component (pages/index.js):

1. **`useState` for `page`** — moved `window.location.hash` read to a `useEffect` (SSR can't access `window`)
2. **`useState` for `user`** — set initial state to `null`, restore session in `useEffect` (same reason)
3. **`import Head from "next/head"`** — added for proper SSR meta tags
4. **`setMeta()` guard** — added `typeof document === "undefined"` check for SSR safety

Everything else — cart, checkout, products, admin panel, auth, modals — is 100% identical.

---

## Expected Timeline to Google Indexing

- **Day 1:** Deploy → submit sitemap → Google starts crawling
- **Days 3–7:** Product pages begin appearing in Google index
- **Week 2–4:** Rankings establish for product name searches
- **Month 2–3:** Organic traffic begins

Run `site:aeterionpeptides.com` in Google after 1 week to confirm indexing.

---

## Troubleshooting

**Build error: `window is not defined`**
→ You have a `window` access somewhere outside `useEffect`. 
→ Wrap it: `if (typeof window !== 'undefined') { ... }`

**Build error: `document is not defined`**
→ Same fix as above for `document`.

**API routes returning 404**
→ Make sure files are in `pages/api/`, not a separate `api/` folder at root.

**Stripe webhook failing**
→ Update webhook URL in Stripe dashboard to `https://aeterionpeptides.com/api/webhook`

---

## Files NOT Needed (delete from Vite project if migrating same repo)

- `src/` directory
- `index.html`
- `vite.config.js` or `vite.config.ts`
- `tsconfig.json` (optional — Next.js works without it)
- `public/index.html` (keep other public assets)
