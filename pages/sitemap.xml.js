// pages/sitemap.xml.js
// Dynamic sitemap including static pages, all 72 product pages, and blog posts
// Served at /sitemap.xml — the standard path Google expects

import { PRODUCTS_WITH_SLUGS } from '../lib/products';

const BASE = 'https://www.aeterionpeptides.com';
const today = () => new Date().toISOString().split('T')[0];

const STATIC_PAGES = [
  { url: '/',           changefreq: 'daily',   priority: '1.0' },
  { url: '/blog',       changefreq: 'daily',   priority: '0.8' },
  { url: '/ambassador', changefreq: 'monthly', priority: '0.5' },
];

function SitemapXml() { return null; }

export async function getServerSideProps({ res }) {
  const now = today();

  // Fetch blog posts from Supabase
  let blogPosts = [];
  try {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
    const r = await fetch(
      `${sbUrl}/rest/v1/blog_posts?select=slug,updated_at&published=eq.true`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } }
    );
    const data = await r.json();
    if (Array.isArray(data)) blogPosts = data;
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map(p => `  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${PRODUCTS_WITH_SLUGS.map(p => `  <url>
    <loc>${BASE}/products/${p.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${['semaglutide','tirzepatide','retatrutide','bpc-157','tb-500-thymosin-beta-4','ipamorelin','mk-677-ibutamoren'].includes(p.slug) ? '0.9' : '0.8'}</priority>
  </url>`).join('\n')}
${blogPosts.map(p => `  <url>
    <loc>${BASE}/blog/${p.slug}</loc>
    <lastmod>${(p.updated_at || now).split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default SitemapXml;
